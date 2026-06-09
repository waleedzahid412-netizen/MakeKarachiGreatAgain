using CivicAlert.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PublicController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("transparency")]
        public async Task<IActionResult> GetTransparencyMetrics()
        {
            var totalReports = await _context.Reports.CountAsync();
            var resolvedCount = await _context.Reports.CountAsync(r => r.Status == "Resolved");

            double resolutionRate = 0;
            if (totalReports > 0)
            {
                resolutionRate = Math.Round(((double)resolvedCount / totalReports) * 100, 2);
            }

            // Average resolution time in hours
            var resolvedHistory = await _context.StatusHistories
                .Include(sh => sh.Report)
                .Where(sh => sh.NewStatus == "Resolved")
                .Select(sh => new { sh.ChangedAt, sh.Report!.CreatedAt })
                .ToListAsync();

            double avgResolutionHours = 0;
            if (resolvedHistory.Any())
            {
                double totalHours = resolvedHistory.Sum(x => (x.ChangedAt - x.CreatedAt).TotalHours);
                avgResolutionHours = Math.Round(totalHours / resolvedHistory.Count, 1);
            }

            // Reports by category
            var reportsByCategory = await _context.Reports
                .GroupBy(r => r.Category != null ? r.Category.NameEn : "Uncategorized")
                .Select(g => new { name = g.Key, count = g.Count() })
                .ToListAsync();

            // Reports by status
            var reportsByStatus = await _context.Reports
                .GroupBy(r => r.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync();

            // Reports by district
            var reportsByDistrict = await _context.Reports
                .GroupBy(r => r.District != null ? r.District.NameEn : "Unknown District")
                .Select(g => new { name = g.Key, count = g.Count() })
                .ToListAsync();

            // Recent resolved: last 10 resolved reports
            var recentResolved = await _context.StatusHistories
                .Include(sh => sh.Report)
                .ThenInclude(r => r!.Category)
                .Where(sh => sh.NewStatus == "Resolved")
                .OrderByDescending(sh => sh.ChangedAt)
                .Take(10)
                .Select(sh => new
                {
                    title = sh.Report != null ? sh.Report.Title : "Resolved Issue",
                    category = sh.Report != null && sh.Report.Category != null ? sh.Report.Category.NameEn : "Uncategorized",
                    resolvedDate = sh.ChangedAt
                })
                .ToListAsync();

            return Ok(new
            {
                totalReports,
                resolvedCount,
                resolutionRate,
                avgResolutionHours,
                reportsByCategory,
                reportsByStatus,
                reportsByDistrict,
                recentResolved
            });
        }
    }
}
