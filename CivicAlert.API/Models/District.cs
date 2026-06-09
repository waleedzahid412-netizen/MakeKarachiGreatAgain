namespace CivicAlert.API.Models
{
    public class District
    {
        public int Id { get; set; }
        public string NameEn { get; set; } = string.Empty;  // "Karachi South"
        public string NameUr { get; set; } = string.Empty;  // "کراچی جنوبی"
        public string Code { get; set; } = string.Empty;    // "KHI-S"

        // Navigationa
        public ICollection<Town> Towns { get; set; } = new List<Town>();
        public ICollection<Report> Reports { get; set; } = new List<Report>();
        public ICollection<Users> Users { get; set; } = new List<Users>();
    }
}
