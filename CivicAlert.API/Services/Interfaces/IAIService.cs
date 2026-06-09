using CivicAlert.API.Responses.AI;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IAIService
    {
        Task<ModerationResult> ModerateReportAsync(string title, string description);
        Task<(int? DepartmentId, string Name)> ClassifyDepartmentAsync(string title, string description, string categoryName);
        Task<ChatResult> ChatAsync(string question, string language);
    }
}
