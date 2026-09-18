namespace MyAi.Application.Interfaces;

/// <summary>Best-effort cache (Redis in Infrastructure). Implementations must fail soft.</summary>
public interface ICache
{
    T? GetOrNothing<T>(string key);
    void Set(string key, object value, TimeSpan ttl);
}
