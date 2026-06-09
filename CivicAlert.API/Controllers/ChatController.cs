using CivicAlert.API.Data;
using CivicAlert.API.Models;
using CivicAlert.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CivicAlert.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ApplicationDbContext _context;

        public ChatController(IAIService aiService, ApplicationDbContext context)
        {
            _aiService = aiService;
            _context = context;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Question))
            {
                return BadRequest("Question cannot be empty.");
            }

            if (request.Question.Length > 500)
            {
                return BadRequest("Question cannot exceed 500 characters.");
            }

            // Get client IP address
            var ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var actionType = $"chat_ip_{ip}";

            // Query a system user for FK database constraints (SuperAdmin or any seeded user)
            var systemUser = await _context.Users.OrderBy(u => u.Id).FirstOrDefaultAsync();
            if (systemUser == null)
            {
                return StatusCode(500, "System user placeholder not found.");
            }

            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(-1);

            // DB transactional check for rate limiting
            var rateLimit = await _context.RateLimits
                .FirstOrDefaultAsync(r => r.UserId == systemUser.Id && r.ActionType == actionType);

            if (rateLimit == null)
            {
                rateLimit = new RateLimit
                {
                    UserId = systemUser.Id,
                    ActionType = actionType,
                    LastActionAt = now,
                    ActionCount = 1
                };
                await _context.RateLimits.AddAsync(rateLimit);
            }
            else
            {
                if (rateLimit.LastActionAt < windowStart)
                {
                    // Reset window
                    rateLimit.LastActionAt = now;
                    rateLimit.ActionCount = 1;
                }
                else
                {
                    if (rateLimit.ActionCount >= 10)
                    {
                        return StatusCode(429, "Rate limit exceeded. Maximum 10 requests per minute.");
                    }
                    rateLimit.ActionCount++;
                    rateLimit.LastActionAt = now;
                }
                _context.RateLimits.Update(rateLimit);
            }

            await _context.SaveChangesAsync();

            // Query chatbot microservice
            var result = await _aiService.ChatAsync(request.Question, request.Language);
            return Ok(result);
        }
    }

    public class ChatRequestDto
    {
        public string Question { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
    }
}
