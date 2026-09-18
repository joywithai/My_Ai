using System.Security.Claims;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

/// <summary>Issues and rotates refresh tokens (stored as SHA-256 hashes, README §5 refresh_tokens).</summary>
public class TokenService
{
    private readonly IAppDbContext _db;
    private readonly IJwtService _jwt;

    public TokenService(IAppDbContext db, IJwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public string IssueRefreshToken(User user, string? ip)
    {
        var raw = _jwt.CreateRefreshToken();
        var days = 30;
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = Hash(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedByIp = ip,
        });
        return raw;
    }

    /// <summary>Rotation: old token is revoked, a fresh pair is returned (README §3.4).</summary>
    public async Task<(string accessToken, string refreshToken, User user)> RotateAsync(string rawToken)
    {
        var stored = _db.RefreshTokens.FirstOrDefault(r => r.Token == Hash(rawToken))
            ?? throw new AppException(401, "invalid_refresh_token");

        if (stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            throw new AppException(401, "invalid_refresh_token");

        var user = _db.Users.FirstOrDefault(u => u.Id == stored.UserId)
            ?? throw new AppException(401, "invalid_refresh_token");
        if (user.Status == "banned") throw new AppException(403, "banned");

        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;

        var (access, _) = _jwt.CreateAccessToken(user);
        var refresh = IssueRefreshToken(user, null);
        await _db.SaveChangesAsync();
        return (access, refresh, user);
    }

    public async Task RevokeAllForAsync(Guid userId)
    {
        foreach (var r in _db.RefreshTokens.Where(r => r.UserId == userId && !r.IsRevoked))
        {
            r.IsRevoked = true;
            r.RevokedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    private static string Hash(string raw)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
