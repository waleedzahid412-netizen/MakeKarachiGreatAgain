using CivicAlert.API.Data;
using CivicAlert.API.Models;
using CivicAlert.API.Repositories.Interfaces;
using CivicAlert.API.Responses.Reports;
using Microsoft.EntityFrameworkCore;

namespace CivicAlert.API.Repositories.Implementations
{
    public class ReportRepository : IReportRepository
    {
        private readonly ApplicationDbContext _context;

        public ReportRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Report> CreateAsync(Report report, CancellationToken ct = default)
        {
            await _context.Reports.AddAsync(report, ct);
            await _context.SaveChangesAsync(ct);
            return report;
        }

        public async Task<ReportDetailResponse?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.Reports
                .AsNoTracking()
                .Where(r => r.Id == id)
                .Select(r => new ReportDetailResponse
                {
                    Id = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    CategoryName = r.Category != null ? r.Category.NameEn : string.Empty,
                    StatusName = r.Status,
                    PriorityScore = r.PriorityScore,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    IsEmergency = r.IsEmergency,
                    CreatedAt = r.CreatedAt,
                    ReporterName = r.User != null ? r.User.FullName : string.Empty,
                    ReporterEmail = r.User != null ? r.User.Email : string.Empty,
                    ImageUrl = r.PhotoPath,
                    DistrictName = r.District != null ? r.District.NameEn : string.Empty,
                    TownName = r.Town != null ? r.Town.NameEn : string.Empty,
                    DepartmentName = r.Department != null ? r.Department.Name : string.Empty,
                    DepartmentFullName = r.Department != null ? r.Department.FullName : string.Empty,
                    DepartmentDescription = r.Department != null ? r.Department.Description : string.Empty,
                    ConfirmCount = r.Verifications.Count(v => v.VoteType == "Confirm"),
                    ReporterId = r.UserId,
                    StatusHistories = r.StatusHistories
                        .OrderBy(sh => sh.ChangedAt)
                        .Select(sh => new StatusHistoryDto
                        {
                            OldStatus = sh.OldStatus,
                            NewStatus = sh.NewStatus,
                            Note = sh.Note,
                            ChangedAt = sh.ChangedAt,
                            ChangedByName = sh.ChangedBy != null ? sh.ChangedBy.FullName : "System"
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync(ct);
        }

        public async Task<List<ReportSummaryResponse>> GetAllAsync(
            string? status = null,
            int? categoryId = null,
            int? districtId = null,
            int? townId = null,
            bool? isEmergency = null,
            CancellationToken ct = default)
        {
            var query = _context.Reports.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            if (categoryId.HasValue)
                query = query.Where(r => r.CategoryId == categoryId.Value);

            if (districtId.HasValue)
                query = query.Where(r => r.DistrictId == districtId.Value);

            if (townId.HasValue)
                query = query.Where(r => r.TownId == townId.Value);

            if (isEmergency.HasValue)
                query = query.Where(r => r.IsEmergency == isEmergency.Value);

            return await query
                .OrderByDescending(r => r.CreatedAt)
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
                .ToListAsync(ct);
        }

        public async Task<List<ReportSummaryResponse>> GetByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _context.Reports
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
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
                .ToListAsync(ct);
        }

        public async Task<int> CountRecentByUserAsync(int userId, DateTime since, CancellationToken ct = default)
        {
            return await _context.Reports
                .AsNoTracking()
                .CountAsync(r => r.UserId == userId && r.CreatedAt >= since, ct);
        }
    }
}
