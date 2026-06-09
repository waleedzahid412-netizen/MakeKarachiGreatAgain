namespace CivicAlert.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ReportId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? MessageUr { get; set; }
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public Users? User { get; set; }
        public Report? Report { get; set; }
    }
}
