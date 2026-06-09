using System.Collections.Generic;

namespace CivicAlert.API.DTOs.Admin
{
    public class AdminAnalyticsDto
    {
        public List<CategoryCountDto> ReportsByCategory { get; set; } = new();
        public List<StatusCountDto> ReportsByStatus { get; set; } = new();
        public List<DateCountDto> ReportsOverTime { get; set; } = new();
        public List<AreaCountDto> TopAreas { get; set; } = new();
        public double ResolutionRate { get; set; }
        public double AvgResolutionTimeHours { get; set; }
        public int TotalReports { get; set; }
        public int EmergencyCount { get; set; }
        public int TodayCount { get; set; }
    }

    public class CategoryCountDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class StatusCountDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class DateCountDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AreaCountDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
