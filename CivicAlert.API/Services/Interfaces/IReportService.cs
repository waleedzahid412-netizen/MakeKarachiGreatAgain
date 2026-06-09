using CivicAlert.API.DTOs.Reports;
using CivicAlert.API.Responses.Reports;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IReportService
    {
        Task<ReportDetailResponse> CreateReportAsync(CreateReportDto dto, int userId, CancellationToken ct = default);
        Task<List<ReportSummaryResponse>> GetReportsAsync(
            string? status, int? categoryId, int? districtId, int? townId, bool? isEmergency,
            string userRole, int? userDistrictId, int? userTownId,
            CancellationToken ct = default);
        Task<List<ReportSummaryResponse>> GetMyReportsAsync(int userId, CancellationToken ct = default);
        Task<ReportDetailResponse?> GetReportDetailAsync(int reportId, int? userId = null, CancellationToken ct = default);
    }
}
