using CivicAlert.API.Data;
using CivicAlert.API.DTOs.Reports;
using CivicAlert.API.Models;
using CivicAlert.API.Repositories.Interfaces;
using CivicAlert.API.Responses.Reports;
using CivicAlert.API.Services.Interfaces;
using CivicAlert.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class VerificationService : IVerificationService
    {
        private readonly IVerificationRepository _verificationRepository;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IEmailService _emailService;

        public VerificationService(
            IVerificationRepository verificationRepository,
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IEmailService emailService)
        {
            _verificationRepository = verificationRepository;
            _context = context;
            _hubContext = hubContext;
            _emailService = emailService;
        }

        public async Task<VerifyReportResult> VerifyReportAsync(int userId, VerifyReportDto dto)
        {
            // Fetch the report including its category to update PriorityScore
            var report = await _context.Reports
                .Include(r => r.Category)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == dto.ReportId);

            if (report == null)
            {
                return new VerifyReportResult
                {
                    Success = false,
                    ErrorMessage = "Report not found."
                };
            }

            // Check if user is the reporter
            if (report.UserId == userId)
            {
                return new VerifyReportResult
                {
                    Success = false,
                    ErrorMessage = "You cannot verify your own report."
                };
            }

            // Check if user has already verified this report
            var alreadyVerified = await _verificationRepository.HasUserVerifiedAsync(userId, dto.ReportId);
            if (alreadyVerified)
            {
                return new VerifyReportResult
                {
                    Success = false,
                    ErrorMessage = "You already verified this report."
                };
            }

            // Save verification
            var verification = new ReportVerification
            {
                ReportId = dto.ReportId,
                UserId = userId,
                VoteType = dto.IsConfirm ? "Confirm" : "Dispute",
                CreatedAt = DateTime.UtcNow
            };

            await _verificationRepository.CreateAsync(verification);

            // Fetch current confirmation count (VoteType == "Confirm")
            int confirmCount = await _verificationRepository.GetVerificationCountAsync(dto.ReportId);

            // Recalculate PriorityScore
            // Formula: (Category.DefaultPriority * 10) + (Confirms * 5) + (IsEmergency ? 50 : 0)
            int defaultPriority = report.Category?.DefaultPriority ?? 1;
            report.PriorityScore = (defaultPriority * 10) + (confirmCount * 5) + (report.IsEmergency ? 50 : 0);
            report.UpdatedAt = DateTime.UtcNow;

            string oldStatus = report.Status;
            string newStatus = oldStatus;

            Notification? statusNotification = null;

            // If confirms >= 3 and status is Reported -> promotion
            if (confirmCount >= 3 && oldStatus == "Reported")
            {
                newStatus = "Verified";
                report.Status = newStatus;

                var history = new StatusHistory
                {
                    ReportId = report.Id,
                    ChangedByUserId = userId,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    Note = "System auto-promotion: report verified by 3 community confirmations.",
                    ChangedAt = DateTime.UtcNow
                };

                await _context.StatusHistories.AddAsync(history);

                // Setup notification for the reporter
                statusNotification = new Notification
                {
                    UserId = report.UserId,
                    ReportId = report.Id,
                    Message = $"Your report '{report.Title}' is now Verified",
                    Type = "StatusChanged",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Notifications.AddAsync(statusNotification);

                if (report.User != null)
                {
                    _emailService.SendStatusChangedEmailAsync(report.User.Email, report.User.FullName, report.Title, oldStatus, newStatus);
                }
            }

            await _context.SaveChangesAsync();

            // Broadcast real-time notification to the reporter if status changed
            if (statusNotification != null)
            {
                await _hubContext.Clients.Group($"user_{report.UserId}").SendAsync("ReceiveNotification", new
                {
                    Id = statusNotification.Id,
                    UserId = statusNotification.UserId,
                    ReportId = statusNotification.ReportId,
                    Message = statusNotification.Message,
                    Type = statusNotification.Type,
                    IsRead = statusNotification.IsRead,
                    CreatedAt = statusNotification.CreatedAt
                });
            }

            return new VerifyReportResult
            {
                Success = true,
                ConfirmCount = confirmCount,
                NewStatus = newStatus
            };
        }
    }
}
