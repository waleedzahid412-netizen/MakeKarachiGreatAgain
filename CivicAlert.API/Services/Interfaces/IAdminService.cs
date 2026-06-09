using CivicAlert.API.DTOs.Admin;
using CivicAlert.API.Responses.Admin;
using CivicAlert.API.Responses.Reports;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IAdminService
    {
        Task<AdminDashboardStatsDto> GetDashboardStatsAsync(int userId, string role, int? districtId, int? townId, int? departmentId = null);
        Task<bool> UpdateReportStatusAsync(int reportId, int adminUserId, UpdateReportStatusDto dto);
        Task<List<ReportSummaryResponse>> GetReportsForAdminAsync(string role, int? districtId, int? townId, int? departmentId = null);
        Task<AdminAnalyticsDto> GetAnalyticsAsync(int adminUserId, string period);
        Task<bool> EscalateReportAsync(int reportId, int adminUserId);
        Task<List<AdminActivityDto>> GetRecentActivityAsync(string role, int? districtId, int? townId, int? departmentId = null);
    }
}
