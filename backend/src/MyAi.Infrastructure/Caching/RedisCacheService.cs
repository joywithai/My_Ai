using System.Text.Json;
using StackExchange.Redis;
using MyAi.Application.Interfaces;

namespace MyAi.Infrastructure.Caching;

/// <summary>
/// Redis-backed cache (README §4.1). Fails soft: when Redis is down every call
/// falls back to a direct DB read — graceful degradation (README §3.3).
/// </summary>
public class RedisCacheService : ICache
{
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis) => _redis = redis;

    public T? GetOrNothing<T>(string key)
    {
        try
        {
            var db = _redis.GetDatabase();
            var raw = db.StringGet(key);
            return raw.IsNullOrEmpty ? default : JsonSerializer.Deserialize<T>(raw!);
        }
        catch
        {
            return default;
        }
    }

    public void Set(string key, object value, TimeSpan ttl)
    {
        try
        {
            _redis.GetDatabase().StringSet(key, JsonSerializer.Serialize(value), ttl);
        }
        catch
        {
            /* cache is best-effort */
        }
    }
}
