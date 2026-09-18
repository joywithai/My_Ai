using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Infrastructure.Auth;

/// <summary>RS256 access tokens (README §3.4) + opaque refresh tokens.</summary>
public class JwtTokenService : IJwtService
{
    private readonly IConfiguration _config;
    private readonly RSA _privateRsa;

    public JwtTokenService(IConfiguration config, RsaSigningKeyHolder holder)
    {
        _config = config;
        _privateRsa = holder.PrivateRsa;
    }

    public (string token, DateTime expiresAt) CreateAccessToken(User user)
    {
        var days = double.Parse(_config["Jwt:ExpireDays"] ?? "30");
        var expires = DateTime.UtcNow.AddDays(days);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role),
            new("jti", Guid.NewGuid().ToString("N")),
        };

        var jwt = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(
                new RsaSecurityKey(_privateRsa), SecurityAlgorithms.RsaSha256));

        return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}

/// <summary>Process-wide RSA holder — key loaded once, public params reused for validation.</summary>
public class RsaSigningKeyHolder
{
    public RSA PrivateRsa { get; }
    public RSAParameters PublicParameters { get; }

    public RsaSigningKeyHolder(Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
    {
        (PrivateRsa, PublicParameters) = RsaJwtKeys.LoadOrCreate(env.ContentRootPath);
    }
}
