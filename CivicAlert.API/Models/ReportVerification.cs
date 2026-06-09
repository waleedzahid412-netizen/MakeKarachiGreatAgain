namespace CivicAlert.API.Models
{
    public class ReportVerification
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public int UserId { get; set; }
        public string VoteType { get; set; } = string.Empty; // "Confirm" | "Dispute"
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation
        public Report? Report { get; set; }
        public Users? User { get; set; }
    }
}

