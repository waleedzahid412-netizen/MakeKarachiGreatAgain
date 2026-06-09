using CivicAlert.API.DTOs.Admin;
using CivicAlert.API.Responses.Admin;
using CivicAlert.API.Responses.Reports;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using CivicAlert.API.Data;
using CivicAlert.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "SuperAdmin,DistrictAdmin,TownAdmin,DepartmentAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ApplicationDbContext _context;

        public AdminController(IAdminService adminService, ApplicationDbContext context)
        {
            _adminService = adminService;
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<AdminDashboardStatsDto>> GetDashboardStats()
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var districtIdClaim = User.FindFirst("DistrictId")?.Value;
            int? districtId = !string.IsNullOrEmpty(districtIdClaim) && int.TryParse(districtIdClaim, out int dId) ? dId : null;

            var townIdClaim = User.FindFirst("TownId")?.Value;
            int? townId = !string.IsNullOrEmpty(townIdClaim) && int.TryParse(townIdClaim, out int tId) ? tId : null;

            var deptIdClaim = User.FindFirst("DepartmentId")?.Value;
            int? departmentId = !string.IsNullOrEmpty(deptIdClaim) && int.TryParse(deptIdClaim, out int dptId) ? dptId : null;

            var stats = await _adminService.GetDashboardStatsAsync(userId, role, districtId, townId, departmentId);
            return Ok(stats);
        }

        [HttpGet("analytics")]
        public async Task<ActionResult<AdminAnalyticsDto>> GetAnalytics([FromQuery] string period = "day")
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var analytics = await _adminService.GetAnalyticsAsync(userId, period);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("reports")]
        public async Task<ActionResult<List<ReportSummaryResponse>>> GetReports()
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;

            var districtIdClaim = User.FindFirst("DistrictId")?.Value;
            int? districtId = !string.IsNullOrEmpty(districtIdClaim) && int.TryParse(districtIdClaim, out int dId) ? dId : null;

            var townIdClaim = User.FindFirst("TownId")?.Value;
            int? townId = !string.IsNullOrEmpty(townIdClaim) && int.TryParse(townIdClaim, out int tId) ? tId : null;

            var deptIdClaim = User.FindFirst("DepartmentId")?.Value;
            int? departmentId = !string.IsNullOrEmpty(deptIdClaim) && int.TryParse(deptIdClaim, out int dptId) ? dptId : null;

            var reports = await _adminService.GetReportsForAdminAsync(role, districtId, townId, departmentId);
            return Ok(reports);
        }

        [HttpPut("reports/{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReportStatusDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var success = await _adminService.UpdateReportStatusAsync(id, userId, dto);
                if (!success)
                {
                    return NotFound(new { Error = "Report not found." });
                }

                return Ok(new { Success = true, Message = $"Report status successfully updated to {dto.Status}." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred while updating the report status: " + ex.Message });
            }
        }

        [HttpPost("reports/{id}/escalate")]
        public async Task<IActionResult> Escalate(int id)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            try
            {
                var success = await _adminService.EscalateReportAsync(id, userId);
                if (!success)
                {
                    return NotFound(new { Error = "Report not found." });
                }

                return Ok(new { Success = true, Message = "Report successfully escalated." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred while escalating the report: " + ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<AdminActivityDto>>> GetHistory()
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;

            var districtIdClaim = User.FindFirst("DistrictId")?.Value;
            int? districtId = !string.IsNullOrEmpty(districtIdClaim) && int.TryParse(districtIdClaim, out int dId) ? dId : null;

            var townIdClaim = User.FindFirst("TownId")?.Value;
            int? townId = !string.IsNullOrEmpty(townIdClaim) && int.TryParse(townIdClaim, out int tId) ? tId : null;

            var deptIdClaim = User.FindFirst("DepartmentId")?.Value;
            int? departmentId = !string.IsNullOrEmpty(deptIdClaim) && int.TryParse(deptIdClaim, out int dptId) ? dptId : null;

            try
            {
                var history = await _adminService.GetRecentActivityAsync(role, districtId, townId, departmentId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred while retrieving recent history: " + ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAdmins()
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;
            if (role != "SuperAdmin")
            {
                return Forbid();
            }

            var admins = await _context.Users
                .Include(u => u.District)
                .Include(u => u.Town)
                .Include(u => u.Department)
                .Where(u => u.Role == "SuperAdmin" || u.Role == "DistrictAdmin" || u.Role == "TownAdmin" || u.Role == "DepartmentAdmin")
                .OrderBy(u => u.Role)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role,
                    DistrictName = u.District != null ? u.District.NameEn : string.Empty,
                    TownName = u.Town != null ? u.Town.NameEn : string.Empty,
                    DepartmentName = u.Department != null ? u.Department.Name : string.Empty,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(admins);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;
            if (role != "SuperAdmin")
            {
                return Forbid();
            }

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { Error = "Email is already registered." });
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var newUser = new Users
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = dto.Role,
                DistrictId = dto.DistrictId,
                TownId = dto.TownId,
                DepartmentId = dto.DepartmentId,
                IsActive = true,
                PreferredLanguage = "en",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Admin account successfully created." });
        }

        [HttpPut("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleAdminStatus(int id)
        {
            var role = User.FindFirst("Role")?.Value ?? string.Empty;
            if (role != "SuperAdmin")
            {
                return Forbid();
            }

            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (targetUser == null)
            {
                return NotFound(new { Error = "User not found." });
            }

            var currentUserIdClaim = User.FindFirst("UserId")?.Value;
            if (int.TryParse(currentUserIdClaim, out int currentUserId) && currentUserId == id)
            {
                return BadRequest(new { Error = "You cannot deactivate your own account." });
            }

            targetUser.IsActive = !targetUser.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, IsActive = targetUser.IsActive });
        }
    }
}
