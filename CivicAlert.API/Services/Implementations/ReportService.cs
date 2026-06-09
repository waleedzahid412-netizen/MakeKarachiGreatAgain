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
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly IPhotoService _photoService;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IEmailService _emailService;
        private readonly IAIService _aiService;

        public ReportService(
            IReportRepository reportRepository,
            IPhotoService photoService,
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IEmailService emailService,
            IAIService aiService)
        {
            _reportRepository = reportRepository;
            _photoService = photoService;
            _context = context;
            _hubContext = hubContext;
            _emailService = emailService;
            _aiService = aiService;
        }

        public async Task<ReportDetailResponse> CreateReportAsync(CreateReportDto dto, int userId, CancellationToken ct = default)
        {
            // Rate limit: 1 report per 10 minutes per user
            var since = DateTime.UtcNow.AddMinutes(-10);
            var recentCount = await _reportRepository.CountRecentByUserAsync(userId, since, ct);
            if (recentCount > 0)
            {
                throw new InvalidOperationException("Rate limit exceeded. You can only submit 1 report every 10 minutes.");
            }

            // Get category to calculate priority
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.CategoryId, ct);

            if (category == null)
                throw new InvalidOperationException("Invalid category.");

            // Calculate PriorityScore
            int priorityScore = (category.DefaultPriority * 10) + (dto.IsEmergency ? 50 : 0);

            // Save photo if present
            string? photoPath = await _photoService.SavePhotoAsync(dto.Image, ct);

            var report = new Report
            {
                UserId = userId,
                CategoryId = dto.CategoryId,
                DistrictId = dto.DistrictId,
                TownId = dto.TownId,
                Title = dto.Title,
                Description = dto.Description,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                PhotoPath = photoPath,
                Status = "Reported",
                PriorityScore = priorityScore,
                IsEmergency = dto.IsEmergency,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Content moderation check via AI
            var moderation = await _aiService.ModerateReportAsync(dto.Title, dto.Description ?? string.Empty);
            if (!moderation.IsAppropriate)
            {
                throw new InvalidOperationException($"Report blocked by content moderation: {moderation.Reason}");
            }

            var created = await _reportRepository.CreateAsync(report, ct);

            // Department classification check via AI
            var classification = await _aiService.ClassifyDepartmentAsync(created.Title, created.Description ?? string.Empty, category.NameEn);
            if (classification.DepartmentId.HasValue)
            {
                created.DepartmentId = classification.DepartmentId.Value;
                _context.Reports.Update(created);
                await _context.SaveChangesAsync(ct);
            }

            // Get Town name for notifications
            var town = await _context.Towns
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == dto.TownId, ct);
            string townName = town != null ? town.NameEn : "Karachi";

            // Determine notification details
            string message = report.IsEmergency
                ? $"EMERGENCY: {report.Title} in {townName}"
                : $"New report: {report.Title} in {townName}";

            string type = report.IsEmergency ? "Emergency" : "ReportCreated";

            // Find all matching administrators to notify via DB and SignalR
            var admins = await _context.Users
                .Where(u => u.Role == "SuperAdmin" ||
                            (u.Role == "DistrictAdmin" && u.DistrictId == report.DistrictId) ||
                            (u.Role == "TownAdmin" && u.TownId == report.TownId))
                .ToListAsync(ct);

            foreach (var admin in admins)
            {
                var adminNotif = new Notification
                {
                    UserId = admin.Id,
                    ReportId = created.Id,
                    Message = message,
                    Type = type,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Notifications.AddAsync(adminNotif, ct);
            }
            await _context.SaveChangesAsync(ct);

            // Fire and forget report submission email in background
            var reporter = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (reporter != null)
            {
                _emailService.SendReportSubmittedEmailAsync(reporter.Email, reporter.FullName, created.Title, created.Id);
            }

            // Broadcast to the respective admin SignalR groups
            await _hubContext.Clients.Group("role_SuperAdmin").SendAsync("ReceiveNotification", new
            {
                Id = 0,
                UserId = 0,
                ReportId = created.Id,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _hubContext.Clients.Group($"role_DistrictAdmin_{report.DistrictId}").SendAsync("ReceiveNotification", new
            {
                Id = 0,
                UserId = 0,
                ReportId = created.Id,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _hubContext.Clients.Group($"role_TownAdmin_{report.TownId}").SendAsync("ReceiveNotification", new
            {
                Id = 0,
                UserId = 0,
                ReportId = created.Id,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            // Return detail via projection query
            var detail = await _reportRepository.GetByIdAsync(created.Id, ct);
            return detail!;
        }

        public async Task<List<ReportSummaryResponse>> GetReportsAsync(
            string? status, int? categoryId, int? districtId, int? townId, bool? isEmergency,
            string userRole, int? userDistrictId, int? userTownId,
            CancellationToken ct = default)
        {
            // Role-based filtering
            int? effectiveDistrictId = districtId;
            int? effectiveTownId = townId;

            if (userRole == "DistrictAdmin" && userDistrictId.HasValue)
            {
                effectiveDistrictId = userDistrictId.Value;
            }
            else if (userRole == "TownAdmin" && userTownId.HasValue)
            {
                effectiveTownId = userTownId.Value;
            }

            return await _reportRepository.GetAllAsync(status, categoryId, effectiveDistrictId, effectiveTownId, isEmergency, ct);
        }

        public async Task<List<ReportSummaryResponse>> GetMyReportsAsync(int userId, CancellationToken ct = default)
        {
            return await _reportRepository.GetByUserIdAsync(userId, ct);
        }

        public async Task<ReportDetailResponse?> GetReportDetailAsync(int reportId, int? userId = null, CancellationToken ct = default)
        {
            var detail = await _reportRepository.GetByIdAsync(reportId, ct);
            if (detail != null && userId.HasValue)
            {
                detail.HasVerified = await _context.ReportVerifications
                    .AsNoTracking()
                    .AnyAsync(v => v.ReportId == reportId && v.UserId == userId.Value, ct);
            }
            return detail;
        }
    }
}
