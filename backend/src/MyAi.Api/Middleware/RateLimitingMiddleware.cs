using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using StackExchange.Redis;

namespace MyAi.Api.Middleware;

/// <summary>
/// Redis sliding-window rate limiting on the chat endpoint (README §4 RateLimitingMiddleware).
/// Admin → unlimited; subscriber → 500/day; public_user → 50/day; default → 10/minute.
/// Fails soft: if Redis is down requests pass through (the DB-level daily count still applies).
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    public RateLimitingMiddleware(RequestDelegate next, IConnectionMultiplexer redis, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _redis = redis;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!IsRateLimitedEndpoint(context.Request))
        {
            await _next(context);
            return;
        }

        var (role, identity) = ResolveIdentity(context);
        var (limit, window) = GetRateLimitForRole(role);
        if (limit < 0) // admin → unlimited
        {
            await _next(context);
            return;
        }

        var key = $"ratelimit:{identity}:chat";
        var db = _redis.GetDatabase();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        try
        {
            await db.SortedSetRemoveRangeByScoreAsync(key, 0, now - window);
            var count = await db.SortedSetLengthAsync(key);

            if (count >= limit)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.ContentType = "application/json";
                AddRateLimitHeaders(context, limit, 0, now + window);
                await context.Response.WriteAsync("{\"error\":\"rate_limited\"}");
                return;
            }

            await db.SortedSetAddAsync(key, now.ToString(), now);
            await db.KeyExpireAsync(key, TimeSpan.FromSeconds(window));
            AddRateLimitHeaders(context, limit, (int)(limit - count - 1), now + window);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rate limiter Redis unavailable — passing through");
        }

        await _next(context);
    }

    private static (string role, string identity) ResolveIdentity(HttpContext context)
    {
        var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = context.User?.FindFirstValue(ClaimTypes.Role) ?? "anonymous";
        var identity = userId ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return (role, identity);
    }

    private static (int limit, int windowSeconds) GetRateLimitForRole(string role) => role switch
    {
        "admin" => (-1, 0),
        "subscriber" => (500, 86400),
        "public_user" => (50, 86400),
        _ => (10, 60),
    };

    private static bool IsRateLimitedEndpoint(HttpRequest req) =>
        HttpMethods.IsPost(req.Method) && req.Path.StartsWithSegments("/api/chat");

    private static void AddRateLimitHeaders(HttpContext context, int limit, int remaining, long resetAt)
    {
        context.Response.Headers["X-RateLimit-Limit"] = limit.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = remaining.ToString();
        context.Response.Headers["X-RateLimit-Reset"] = resetAt.ToString();
    }
}
