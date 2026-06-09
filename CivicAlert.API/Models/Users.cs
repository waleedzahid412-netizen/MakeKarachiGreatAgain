namespace CivicAlert.API.Models
{
    public class Users
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Citizen";
        // "SuperAdmin" | "DistrictAdmin" | "TownAdmin" | "Authority" | "Citizen"
        public int? DistrictId { get; set; }   // null for SuperAdmin and Citizen
        public int? TownId { get; set; }        // null for everyone except TownAdmin/Authority
        public int? DepartmentId { get; set; }
        public string? PhoneNumber { get; set; }
        public string PreferredLanguage { get; set; } = "en";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public District? District { get; set; }
        public Town? Town { get; set; }
        public Department? Department { get; set; }
        public ICollection<Report> Reports { get; set; } = new List<Report>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<ReportVerification> Verifications { get; set; }
            = new List<ReportVerification>();

        public ICollection<StatusHistory> StatusHistories { get; set; }
            = new List<StatusHistory>();
        public ICollection<EmergencyEscalation> EmergencyEscalations { get; set; }
    = new List<EmergencyEscalation>();

        public ICollection<RateLimit> RateLimits { get; set; }
            = new List<RateLimit>();
    }
}
