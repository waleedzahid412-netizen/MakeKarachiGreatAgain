using System.ComponentModel.DataAnnotations;

namespace CivicAlert.API.DTOs.Admin
{
    public class UpdateReportStatusDto
    {
        [Required]
        [RegularExpression("^(InProgress|Resolved|Rejected)$", ErrorMessage = "Status must be InProgress, Resolved, or Rejected.")]
        public string Status { get; set; } = string.Empty;

        public string? Note { get; set; }
    }
}
