namespace CivicAlert.API.Responses.Reports
{
    public class ReportDetailResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public int PriorityScore { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsEmergency { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string? ReporterEmail { get; set; }
        public string? ImageUrl { get; set; }
        public string DistrictName { get; set; } = string.Empty;
        public string TownName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string? DepartmentFullName { get; set; }
        public string? DepartmentDescription { get; set; }
        public int ConfirmCount { get; set; }
        public bool HasVerified { get; set; }
        public int ReporterId { get; set; }
        public List<StatusHistoryDto> StatusHistories { get; set; } = new();
    }

    public class StatusHistoryDto
    {
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime ChangedAt { get; set; }
        public string ChangedByName { get; set; } = string.Empty;
    }
}
