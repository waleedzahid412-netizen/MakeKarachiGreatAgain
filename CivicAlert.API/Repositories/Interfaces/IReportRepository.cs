using CivicAlert.API.Models;
using CivicAlert.API.Responses.Reports;

namespace CivicAlert.API.Repositories.Interfaces
{
    public interface IReportRepository
    {
        Task<Report> CreateAsync(Report report, CancellationToken ct = default);
        Task<ReportDetailResponse?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<List<ReportSummaryResponse>> GetAllAsync(
            string? status = null,
            int? categoryId = null,
            int? districtId = null,
            int? townId = null,
            bool? isEmergency = null,
            CancellationToken ct = default);
        Task<List<ReportSummaryResponse>> GetByUserIdAsync(int userId, CancellationToken ct = default);
        Task<int> CountRecentByUserAsync(int userId, DateTime since, CancellationToken ct = default);
    }
}
