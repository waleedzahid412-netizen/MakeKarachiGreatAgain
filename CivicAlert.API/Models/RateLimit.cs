namespace CivicAlert.API.Models
{
    public class RateLimit
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public DateTime LastActionAt { get; set; } = DateTime.Now;
        public int ActionCount { get; set; } = 1;

        public Users? User { get; set; }
    } 
}
