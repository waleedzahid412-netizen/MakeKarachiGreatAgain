using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CivicAlert.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var user = Context.User;
            if (user != null)
            {
                var userIdClaim = user.FindFirst("UserId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userIdClaim}");
                }

                var roleClaim = user.FindFirst("Role")?.Value ?? user.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(roleClaim))
                {
                    if (roleClaim == "SuperAdmin")
                    {
                        await Groups.AddToGroupAsync(Context.ConnectionId, "role_SuperAdmin");
                    }
                    else if (roleClaim == "DistrictAdmin")
                    {
                        var districtIdClaim = user.FindFirst("DistrictId")?.Value;
                        if (!string.IsNullOrEmpty(districtIdClaim))
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_DistrictAdmin_{districtIdClaim}");
                        }
                    }
                    else if (roleClaim == "TownAdmin")
                    {
                        var townIdClaim = user.FindFirst("TownId")?.Value;
                        if (!string.IsNullOrEmpty(townIdClaim))
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, $"role_TownAdmin_{townIdClaim}");
                        }
                    }
                }
            }

            await base.OnConnectedAsync();
        }

        public async Task SendNotification(string userId, string message, string type)
        {
            // Can be called by client if needed, though most notifications trigger from backend service actions
            await Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
            {
                Id = 0,
                UserId = int.TryParse(userId, out int uid) ? uid : 0,
                ReportId = 0,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
