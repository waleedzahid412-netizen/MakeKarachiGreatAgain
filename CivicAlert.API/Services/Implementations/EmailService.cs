using CivicAlert.API.Configuration;
using CivicAlert.API.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            // Fire and forget: send email in background thread and catch any errors to prevent blocking the request pipeline
            _ = Task.Run(async () =>
            {
                try
                {
                    var message = new MimeMessage();
                    message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                    message.To.Add(new MailboxAddress(toEmail, toEmail));
                    message.Subject = subject;

                    var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
                    message.Body = bodyBuilder.ToMessageBody();

                    using var client = new SmtpClient();
                    await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.Port, SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.Password);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send email to {ToEmail} with subject '{Subject}'. Error: {Message}", toEmail, subject, ex.Message);
                }
            });

            return Task.CompletedTask;
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string fullName)
        {
            string htmlBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; line-height: 1.6;"">
    <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;"">
        <!-- Header -->
        <div style=""background: linear-gradient(135deg, #064e3b 0%, #0f766e 100%); padding: 30px; text-align: center; color: #ffffff;"">
            <span style=""font-size: 24px; font-weight: 800; letter-spacing: -0.5px; display: block;"">CivicAlert Karachi</span>
            <span style=""font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #a7f3d0; margin-top: 5px; display: block;"">Citizen Portal</span>
        </div>
        <!-- Body -->
        <div style=""padding: 40px 30px;"">
            <h2 style=""font-size: 20px; font-weight: 750; color: #0f172a; margin-top: 0; margin-bottom: 20px;"">Hello {fullName}, Welcome to CivicAlert Karachi!</h2>
            <p style=""margin-bottom: 16px;"">Your account has been created successfully.</p>
            <p style=""margin-bottom: 16px;"">You can now report civic issues, verify reports from other citizens, and track the status of your submissions.</p>
            <div style=""background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 4px;"">
                <p style=""margin: 0; font-weight: 600; color: #065f46; font-size: 14px;"">Together, we're building a better Karachi.</p>
            </div>
            <p style=""margin-bottom: 0;"">Warm regards,<br><strong>CivicAlert Karachi Team</strong></p>
        </div>
        <!-- Footer -->
        <div style=""background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;"">
            <p style=""margin: 0;"">CivicAlert Karachi — Civic Issue Tracking Platform</p>
        </div>
    </div>
</div>";

            await SendEmailAsync(toEmail, "Welcome to CivicAlert Karachi!", htmlBody);
        }

        public async Task SendReportSubmittedEmailAsync(string toEmail, string fullName, string reportTitle, int reportId)
        {
            string htmlBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; line-height: 1.6;"">
    <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;"">
        <!-- Header -->
        <div style=""background: linear-gradient(135deg, #064e3b 0%, #0f766e 100%); padding: 30px; text-align: center; color: #ffffff;"">
            <span style=""font-size: 24px; font-weight: 800; letter-spacing: -0.5px; display: block;"">CivicAlert Karachi</span>
            <span style=""font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #a7f3d0; margin-top: 5px; display: block;"">Report Submitted</span>
        </div>
        <!-- Body -->
        <div style=""padding: 40px 30px;"">
            <h2 style=""font-size: 20px; font-weight: 750; color: #0f172a; margin-top: 0; margin-bottom: 20px;"">Hello {fullName},</h2>
            <p style=""margin-bottom: 16px;"">Your report has been submitted successfully.</p>
            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;"">
                <p style=""margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;"">Report Details</p>
                <p style=""margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 700;"">{reportTitle}</p>
                <p style=""margin: 0 0 8px; font-size: 13px; color: #64748b;"">Report ID: <strong>#{reportId}</strong></p>
                <p style=""margin: 0; font-size: 13px; color: #64748b;"">Current Status: <span style=""display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; background-color: #fee2e2; color: #ef4444; border-radius: 4px; border: 1px solid #fca5a5;"">Reported</span></p>
            </div>
            <p style=""margin-bottom: 16px;"">You will receive updates as your report progresses. Other citizens can now verify your report on the map.</p>
            <p style=""margin-bottom: 0;"">Warm regards,<br><strong>CivicAlert Karachi Team</strong></p>
        </div>
        <!-- Footer -->
        <div style=""background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;"">
            <p style=""margin: 0;"">CivicAlert Karachi — Civic Issue Tracking Platform</p>
        </div>
    </div>
</div>";

            await SendEmailAsync(toEmail, $"Report #{reportId} Submitted — {reportTitle}", htmlBody);
        }

        public async Task SendStatusChangedEmailAsync(string toEmail, string fullName, string reportTitle, string oldStatus, string newStatus, string? customMessage = null)
        {
            string statusMessage = customMessage ?? newStatus switch
            {
                "Verified" => "3 citizens have confirmed your report. Authorities have been notified.",
                "InProgress" => "An administrator is actively working on this issue.",
                "Resolved" => "Great news! Your reported issue has been resolved. Thank you for making Karachi better.",
                "Rejected" => "Your report was reviewed and could not be verified.",
                _ => $"The status has been updated to {newStatus}."
            };

            string statusColor = newStatus switch
            {
                "Reported" => "#ef4444",
                "Verified" => "#3b82f6",
                "InProgress" => "#f59e0b",
                "Resolved" => "#10b981",
                "Rejected" => "#64748b",
                "Escalated" => "#f43f5e",
                _ => "#0f172a"
            };

            string statusBg = newStatus switch
            {
                "Reported" => "#fee2e2",
                "Verified" => "#dbeafe",
                "InProgress" => "#fef3c7",
                "Resolved" => "#d1fae5",
                "Rejected" => "#f1f5f9",
                "Escalated" => "#ffe4e6",
                _ => "#e2e8f0"
            };

            string htmlBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; line-height: 1.6;"">
    <div style=""max-width: 600px; margin: 0 auto; background-color: #ffffff; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;"">
        <!-- Header -->
        <div style=""background: linear-gradient(135deg, #064e3b 0%, #0f766e 100%); padding: 30px; text-align: center; color: #ffffff;"">
            <span style=""font-size: 24px; font-weight: 800; letter-spacing: -0.5px; display: block;"">CivicAlert Karachi</span>
            <span style=""font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #a7f3d0; margin-top: 5px; display: block;"">Report Update</span>
        </div>
        <!-- Body -->
        <div style=""padding: 40px 30px;"">
            <h2 style=""font-size: 20px; font-weight: 750; color: #0f172a; margin-top: 0; margin-bottom: 20px;"">Hello {fullName},</h2>
            <p style=""margin-bottom: 16px;"">The status of your report has been updated.</p>
            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;"">
                <p style=""margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase;"">Report Title</p>
                <p style=""margin: 0 0 12px; font-size: 16px; color: #0f172a; font-weight: 700;"">{reportTitle}</p>
                <div style=""margin-top: 12px; font-size: 14px; font-weight: bold;"">
                    <span style=""color: #64748b; text-decoration: line-through; display: inline-block; margin-right: 8px;"">{oldStatus}</span>
                    <span style=""color: #475569; margin-right: 8px;"">→</span>
                    <span style=""display: inline-block; padding: 3px 10px; font-size: 12px; font-weight: 700; background-color: {statusBg}; color: {statusColor}; border-radius: 6px; border: 1px solid {statusColor}40;"">{newStatus}</span>
                </div>
            </div>
            <p style=""margin-bottom: 24px; font-size: 15px; color: #1e293b; font-weight: 600;"">{statusMessage}</p>
            <p style=""margin-bottom: 0;"">Warm regards,<br><strong>CivicAlert Karachi Team</strong></p>
        </div>
        <!-- Footer -->
        <div style=""background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;"">
            <p style=""margin: 0;"">CivicAlert Karachi — Civic Issue Tracking Platform</p>
        </div>
    </div>
</div>";

            await SendEmailAsync(toEmail, $"Report Update — {reportTitle} is now {newStatus}", htmlBody);
        }
    }
}
