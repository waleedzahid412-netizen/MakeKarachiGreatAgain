using CivicAlert.API.Models;
using System.Threading.Tasks;

namespace CivicAlert.API.Repositories.Interfaces
{
    public interface IVerificationRepository
    {
        Task<bool> HasUserVerifiedAsync(int userId, int reportId);
        Task<int> GetVerificationCountAsync(int reportId);
        Task CreateAsync(ReportVerification verification);
    }
}
