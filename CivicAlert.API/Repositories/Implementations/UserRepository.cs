using CivicAlert.API.Data;
using CivicAlert.API.Models;
using CivicAlert.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Repositories.Implementations
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Users?> GetByEmailAsync(string email, CancellationToken ct = default)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Email == email, ct);
        }

        public async Task<Users?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == id, ct);
        }

        public async Task<Users> CreateAsync(Users user, CancellationToken ct = default)
        {
            await _context.Users.AddAsync(user, ct);
            await _context.SaveChangesAsync(ct);
            return user;
        }

        public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
        {
            return await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Email == email, ct);
        }
    }
}
