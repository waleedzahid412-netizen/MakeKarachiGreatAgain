using Microsoft.AspNetCore.Http;

namespace CivicAlert.API.Services.Interfaces
{
    public interface IPhotoService
    {
        Task<string?> SavePhotoAsync(IFormFile? file, CancellationToken ct = default);
    }
}
