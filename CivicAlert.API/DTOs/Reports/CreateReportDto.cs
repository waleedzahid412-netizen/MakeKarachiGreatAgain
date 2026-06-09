using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CivicAlert.API.DTOs.Reports
{
    public class CreateReportDto
    {
        [Required]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Required]
        public int DistrictId { get; set; }

        [Required]
        public int TownId { get; set; }

        public bool IsEmergency { get; set; } = false;

        public IFormFile? Image { get; set; }
    }
}
