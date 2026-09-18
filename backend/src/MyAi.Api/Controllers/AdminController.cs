using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _admin;
    private readonly IAppDbContext _db;

    public AdminController(AdminService admin, IAppDbContext db)
    {
        _admin = admin;
        _db = db;
    }

    private Guid AdminId => User.UserId();

    // ── users ──
    [HttpGet("users")]
    public IActionResult Users() => Ok(new { users = _admin.GetUsers() });

    [HttpPatch("users/{id:guid}")]
    public async Task<IActionResult> PatchUser(Guid id, [FromBody] UserPatch req)
    {
        await _admin.UpdateUserAsync(id, req.Role, req.Status, req.Name, AdminId);
        return Ok(new { ok = true });
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await _admin.DeleteUserAsync(id, AdminId);
        return Ok(new { ok = true });
    }

    // ── flags ──
    [HttpGet("flags")]
    public IActionResult Flags() => Ok(new { flags = _db.RoleFeatureFlags.ToList() });

    [HttpPut("flags")]
    public async Task<IActionResult> PutFlags([FromBody] FlagsEnvelope env)
    {
        await _admin.UpdateFlagsAsync(env.Role, env.Patch, AdminId);
        return Ok(new { flags = _db.RoleFeatureFlags.ToList() });
    }

    // ── expressions ──
    [HttpGet("expressions")]
    public IActionResult Expressions() => Ok(new { expressions = _db.Expressions.OrderBy(e => e.Label).ToList() });

    [HttpPut("expressions")]
    public async Task<IActionResult> PutExpression([FromBody] ExpressionPatch p)
    {
        var e = _db.Expressions.FirstOrDefault(x => x.Id == p.Id) ?? throw new AppException(404, "not_found");
        if (p.Active.HasValue) e.Active = p.Active.Value;
        if (!string.IsNullOrEmpty(p.MinRole)) e.MinRole = p.MinRole;
        if (!string.IsNullOrEmpty(p.Label)) e.Label = p.Label;
        await _admin.LogAsync(AdminId, "update_expression", "expressions", e.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── animations ──
    [HttpGet("animations")]
    public IActionResult Animations() => Ok(new { animations = _db.Animations.OrderBy(a => a.Label).ToList() });

    [HttpPut("animations")]
    public async Task<IActionResult> PutAnimation([FromBody] AnimationPatch p)
    {
        var a = _db.Animations.FirstOrDefault(x => x.Id == p.Id) ?? throw new AppException(404, "not_found");
        if (p.Active.HasValue) a.Active = p.Active.Value;
        if (!string.IsNullOrEmpty(p.MinRole)) a.MinRole = p.MinRole;
        await _admin.LogAsync(AdminId, "update_animation", "animations", a.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── avatar models ──
    [HttpGet("avatars")]
    public IActionResult AvatarModels() => Ok(new { models = _db.AvatarModels.OrderBy(a => a.Name).ToList() });

    [HttpPut("avatars")]
    public async Task<IActionResult> PutAvatarModel([FromBody] AvatarModelPatch p)
    {
        var m = _db.AvatarModels.FirstOrDefault(x => x.Id == p.Id) ?? throw new AppException(404, "not_found");
        if (p.Active.HasValue) m.IsActive = p.Active.Value;
        if (!string.IsNullOrEmpty(p.MinRole)) m.MinRole = p.MinRole;
        if (p.IsDefault == true)
        {
            foreach (var x in _db.AvatarModels) x.IsDefault = x.Id == p.Id;
        }
        if (!string.IsNullOrEmpty(p.Name)) m.Name = p.Name;
        await _admin.LogAsync(AdminId, "update_avatar_model", "avatars", m.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── plans ──
    [HttpGet("plans")]
    public IActionResult Plans() => Ok(new
    {
        plans = _db.SubscriptionPlans.OrderBy(p => p.Price).ToList(),
        payments = _db.Payments.OrderByDescending(p => p.CreatedAt).Take(50).ToList(),
        subscriptions = _db.UserSubscriptions.Where(s => s.Status == "active").ToList(),
    });

    [HttpPatch("plans/{id:guid}")]
    public async Task<IActionResult> PatchPlan(Guid id, [FromBody] PlanPatch p)
    {
        await _admin.UpdatePlanAsync(id, p.Price, p.Active, AdminId);
        return Ok(new { ok = true });
    }

    // ── system ──
    [HttpGet("settings")]
    public IActionResult System() => Ok(new { systemSettings = _db.SystemSettings.First() });

    [HttpPut("settings")]
    public async Task<IActionResult> PutSystem([FromBody] SystemPatch p)
    {
        await _admin.UpdateSystemAsync(p.DefaultUiLanguage, p.DefaultInputLanguage, p.RegistrationOpen, p.AiModel, AdminId);
        return Ok(new { systemSettings = _db.SystemSettings.First() });
    }

    // ── audit ──
    [HttpGet("audit")]
    public IActionResult Audit() => Ok(new { audit = _db.AuditLogs.OrderByDescending(a => a.CreatedAt).Take(80).ToList() });
}

// small request shapes
public record UserPatch(string? Role, string? Status, string? Name);
public record FlagsEnvelope(string Role, FlagsPatch Patch);
public record ExpressionPatch(Guid Id, bool? Active, string? MinRole, string? Label);
public record AnimationPatch(Guid Id, bool? Active, string? MinRole);
public record AvatarModelPatch(Guid Id, bool? Active, string? MinRole, bool? IsDefault, string? Name);
public record PlanPatch(decimal? Price, bool? Active);
public record SystemPatch(string? DefaultUiLanguage, string? DefaultInputLanguage, bool? RegistrationOpen, string? AiModel);
