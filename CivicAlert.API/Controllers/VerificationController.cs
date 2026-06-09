using CivicAlert.API.DTOs.Reports;
using CivicAlert.API.Responses.Reports;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Citizen")]
    public class VerificationController : ControllerBase
    {
        private readonly IVerificationService _verificationService;

        public VerificationController(IVerificationService verificationService)
        {
            _verificationService = verificationService;
        }

        [HttpPost("{id}/verify")]
        public async Task<ActionResult<VerifyReportResult>> Verify(int id, [FromBody] VerifyReportDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            dto.ReportId = id; // set route ID on DTO

            try
            {
                var result = await _verificationService.VerifyReportAsync(userId, dto);
                if (!result.Success)
                {
                    return BadRequest(new { Error = result.ErrorMessage });
                }

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
