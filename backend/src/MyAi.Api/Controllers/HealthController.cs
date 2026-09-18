using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.Interfaces;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly IAppDbContext _db;

    public HealthController(IAppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var dbOk = _db.Users.Any();
        return Ok(new
        {
            status = dbOk ? "healthy" : "degraded",
            timestamp = DateTime.UtcNow,
            services = new { database = dbOk ? "healthy" : "unhealthy" },
            uptimeSeconds = (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime).TotalSeconds,
            version = "1.0.0",
        });
    }
}
