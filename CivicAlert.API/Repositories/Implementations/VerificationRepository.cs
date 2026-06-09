using CivicAlert.API.Data;
using CivicAlert.API.Models;
using CivicAlert.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace CivicAlert.API.Repositories.Implementations
{
    public class VerificationRepository : IVerificationRepository
    {
        private readonly ApplicationDbContext _context;

        public VerificationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> HasUserVerifiedAsync(int userId, int reportId)
        {
            return await _context.ReportVerifications
                .AsNoTracking()
                .AnyAsync(v => v.UserId == userId && v.ReportId == reportId);
        }

        public async Task<int> GetVerificationCountAsync(int reportId)
        {
            // Count confirmation votes ("Confirm")
            return await _context.ReportVerifications
                .AsNoTracking()
                .CountAsync(v => v.ReportId == reportId && v.VoteType == "Confirm");
        }

        public async Task CreateAsync(ReportVerification verification)
        {
            await _context.ReportVerifications.AddAsync(verification);
            await _context.SaveChangesAsync();
        }
    }
}
