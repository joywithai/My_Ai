using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IAppDbContext _db;

    public AuthController(AuthService auth, IAppDbContext db)
    {
        _auth = auth;
        _db = db;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req) =>
        await _auth.LoginAsync(req.Email, req.Password);

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
