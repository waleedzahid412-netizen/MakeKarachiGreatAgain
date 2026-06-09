namespace CivicAlert.API.Models
{
    public class Report
    {
        public int Id { get; set; }

        // Foreign keys
        public int UserId { get; set; }
        public int CategoryId { get; set; }
        public int DistrictId { get; set; }
        public int TownId { get; set; } 
        public int? DepartmentId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double Latitude { get; set; }    // from Leaflet.js map click
        public double Longitude { get; set; }
        public string? Address { get; set; }    // "Block 5, Clifton, Karachi"
        public string? PhotoPath { get; set; }  // "/uploads/guid.jpg"

        public string Status { get; set; } = "Reported";
        // "Reported" -> "Verified" -> "InProgress" -> "Resolved" -> "Rejected"

        public int PriorityScore { get; set; } = 0;
        // Formula: (Category.DefaultPriority * 10) + (Confirms * 5) + (IsEmergency ? 50 : 0)
        // Recalculated in ReportService every time a verification is added

        public bool IsEmergency { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public Users? User { get; set; }
        public Category? Category { get; set; }
        public Department? Department { get; set; }

        public District? District { get; set; }
        public Town? Town { get; set; }
        public ICollection<ReportVerification> Verifications { get; set; } = new List<ReportVerification>();
        public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public EmergencyEscalation? EmergencyEscalation { get; set; }
    }
}
