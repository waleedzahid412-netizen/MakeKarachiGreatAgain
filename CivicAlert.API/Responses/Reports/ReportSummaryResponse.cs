namespace CivicAlert.API.Responses.Reports
{
    public class ReportSummaryResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string StatusName { get; set; } = string.Empty;
        public int PriorityScore { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsEmergency { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int ConfirmCount { get; set; }
    }
}
