namespace CivicAlert.API.Models
{
    public class EmergencyEscalation
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public int EscalatedByUserId { get; set; }
        public string Severity { get; set; } = "High";
        public string? AssignedAuthority { get; set; }
        public string? ResolutionNote { get; set; }
        public bool IsResolved { get; set; } = false;
        public DateTime EscalatedAt { get; set; } = DateTime.Now;

        public Report? Report { get; set; }
        public Users? EscalatedBy { get; set; }
    }
}

