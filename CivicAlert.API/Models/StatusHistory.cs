namespace CivicAlert.API.Models
{
    public class StatusHistory
    {
        public int Id { get; set; }
        public int ReportId { get; set; }
        public int ChangedByUserId { get; set; }
        public string OldStatus { get; set; } = string.Empty;
        public string NewStatus { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.Now;

        public Report? Report { get; set; }
        public Users? ChangedBy { get; set; }
    }
}
