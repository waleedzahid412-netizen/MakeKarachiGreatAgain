using CivicAlert.API.Configuration;
using CivicAlert.API.DTOs.Auth;
using CivicAlert.API.Models;
using CivicAlert.API.Repositories.Interfaces;
using CivicAlert.API.Responses.Auth;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtSettings _jwtSettings;
        private readonly IEmailService _emailService;

        public AuthService(IUserRepository userRepository, IOptions<JwtSettings> jwtSettings, IEmailService emailService)
        {
            _userRepository = userRepository;
            _jwtSettings = jwtSettings.Value;
            _emailService = emailService;
        }

        public async Task<AuthResponse> LoginAsync(LoginDto loginDto, HttpContext httpContext, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email, ct);
            if (user == null)
            {
                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "Invalid credentials"
                };
            }

            // Check if user is active BEFORE password verification
            if (!user.IsActive)
            {
                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "Account is deactivated"
                };
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "Invalid credentials"
                };
            }

            GenerateAndSetTokenCookie(user, httpContext);

            return new AuthResponse
            {
                Success = true,
                UserId = user.Id,
                Email = user.Email,
                Role = user.Role,
                DistrictId = user.DistrictId,
                TownId = user.TownId,
                FullName = user.FullName,
                PreferredLanguage = user.PreferredLanguage,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                DepartmentFullName = user.Department?.FullName,
                DepartmentDescription = user.Department?.Description
            };
        }

        public async Task<AuthResponse> RegisterAsync(RegisterDto registerDto, HttpContext httpContext, CancellationToken ct = default)
        {
            bool emailExists = await _userRepository.EmailExistsAsync(registerDto.Email, ct);
            if (emailExists)
            {
                return new AuthResponse
                {
                    Success = false,
                    ErrorMessage = "Email is already registered"
                };
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            var newUser = new Users
            {
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                FullName = registerDto.FullName,
                PhoneNumber = registerDto.PhoneNumber,
                DistrictId = registerDto.DistrictId,
                TownId = registerDto.TownId,
                Role = "Citizen", // Default role
                IsActive = true,
                PreferredLanguage = "en", // Default preferred language
                CreatedAt = DateTime.UtcNow
            };

            var createdUser = await _userRepository.CreateAsync(newUser, ct);

            // Fire and forget welcome email in background
            _emailService.SendWelcomeEmailAsync(createdUser.Email, createdUser.FullName);

            GenerateAndSetTokenCookie(createdUser, httpContext);

            return new AuthResponse
            {
                Success = true,
                UserId = createdUser.Id,
                Email = createdUser.Email,
                Role = createdUser.Role,
                DistrictId = createdUser.DistrictId,
                TownId = createdUser.TownId,
                FullName = createdUser.FullName,
                PreferredLanguage = createdUser.PreferredLanguage,
                DepartmentId = createdUser.DepartmentId,
                DepartmentName = createdUser.Department?.Name,
                DepartmentFullName = createdUser.Department?.FullName,
                DepartmentDescription = createdUser.Department?.Description
            };
        }

        private void GenerateAndSetTokenCookie(Users user, HttpContext httpContext)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Key);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.Id.ToString()),
                new Claim("Email", user.Email),
                new Claim("Role", user.Role),
                new Claim("DistrictId", user.DistrictId?.ToString() ?? string.Empty),
                new Claim("TownId", user.TownId?.ToString() ?? string.Empty),
                new Claim("FullName", user.FullName),
                new Claim("PreferredLanguage", user.PreferredLanguage),
                new Claim("DepartmentId", user.DepartmentId?.ToString() ?? string.Empty),
                new Claim("DepartmentName", user.Department?.Name ?? string.Empty),
                new Claim("DepartmentFullName", user.Department?.FullName ?? string.Empty),
                new Claim("DepartmentDescription", user.Department?.Description ?? string.Empty)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes)
            };

            httpContext.Response.Cookies.Append("jwt_token", tokenString, cookieOptions);
        }
    }
}
