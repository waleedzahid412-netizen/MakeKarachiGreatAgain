using System.ComponentModel.DataAnnotations;

namespace CivicAlert.API.DTOs.Admin
{
    public class CreateAdminDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty; // "DistrictAdmin" or "TownAdmin"

        public int? DistrictId { get; set; }
        public int? TownId { get; set; }
        public int? DepartmentId { get; set; }
    }
}
