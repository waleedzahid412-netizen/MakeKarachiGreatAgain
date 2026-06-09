using System.ComponentModel.DataAnnotations;

namespace CivicAlert.API.DTOs.Auth
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public int? DistrictId { get; set; }

        public int? TownId { get; set; }
    }
}
