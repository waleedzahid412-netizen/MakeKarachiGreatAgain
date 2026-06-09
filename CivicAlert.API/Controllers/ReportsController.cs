using CivicAlert.API.DTOs.Reports;
using CivicAlert.API.Responses.Reports;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost]
        [Authorize(Roles = "Citizen")]
        public async Task<ActionResult<ReportDetailResponse>> Create(
            [FromForm] CreateReportDto dto, CancellationToken ct = default)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            try
            {
                var result = await _reportService.CreateReportAsync(dto, userId, ct);
                return Ok(result);
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<ReportSummaryResponse>>> GetAll(
            [FromQuery] string? status,
            [FromQuery] int? categoryId,
            [FromQuery] int? districtId,
            [FromQuery] int? townId,
            [FromQuery] bool? isEmergency,
            CancellationToken ct = default)
        {
            var role = User.FindFirst("Role")?.Value ?? "Citizen";

            var districtIdClaim = User.FindFirst("DistrictId")?.Value;
            int? userDistrictId = !string.IsNullOrEmpty(districtIdClaim) && int.TryParse(districtIdClaim, out int dId) ? dId : null;

            var townIdClaim = User.FindFirst("TownId")?.Value;
            int? userTownId = !string.IsNullOrEmpty(townIdClaim) && int.TryParse(townIdClaim, out int tId) ? tId : null;

            var reports = await _reportService.GetReportsAsync(
                status, categoryId, districtId, townId, isEmergency,
                role, userDistrictId, userTownId, ct);

            return Ok(reports);
        }

        [HttpGet("mine")]
        [Authorize(Roles = "Citizen")]
        public async Task<ActionResult<List<ReportSummaryResponse>>> GetMine(CancellationToken ct = default)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var reports = await _reportService.GetMyReportsAsync(userId, ct);
            return Ok(reports);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReportDetailResponse>> GetById(int id, CancellationToken ct = default)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            int? currentUserId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid) ? uid : null;

            var report = await _reportService.GetReportDetailAsync(id, currentUserId, ct);
            if (report == null)
                return NotFound();

            return Ok(report);
        }
    }
}
