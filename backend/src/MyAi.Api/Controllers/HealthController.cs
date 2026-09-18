using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.Interfaces;
using StackExchange.Redis;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IConnectionMultiplexer _redis;

    public HealthController(IAppDbContext db, IConnectionMultiplexer redis)
    {
        _db = db;
        _redis = redis;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var dbOk = _db.Users.Any();
        var redisOk = _redis.IsConnected;
        return Ok(new
        {
            status = dbOk ? "healthy" : "degraded",
            timestamp = DateTime.UtcNow,
            services = new
            {
                database = dbOk ? "healthy" : "unhealthy",
                redis = redisOk ? "healthy" : "degraded",
            },
            uptimeSeconds = (long)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime).TotalSeconds,
            version = "1.0.0",
        });
    }
}
