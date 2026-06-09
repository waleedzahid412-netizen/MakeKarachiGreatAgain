using System;

namespace CivicAlert.API.Responses.Admin
{
    public class AdminActivityDto
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public string ReportTitle { get; set; } = string.Empty;
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime ChangedAt { get; set; }
        public string ChangedByName { get; set; } = string.Empty;
    }
}
