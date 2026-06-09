using CivicAlert.API.Data;
using CivicAlert.API.Responses.AI;
using CivicAlert.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class AIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AIService> _logger;

        public AIService(HttpClient httpClient, ApplicationDbContext context, ILogger<AIService> logger)
        {
            _httpClient = httpClient;
            _context = context;
            _logger = logger;
        }

        public async Task<ModerationResult> ModerateReportAsync(string title, string description)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/ai/moderate", new { title, description });
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<ModerationResponseDto>();
                    if (data != null)
                    {
                        return new ModerationResult
                        {
                            IsAppropriate = data.is_appropriate,
                            Reason = data.reason,
                            Confidence = data.confidence
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call AI moderation service. Failing open.");
            }

            // Fail open: Default to appropriate if service is unreachable
            return new ModerationResult
            {
                IsAppropriate = true,
                Reason = "Auto-approved due to bypass",
                Confidence = 0.5
            };
        }

        public async Task<(int? DepartmentId, string Name)> ClassifyDepartmentAsync(string title, string description, string categoryName)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/ai/classify", new
                {
                    title,
                    description,
                    category_name = categoryName
                });

                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<ClassifyResponseDto>();
                    if (data != null && !string.IsNullOrEmpty(data.department))
                    {
                        var departmentName = data.department;
                        // Normalize and do case-insensitive comparison
                        var department = await _context.Departments
                            .FirstOrDefaultAsync(d => d.Name.ToLower() == departmentName.Trim().ToLower());

                        if (department != null)
                        {
                            return (department.Id, department.Name);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call AI department classification service. Defaulting to unassigned.");
            }

            return (null, "KMC-General");
        }

        public async Task<ChatResult> ChatAsync(string question, string language)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/ai/chat", new { question, language });
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadFromJsonAsync<ChatResponseDto>();
                    if (data != null)
                    {
                        return new ChatResult
                        {
                            Answer = data.answer,
                            Sources = data.sources ?? new System.Collections.Generic.List<string>()
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to query AI chatbot service.");
            }

            return new ChatResult
            {
                Answer = "I don't have information about that. Please contact support. (RAG service is currently offline)",
                Sources = new System.Collections.Generic.List<string>()
            };
        }

        private class ModerationResponseDto
        {
            public bool is_appropriate { get; set; }
            public string? reason { get; set; }
            public double confidence { get; set; }
        }

        private class ClassifyResponseDto
        {
            public string department { get; set; } = string.Empty;
            public double confidence { get; set; }
            public string reasoning { get; set; } = string.Empty;
        }

        private class ChatResponseDto
        {
            public string answer { get; set; } = string.Empty;
            public System.Collections.Generic.List<string>? sources { get; set; }
        }
    }
}
