namespace CivicAlert.API.Models
{
    public class Town
    {
        public int Id { get; set; }
        public int DistrictId { get; set; }
        public string NameEn { get; set; } = string.Empty;  // "Saddar Town"
        public string NameUr { get; set; } = string.Empty;  // "صدر ٹاؤن"

        // Navigation
        public District? District { get; set; }
        public ICollection<Report> Reports { get; set; } = new List<Report>();
        public ICollection<Users> Users { get; set; } = new List<Users>();
    }
}
