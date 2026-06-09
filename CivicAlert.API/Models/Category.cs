namespace CivicAlert.API.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string NameEn { get; set; } = string.Empty;
        public string NameUr { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        // "CivicInfrastructure" | "PublicSafety" | "Utilities"
        public string? IconClass { get; set; }
        public int DefaultPriority { get; set; } = 2;

        public ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
