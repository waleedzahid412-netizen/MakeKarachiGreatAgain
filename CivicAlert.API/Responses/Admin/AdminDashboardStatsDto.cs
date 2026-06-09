namespace CivicAlert.API.Responses.Admin
{
    public class AdminDashboardStatsDto
    {
        public int TotalReports { get; set; }
        public int ReportedCount { get; set; }
        public int VerifiedCount { get; set; }
        public int InProgressCount { get; set; }
        public int ResolvedCount { get; set; }
        public int RejectedCount { get; set; }
        public int TotalToday { get; set; }
        public int EmergencyCount { get; set; }
        public int EscalatedCount { get; set; }
        public int ActiveEmergenciesCount { get; set; }
    }
}
