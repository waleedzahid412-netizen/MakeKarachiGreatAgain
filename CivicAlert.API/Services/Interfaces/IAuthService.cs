using CivicAlert.API.DTOs.Auth;
using CivicAlert.API.Responses.Auth;
using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginDto loginDto, HttpContext httpContext, CancellationToken ct = default);
        Task<AuthResponse> RegisterAsync(RegisterDto registerDto, HttpContext httpContext, CancellationToken ct = default);
    }
}
