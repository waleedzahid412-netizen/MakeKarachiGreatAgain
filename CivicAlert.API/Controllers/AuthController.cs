using CivicAlert.API.DTOs.Auth;
using CivicAlert.API.Responses.Auth;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginDto loginDto, CancellationToken ct = default)
        {
            var response = await _authService.LoginAsync(loginDto, HttpContext, ct);
            if (!response.Success)
            {
                if (response.ErrorMessage == "Account is deactivated")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterDto registerDto, CancellationToken ct = default)
        {
            var response = await _authService.RegisterAsync(registerDto, HttpContext, ct);
            if (!response.Success)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt_token");
            return Ok(new { Success = true, Message = "Logged out successfully" });
        }

        [HttpGet("me")]
        public ActionResult<AuthResponse> GetMe()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new AuthResponse { Success = false, ErrorMessage = "Unauthorized" });
            }

            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("Email")?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("Role")?.Value;

            var districtIdClaim = User.FindFirst("DistrictId")?.Value;
            int? districtId = !string.IsNullOrEmpty(districtIdClaim) && int.TryParse(districtIdClaim, out int dId) ? dId : null;

            var townIdClaim = User.FindFirst("TownId")?.Value;
            int? townId = !string.IsNullOrEmpty(townIdClaim) && int.TryParse(townIdClaim, out int tId) ? tId : null;

            var fullName = User.FindFirst("FullName")?.Value;
            var preferredLanguage = User.FindFirst("PreferredLanguage")?.Value;

            var deptIdClaim = User.FindFirst("DepartmentId")?.Value;
            int? departmentId = !string.IsNullOrEmpty(deptIdClaim) && int.TryParse(deptIdClaim, out int dptId) ? dptId : null;

            var departmentName = User.FindFirst("DepartmentName")?.Value;
            var departmentFullName = User.FindFirst("DepartmentFullName")?.Value;
            var departmentDescription = User.FindFirst("DepartmentDescription")?.Value;

            return Ok(new AuthResponse
            {
                Success = true,
                UserId = userId,
                Email = email,
                Role = role,
                DistrictId = districtId,
                TownId = townId,
                FullName = fullName,
                PreferredLanguage = preferredLanguage,
                DepartmentId = departmentId,
                DepartmentName = departmentName,
                DepartmentFullName = departmentFullName,
                DepartmentDescription = departmentDescription
            });
        }
    }
}
