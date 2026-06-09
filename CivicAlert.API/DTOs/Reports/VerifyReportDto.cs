using System.ComponentModel.DataAnnotations;

namespace CivicAlert.API.DTOs.Reports
{
    public class VerifyReportDto
    {
        [Required]
        public int ReportId { get; set; }

        [Required]
        public bool IsConfirm { get; set; }
    }
}
