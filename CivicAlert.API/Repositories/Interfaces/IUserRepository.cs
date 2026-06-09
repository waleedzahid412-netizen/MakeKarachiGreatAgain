using CivicAlert.API.Models;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<Users?> GetByEmailAsync(string email, CancellationToken ct = default);
        Task<Users?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<Users> CreateAsync(Users user, CancellationToken ct = default);
        Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    }
}
