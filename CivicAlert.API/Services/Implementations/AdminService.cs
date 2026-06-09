using CivicAlert.API.Data;
using CivicAlert.API.DTOs.Admin;
using CivicAlert.API.Models;
using CivicAlert.API.Responses.Admin;
using CivicAlert.API.Responses.Reports;
using CivicAlert.API.Services.Interfaces;
using CivicAlert.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IEmailService _emailService;

        public AdminService(
            ApplicationDbContext context,
            IHubContext<NotificationHub> hubContext,
            IEmailService emailService)
        {
            _context = context;
            _hubContext = hubContext;
            _emailService = emailService;
        }

        public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync(int userId, string role, int? districtId, int? townId, int? departmentId = null)
        {
            var query = _context.Reports.AsNoTracking().AsQueryable();

            if (role == "DistrictAdmin" && districtId.HasValue)
            {
                query = query.Where(r => r.DistrictId == districtId.Value);
            }
            else if (role == "TownAdmin" && townId.HasValue)
            {
                query = query.Where(r => r.TownId == townId.Value);
            }
            else if (role == "DepartmentAdmin" && departmentId.HasValue)
            {
                query = query.Where(r => r.DepartmentId == departmentId.Value);
            }

            var todayUtc = DateTime.UtcNow.Date;

            return new AdminDashboardStatsDto
            {
                TotalReports = await query.CountAsync(),
                ReportedCount = await query.CountAsync(r => r.Status == "Reported"),
                VerifiedCount = await query.CountAsync(r => r.Status == "Verified"),
                InProgressCount = await query.CountAsync(r => r.Status == "InProgress"),
                ResolvedCount = await query.CountAsync(r => r.Status == "Resolved"),
                RejectedCount = await query.CountAsync(r => r.Status == "Rejected"),
                TotalToday = await query.CountAsync(r => r.CreatedAt >= todayUtc),
                EmergencyCount = await query.CountAsync(r => r.IsEmergency),
                EscalatedCount = await query.CountAsync(r => r.Status == "Escalated"),
                ActiveEmergenciesCount = await query.CountAsync(r => r.IsEmergency && r.Status != "Resolved" && r.Status != "Rejected")
            };
        }

        public async Task<List<ReportSummaryResponse>> GetReportsForAdminAsync(string role, int? districtId, int? townId, int? departmentId = null)
        {
            var query = _context.Reports.AsNoTracking().AsQueryable();

            if (role == "DistrictAdmin" && districtId.HasValue)
            {
                query = query.Where(r => r.DistrictId == districtId.Value);
            }
            else if (role == "TownAdmin" && townId.HasValue)
            {
                query = query.Where(r => r.TownId == townId.Value);
            }
            else if (role == "DepartmentAdmin" && departmentId.HasValue)
            {
                query = query.Where(r => r.DepartmentId == departmentId.Value);
            }

            return await query
                .OrderBy(r => r.Status == "Verified" ? 0 : r.Status == "Reported" ? 1 : 2)
                .ThenByDescending(r => r.CreatedAt)
                .Select(r => new ReportSummaryResponse
                {
                    Id = r.Id,
                    Title = r.Title,
                    CategoryName = r.Category != null ? r.Category.NameEn : string.Empty,
                    StatusName = r.Status,
                    PriorityScore = r.PriorityScore,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    IsEmergency = r.IsEmergency,
                    CreatedAt = r.CreatedAt,
                    ReporterName = r.User != null ? r.User.FullName : string.Empty,
                    ImageUrl = r.PhotoPath,
                    DepartmentName = r.Department != null ? r.Department.Name : string.Empty,
                    ConfirmCount = r.Verifications.Count(v => v.VoteType == "Confirm")
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateReportStatusAsync(int reportId, int adminUserId, UpdateReportStatusDto dto)
        {
            var adminUser = await _context.Users.AsNoTracking()
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == adminUserId);
            if (adminUser == null)
            {
                throw new InvalidOperationException("Administrative user not found.");
            }

            var report = await _context.Reports
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == reportId);
            if (report == null)
            {
                return false;
            }

            // Enforce geographic/department scope boundaries update authority check
            if (adminUser.Role == "DistrictAdmin")
            {
                if (!adminUser.DistrictId.HasValue || report.DistrictId != adminUser.DistrictId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only update reports within your assigned district.");
                }
            }
            else if (adminUser.Role == "TownAdmin")
            {
                if (!adminUser.TownId.HasValue || report.TownId != adminUser.TownId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only update reports within your assigned town.");
                }
            }
            else if (adminUser.Role == "DepartmentAdmin")
            {
                if (!adminUser.DepartmentId.HasValue || report.DepartmentId != adminUser.DepartmentId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only update reports assigned to your department.");
                }
            }

            string oldStatus = report.Status;
            string newStatus = dto.Status;

            bool isValid = false;
            if (newStatus == "InProgress" && (oldStatus == "Verified" || oldStatus == "Escalated" || (report.IsEmergency && oldStatus == "Reported")))
            {
                isValid = true;
            }
            else if (newStatus == "Verified" && oldStatus == "Reported" && report.IsEmergency)
            {
                isValid = true;
            }
            else if (newStatus == "Resolved" && (oldStatus == "InProgress" || oldStatus == "Escalated"))
            {
                isValid = true;
            }
            else if (newStatus == "Rejected" && oldStatus != "Resolved" && oldStatus != "Rejected")
            {
                isValid = true;
            }

            if (!isValid)
            {
                throw new InvalidOperationException($"Invalid status transition from '{oldStatus}' to '{newStatus}'.");
            }

            report.Status = newStatus;
            report.UpdatedAt = DateTime.UtcNow;

            string? note = dto.Note;
            string? customEmailMsg = null;
            if (adminUser.Role == "DepartmentAdmin")
            {
                var deptName = adminUser.Department?.Name ?? "Department";
                if (newStatus == "InProgress")
                {
                    note = $"{deptName} Admin started work on this report";
                }
                else if (newStatus == "Resolved")
                {
                    note = $"Your issue has been resolved by {deptName}";
                    customEmailMsg = $"Your issue has been resolved by {deptName}";
                }
            }

            var history = new StatusHistory
            {
                ReportId = report.Id,
                ChangedByUserId = adminUserId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Note = note ?? $"Status updated by admin to {newStatus}",
                ChangedAt = DateTime.UtcNow
            };

            await _context.StatusHistories.AddAsync(history);
            await _context.SaveChangesAsync();

            // Save notification to DB for the reporter
            var notification = new Notification
            {
                UserId = report.UserId,
                ReportId = report.Id,
                Message = $"Your report '{report.Title}' is now {newStatus}",
                Type = "StatusChanged",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            if (report.User != null)
            {
                await _emailService.SendStatusChangedEmailAsync(report.User.Email, report.User.FullName, report.Title, oldStatus, newStatus, customEmailMsg);
            }

            // Broadcast to the reporter's personal SignalR group user_{reporterId}
            await _hubContext.Clients.Group($"user_{report.UserId}").SendAsync("ReceiveNotification", new
            {
                Id = notification.Id,
                UserId = notification.UserId,
                ReportId = notification.ReportId,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            });

            return true;
        }

        public async Task<bool> EscalateReportAsync(int reportId, int adminUserId)
        {
            var adminUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == adminUserId);
            if (adminUser == null)
            {
                throw new InvalidOperationException("Administrative user not found.");
            }

            var report = await _context.Reports
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == reportId);
            if (report == null)
            {
                return false;
            }

            // Geographic/department scope check for admin
            if (adminUser.Role == "DistrictAdmin")
            {
                if (!adminUser.DistrictId.HasValue || report.DistrictId != adminUser.DistrictId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only escalate reports within your assigned district.");
                }
            }
            else if (adminUser.Role == "TownAdmin")
            {
                if (!adminUser.TownId.HasValue || report.TownId != adminUser.TownId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only escalate reports within your assigned town.");
                }
            }
            else if (adminUser.Role == "DepartmentAdmin")
            {
                if (!adminUser.DepartmentId.HasValue || report.DepartmentId != adminUser.DepartmentId.Value)
                {
                    throw new UnauthorizedAccessException("Access Denied: You can only escalate reports assigned to your department.");
                }
            }

            // Verify report is an emergency
            if (!report.IsEmergency)
            {
                throw new InvalidOperationException("Only emergency reports can be escalated.");
            }

            string oldStatus = report.Status;
            string newStatus = "Escalated";

            // Prevent duplicating escalation status or escalating resolved reports
            if (oldStatus == "Resolved" || oldStatus == "Rejected" || oldStatus == "Escalated")
            {
                throw new InvalidOperationException($"Cannot escalate report with status '{oldStatus}'.");
            }

            report.Status = newStatus;
            report.UpdatedAt = DateTime.UtcNow;

            // Create EmergencyEscalation record in DB
            var escalation = new EmergencyEscalation
            {
                ReportId = report.Id,
                EscalatedByUserId = adminUserId,
                Severity = "High",
                AssignedAuthority = adminUser.Role == "TownAdmin" ? "District Authority" : "Provincial Authority",
                ResolutionNote = null,
                IsResolved = false,
                EscalatedAt = DateTime.UtcNow
            };
            await _context.EmergencyEscalations.AddAsync(escalation);

            // Create StatusHistory entry
            var history = new StatusHistory
            {
                ReportId = report.Id,
                ChangedByUserId = adminUserId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Note = $"Emergency report escalated by {adminUser.FullName} ({adminUser.Role})",
                ChangedAt = DateTime.UtcNow
            };
            await _context.StatusHistories.AddAsync(history);

            // Save changes
            await _context.SaveChangesAsync();

            // Save notification to DB for the reporter
            var notification = new Notification
            {
                UserId = report.UserId,
                ReportId = report.Id,
                Message = $"Your emergency report '{report.Title}' has been ESCALATED to authorities.",
                Type = "StatusChanged",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            if (report.User != null)
            {
                _emailService.SendStatusChangedEmailAsync(report.User.Email, report.User.FullName, report.Title, oldStatus, newStatus);
            }

            // Broadcast to the reporter's personal SignalR group user_{reporterId}
            await _hubContext.Clients.Group($"user_{report.UserId}").SendAsync("ReceiveNotification", new
            {
                Id = notification.Id,
                UserId = notification.UserId,
                ReportId = notification.ReportId,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            });

            return true;
        }

        public async Task<AdminAnalyticsDto> GetAnalyticsAsync(int adminUserId, string period)
        {
            var adminUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == adminUserId);
            if (adminUser == null)
            {
                throw new InvalidOperationException("Administrative user not found.");
            }

            var query = _context.Reports.AsQueryable();

            // Scope filter based on Admin role boundaries
            if (adminUser.Role == "DistrictAdmin" && adminUser.DistrictId.HasValue)
            {
                query = query.Where(r => r.DistrictId == adminUser.DistrictId.Value);
            }
            else if (adminUser.Role == "TownAdmin" && adminUser.TownId.HasValue)
            {
                query = query.Where(r => r.TownId == adminUser.TownId.Value);
            }
            else if (adminUser.Role == "DepartmentAdmin" && adminUser.DepartmentId.HasValue)
            {
                query = query.Where(r => r.DepartmentId == adminUser.DepartmentId.Value);
            }

            var todayUtc = DateTime.UtcNow.Date;

            // Basic Counts
            int totalReports = await query.CountAsync();
            int emergencyCount = await query.CountAsync(r => r.IsEmergency);
            int todayCount = await query.CountAsync(r => r.CreatedAt >= todayUtc);

            // Reports By Category
            var rawCategories = await query
                .GroupBy(r => r.Category != null ? r.Category.NameEn : "Uncategorized")
                .Select(g => new CategoryCountDto { Name = g.Key, Count = g.Count() })
                .ToListAsync();

            // Reports By Status
            var rawStatuses = await query
                .GroupBy(r => r.Status)
                .Select(g => new StatusCountDto { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // Resolution Metrics
            double resolutionRate = 0;
            if (totalReports > 0)
            {
                int resolvedCount = await query.CountAsync(r => r.Status == "Resolved");
                resolutionRate = Math.Round(((double)resolvedCount / totalReports) * 100, 2);
            }

            // Average Resolution Time using StatusHistories
            var resolvedHistory = await _context.StatusHistories
                .Include(sh => sh.Report)
                .Where(sh => sh.NewStatus == "Resolved" && query.Select(r => r.Id).Contains(sh.ReportId))
                .Select(sh => new { sh.ChangedAt, sh.Report!.CreatedAt })
                .ToListAsync();

            double avgResolutionTimeHours = 0;
            if (resolvedHistory.Any())
            {
                double totalHours = resolvedHistory.Sum(x => (x.ChangedAt - x.CreatedAt).TotalHours);
                avgResolutionTimeHours = Math.Round(totalHours / resolvedHistory.Count, 1);
            }

            // Reports Over Time: group by period in-memory
            var reportDates = await query
                .Select(r => r.CreatedAt)
                .ToListAsync();

            IEnumerable<IGrouping<string, DateTime>> dateGroupings;
            if (period == "week")
            {
                dateGroupings = reportDates.GroupBy(d => {
                    var diff = (7 + (d.Date.DayOfWeek - DayOfWeek.Monday)) % 7;
                    return d.Date.AddDays(-1 * diff).ToString("yyyy-MM-dd");
                });
            }
            else if (period == "month")
            {
                dateGroupings = reportDates.GroupBy(d => d.ToString("yyyy-MM"));
            }
            else if (period == "year")
            {
                dateGroupings = reportDates.GroupBy(d => d.ToString("yyyy"));
            }
            else // "day" or other
            {
                dateGroupings = reportDates.GroupBy(d => d.ToString("yyyy-MM-dd"));
            }

            var reportsOverTime = dateGroupings
                .Select(g => new DateCountDto { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToList();

            // Top complaint areas list with counts
            List<AreaCountDto> topAreas = new();
            if (adminUser.Role == "SuperAdmin" || adminUser.Role == "DepartmentAdmin")
            {
                // List district names for SuperAdmin and DepartmentAdmin
                topAreas = await query
                    .GroupBy(r => r.District != null ? r.District.NameEn : "Unknown District")
                    .Select(g => new AreaCountDto { Name = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync();
            }
            else if (adminUser.Role == "DistrictAdmin" && adminUser.DistrictId.HasValue)
            {
                // List town names inside the district for DistrictAdmin
                topAreas = await query
                    .GroupBy(r => r.Town != null ? r.Town.NameEn : "Unknown Town")
                    .Select(g => new AreaCountDto { Name = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync();
            }
            else if (adminUser.Role == "TownAdmin" && adminUser.TownId.HasValue)
            {
                // List category names ranked by report count for TownAdmin
                topAreas = await query
                    .GroupBy(r => r.Category != null ? r.Category.NameEn : "Uncategorized")
                    .Select(g => new AreaCountDto { Name = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync();
            }

            return new AdminAnalyticsDto
            {
                TotalReports = totalReports,
                EmergencyCount = emergencyCount,
                TodayCount = todayCount,
                ReportsByCategory = rawCategories,
                ReportsByStatus = rawStatuses,
                ReportsOverTime = reportsOverTime,
                TopAreas = topAreas,
                ResolutionRate = resolutionRate,
                AvgResolutionTimeHours = avgResolutionTimeHours
            };
        }

        public async Task<List<AdminActivityDto>> GetRecentActivityAsync(string role, int? districtId, int? townId, int? departmentId = null)
        {
            var query = _context.StatusHistories
                .Include(sh => sh.Report)
                .Include(sh => sh.ChangedBy)
                .AsNoTracking()
                .AsQueryable();

            if (role == "DistrictAdmin" && districtId.HasValue)
            {
                query = query.Where(sh => sh.Report != null && sh.Report.DistrictId == districtId.Value);
            }
            else if (role == "TownAdmin" && townId.HasValue)
            {
                query = query.Where(sh => sh.Report != null && sh.Report.TownId == townId.Value);
            }
            else if (role == "DepartmentAdmin" && departmentId.HasValue)
            {
                query = query.Where(sh => sh.Report != null && sh.Report.DepartmentId == departmentId.Value);
            }

            return await query
                .OrderByDescending(sh => sh.ChangedAt)
                .Take(10)
                .Select(sh => new AdminActivityDto
                {
                    Id = sh.Id,
                    ReportId = sh.ReportId,
                    ReportTitle = sh.Report != null ? sh.Report.Title : string.Empty,
                    OldStatus = sh.OldStatus,
                    NewStatus = sh.NewStatus,
                    Note = sh.Note,
                    ChangedAt = sh.ChangedAt,
                    ChangedByName = sh.ChangedBy != null ? sh.ChangedBy.FullName : "System"
                })
                .ToListAsync();
        }
    }
}
