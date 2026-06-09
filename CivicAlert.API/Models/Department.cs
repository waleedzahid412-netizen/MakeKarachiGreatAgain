using System.Collections.Generic;

namespace CivicAlert.API.Models
{
    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;      // "KWSB"
        public string FullName { get; set; } = string.Empty;   // "Karachi Water & Sewerage Board"
        public string Description { get; set; } = string.Empty;
        public string ContactInfo { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
