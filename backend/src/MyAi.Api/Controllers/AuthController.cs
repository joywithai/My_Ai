using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly TokenService _tokens;
    private readonly IAppDbContext _db;

    public AuthController(AuthService auth, TokenService tokens, IAppDbContext db)
    {
        _auth = auth;
        _tokens = tokens;
        _db = db;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var res = await _auth.LoginAsync(req.Email, req.Password);
        return Ok(res);
    }

    /// <summary>Refresh rotation (README §3.4) — returns a fresh access + refresh pair.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest req) =>
        await _auth.RefreshAsync(req.RefreshToken);

    /// <summary>Revokes every refresh token of the current user (README §5 refresh_tokens).</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = User.GetUserId();
        if (userId.HasValue) await _tokens.RevokeAllForAsync(userId.Value);
        return NoContent();
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req) =>
        await _auth.RegisterAsync(req.Name, req.Email, req.Password);

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        var settings = _db.UserSettings.FirstOrDefault(s => s.UserId == user.Id);
        var sub = _db.UserSubscriptions.FirstOrDefault(s => s.UserId == user.Id && s.Status == "active");
        return Ok(new { user = UserMapper.ToDto(user), settings = settings == null ? null : UserMapper.ToDto(settings), subscription = sub });
    }

    [HttpPatch("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest req)
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        if (!string.IsNullOrWhiteSpace(req.Name)) user.DisplayName = req.Name.Trim();
        await _db.SaveChangesAsync();
        return Ok(new { user = UserMapper.ToDto(user) });
    }
}
