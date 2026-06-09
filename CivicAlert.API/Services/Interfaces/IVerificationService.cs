using CivicAlert.API.DTOs.Reports;
using CivicAlert.API.Responses.Reports;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IVerificationService
    {
        Task<VerifyReportResult> VerifyReportAsync(int userId, VerifyReportDto dto);
    }
}
