using CivicAlert.API.Data;
using CivicAlert.API.Responses.Lookups;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/lookups")]
    [Authorize]
    public class LookupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LookupsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("categories")]
        public async Task<ActionResult<List<LookupResponse>>> GetCategories(CancellationToken ct = default)
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .Select(c => new LookupResponse
                {
                    Id = c.Id,
                    Name = c.NameEn
                })
                .ToListAsync(ct);

            return Ok(categories);
        }

        [HttpGet("districts")]
        public async Task<ActionResult<List<LookupResponse>>> GetDistricts(CancellationToken ct = default)
        {
            var districts = await _context.Districts
                .AsNoTracking()
                .Select(d => new LookupResponse
                {
                    Id = d.Id,
                    Name = d.NameEn
                })
                .ToListAsync(ct);

            return Ok(districts);
        }

        [HttpGet("towns")]
        public async Task<ActionResult<List<LookupResponse>>> GetTowns(
            [FromQuery] int? districtId, CancellationToken ct = default)
        {
            var query = _context.Towns.AsNoTracking().AsQueryable();

            if (districtId.HasValue)
                query = query.Where(t => t.DistrictId == districtId.Value);

            var towns = await query
                .Select(t => new LookupResponse
                {
                    Id = t.Id,
                    Name = t.NameEn
                })
                .ToListAsync(ct);

            return Ok(towns);
        }

        [HttpGet("departments")]
        public async Task<ActionResult<List<LookupResponse>>> GetDepartments(CancellationToken ct = default)
        {
            var departments = await _context.Departments
                .AsNoTracking()
                .Where(d => d.IsActive)
                .Select(d => new LookupResponse
                {
                    Id = d.Id,
                    Name = d.Name
                })
                .ToListAsync(ct);

            return Ok(departments);
        }
    }
}
