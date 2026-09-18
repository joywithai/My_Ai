using System.Text.Json;
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
    public IActionResult Flags() => Ok(new { flags = _db.RoleFeatureFlags.ToDictionary(f => f.Role) });

    [HttpPut("flags")]
    public async Task<IActionResult> PutFlags([FromBody] FlagsEnvelope env)
    {
        await _admin.UpdateFlagsAsync(env.Role, env.Patch, AdminId);
        return Ok(new { flags = _db.RoleFeatureFlags.ToDictionary(f => f.Role) });
    }

    // ── expressions ──
    [HttpGet("expressions")]
    public IActionResult Expressions() => Ok(new
    {
        expressions = _db.Expressions.OrderBy(e => e.Label).Select(e => new
        {
            e.Id, e.Name, e.Label, e.MinRole, e.Active,
        }).ToList(),
    });

    [HttpPut("expressions")]
    public async Task<IActionResult> PutExpression([FromBody] CatalogPatch env)
    {
        var e = _db.Expressions.FirstOrDefault(x => x.Id == env.Id) ?? throw new AppException(404, "not_found");
        var p = env.Patch;
        if (p.TryGetBool("active", out var active)) e.Active = active;
        if (p.TryGetString("minRole", out var minRole)) e.MinRole = minRole;
        if (p.TryGetString("label", out var label)) e.Label = label;
        await _admin.LogAsync(AdminId, "update_expression", "expressions", e.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── animations ──
    [HttpGet("animations")]
    public IActionResult Animations() => Ok(new
    {
        animations = _db.Animations.OrderBy(a => a.Label).Select(a => new
        {
            a.Id, a.Name, a.Label, a.MinRole, a.Active,
        }).ToList(),
    });

    [HttpPut("animations")]
    public async Task<IActionResult> PutAnimation([FromBody] CatalogPatch env)
    {
        var a = _db.Animations.FirstOrDefault(x => x.Id == env.Id) ?? throw new AppException(404, "not_found");
        if (env.Patch.TryGetBool("active", out var active)) a.Active = active;
        if (env.Patch.TryGetString("minRole", out var minRole)) a.MinRole = minRole;
        await _admin.LogAsync(AdminId, "update_animation", "animations", a.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── avatar models ──
    [HttpGet("avatars")]
    public IActionResult AvatarModels() => Ok(new
    {
        models = _db.AvatarModels.OrderBy(a => a.Name).Select(a => new
        {
            a.Id, a.Name, a.Gender,
            file = a.FileUrl,
            a.MinRole,
            active = a.IsActive,
            a.IsDefault,
        }).ToList(),
    });

    [HttpPut("avatars")]
    public async Task<IActionResult> PutAvatarModel([FromBody] CatalogPatch env)
    {
        var m = _db.AvatarModels.FirstOrDefault(x => x.Id == env.Id) ?? throw new AppException(404, "not_found");
        if (env.Patch.TryGetBool("active", out var active)) m.IsActive = active;
        if (env.Patch.TryGetString("minRole", out var minRole)) m.MinRole = minRole;
        if (env.Patch.TryGetBool("isDefault", out var isDefault) && isDefault)
        {
            foreach (var x in _db.AvatarModels) x.IsDefault = x.Id == env.Id;
        }
        if (env.Patch.TryGetString("name", out var name)) m.Name = name;
        await _admin.LogAsync(AdminId, "update_avatar_model", "avatars", m.Name);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true });
    }

    // ── plans ──
    [HttpGet("plans")]
    public IActionResult Plans() => Ok(new
    {
        plans = _db.SubscriptionPlans.OrderBy(p => p.Price).Select(PlanMapper.ToDto).ToList(),
        payments = _db.Payments.OrderByDescending(p => p.CreatedAt).Take(50).Select(p => new
        {
            p.Id, p.Amount, p.Currency, p.Status, p.Provider, p.ReferenceId, p.CreatedAt,
        }).ToList(),
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
    public IActionResult System()
    {
        var sys = _db.SystemSettings.First();
        return Ok(new
        {
            systemSettings = new
            {
                sys.Id,
                sys.DefaultUiLanguage,
                sys.DefaultInputLanguage,
                sys.RegistrationOpen,
                sys.AiModel,
                framing = JsonSerializer.Deserialize<JsonElement>(sys.Framing),
                sys.UpdatedAt,
            },
        });
    }

    [HttpPut("settings")]
    public async Task<IActionResult> PutSystem([FromBody] SystemPatch p)
    {
        await _admin.UpdateSystemAsync(p.DefaultUiLanguage, p.DefaultInputLanguage, p.RegistrationOpen, p.AiModel, AdminId);
        if (p.Framing != null && p.Framing.Value.ValueKind == JsonValueKind.Object)
        {
            var sys = _db.SystemSettings.First();
            sys.Framing = p.Framing.Value.GetRawText();
            await _db.SaveChangesAsync();
        }
        var sys = _db.SystemSettings.First();
        return Ok(new
        {
            systemSettings = new
            {
                sys.Id,
                sys.DefaultUiLanguage,
                sys.DefaultInputLanguage,
                sys.RegistrationOpen,
                sys.AiModel,
                framing = JsonSerializer.Deserialize<JsonElement>(sys.Framing),
                sys.UpdatedAt,
            },
        });
    }

    // ── audit ──
    [HttpGet("audit")]
    public IActionResult Audit() => Ok(new
    {
        audit = _db.AuditLogs.OrderByDescending(a => a.CreatedAt).Take(80).Select(a => new
        {
            a.Id, a.UserId, a.Action, a.Resource,
            detail = a.Changes,
            a.CreatedAt,
        }).ToList(),
    });
}

// small request shapes
public record UserPatch(string? Role, string? Status, string? Name);
public record FlagsEnvelope(string Role, FlagsPatch Patch);
/// <summary>Frontend sends { id, patch: {…} } for catalog editors.</summary>
public record CatalogPatch(Guid Id, JsonElement Patch);

public static class JsonPatchExtensions
{
    public static bool TryGetBool(this JsonElement el, string name, out bool value)
    {
        value = default;
        if (el.ValueKind == JsonValueKind.Object
            && el.TryGetProperty(name, out var v)
            && (v.ValueKind == JsonValueKind.True || v.ValueKind == JsonValueKind.False))
        {
            value = v.GetBoolean();
            return true;
        }
        return false;
    }

    public static bool TryGetString(this JsonElement el, string name, out string value)
    {
        value = default!;
        if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String)
        {
            value = v.GetString()!;
            return true;
        }
        return false;
    }
}

public record PlanPatch(decimal? Price, bool? Active);
public record SystemPatch(string? DefaultUiLanguage, string? DefaultInputLanguage, bool? RegistrationOpen, string? AiModel, JsonElement? Framing);
