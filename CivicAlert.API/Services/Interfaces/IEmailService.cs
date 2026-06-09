using System.Threading.Tasks;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
        Task SendWelcomeEmailAsync(string toEmail, string fullName);
        Task SendReportSubmittedEmailAsync(string toEmail, string fullName, string reportTitle, int reportId);
        Task SendStatusChangedEmailAsync(string toEmail, string fullName, string reportTitle, string oldStatus, string newStatus, string? customMessage = null);
    }
}
