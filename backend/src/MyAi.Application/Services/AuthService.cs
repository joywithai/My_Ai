using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

public class AuthService
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;

    public AuthService(IAppDbContext db, IPasswordHasher hasher, IJwtService jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    public async Task<AuthResponse> LoginAsync(string email, string password)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == email.ToLowerInvariant().Trim());
        if (user == null || !_hasher.Verify(password, user.PasswordHash))
            throw new AppException(401, "invalid_credentials");
        if (user.Status == "banned")
            throw new AppException(403, "banned");

        user.LastLoginAt = DateTime.UtcNow;
        await EnsureSettingsAsync(user);
        await _db.SaveChangesAsync();

        var (token, _) = _jwt.CreateAccessToken(user);
        return new AuthResponse
        {
            Token = token,
            User = UserMapper.ToDto(user),
            Settings = UserMapper.ToDto(user.Settings!),
        };
    }

    public async Task<AuthResponse> RegisterAsync(string name, string email, string password)
    {
        var sys = _db.SystemSettings.First();
        if (!sys.RegistrationOpen)
            throw new AppException(403, "registration_closed");

        var mail = email.ToLowerInvariant().Trim();
        if (!mail.Contains('@') || password.Length < 6 || string.IsNullOrWhiteSpace(name))
            throw new AppException(400, "invalid_input");
        if (_db.Users.Any(u => u.Email == mail))
            throw new AppException(409, "email_taken");

        var user = new User
        {
            Email = mail,
            DisplayName = name.Trim(),
            PasswordHash = _hasher.Hash(password),
            Role = "public_user",
            LastLoginAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        user.Settings = new UserSettings
        {
            UserId = user.Id,
            Language = sys.DefaultInputLanguage,
            UiLanguage = sys.DefaultUiLanguage,
        };
        await _db.SaveChangesAsync();

        var (token, _) = _jwt.CreateAccessToken(user);
        return new AuthResponse
        {
            Token = token,
            User = UserMapper.ToDto(user),
            Settings = UserMapper.ToDto(user.Settings),
        };
    }

    public async Task EnsureSettingsAsync(User user)
    {
        if (_db.UserSettings.Any(s => s.UserId == user.Id)) return;
        var sys = _db.SystemSettings.First();
        user.Settings = new UserSettings
        {
            UserId = user.Id,
            Language = sys.DefaultInputLanguage,
            UiLanguage = sys.DefaultUiLanguage,
        };
        await _db.SaveChangesAsync();
    }
}

/// <summary>Maps to an HTTP status + machine-readable error code.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public AppException(int statusCode, string code) : base(code)
    {
        StatusCode = statusCode;
        Code = code;
    }
}
