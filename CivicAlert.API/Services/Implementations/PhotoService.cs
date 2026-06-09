using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace CivicAlert.API.Services.Implementations
{
    public class PhotoService : IPhotoService
    {
        private readonly IWebHostEnvironment _env;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

        public PhotoService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string?> SavePhotoAsync(IFormFile? file, CancellationToken ct = default)
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.Length > MaxFileSizeBytes)
                throw new InvalidOperationException("File size exceeds 5MB limit.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
                throw new InvalidOperationException("Only .jpg, .jpeg, and .png files are allowed.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "reports");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, ct);
            }

            return $"/uploads/reports/{uniqueFileName}";
        }
    }
}
