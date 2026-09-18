using Microsoft.EntityFrameworkCore;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

public class AdminService
{
    private readonly IAppDbContext _db;
    private readonly ICache _cache;

    public AdminService(IAppDbContext db, ICache cache)
    {
        _db = db;
        _cache = cache;
    }

    public List<object> GetUsers()
    {
        var today = DateTime.UtcNow.Date;
        return _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToList()
            .Select(u =>
            {
                var flags = _db.RoleFeatureFlags.First(f => f.Role == u.Role);
                var sub = _db.UserSubscriptions.FirstOrDefault(s => s.UserId == u.Id && s.Status == "active");
                var messagesToday = _db.Messages.Count(m => m.UserId == u.Id && m.Role == "user" && m.CreatedAt >= today);
                var hasKey = _db.CustomAiKeys.Any(k => k.UserId == u.Id);
                return (object)new
                {
                    id = u.Id,
                    email = u.Email,
                    name = u.DisplayName,
                    role = u.Role,
                    status = u.Status,
                    createdAt = u.CreatedAt,
                    lastLoginAt = u.LastLoginAt,
                    subscribedUntil = sub?.ExpiresAt,
                    messagesToday,
                    dailyLimit = flags.MaxMessagesPerDay,
                    hasCustomKey = hasKey,
                };
            })
            .ToList();
    }

    public async Task UpdateUserAsync(Guid id, string? role, string? status, string? name, Guid adminId)
    {
        var user = _db.Users.FirstOrDefault(u => u.Id == id) ?? throw new AppException(404, "not_found");
        if (user.Id == adminId) throw new AppException(400, "cannot_modify_self");
        if (role != null && new[] { "admin", "subscriber", "public_user" }.Contains(role)) user.Role = role;
        if (status != null && new[] { "active", "banned", "inactive" }.Contains(status)) user.Status = status;
        if (!string.IsNullOrWhiteSpace(name)) user.DisplayName = name.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await LogAsync(adminId, "update_user", "users", user.Email);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteUserAsync(Guid id, Guid adminId)
    {
        var user = _db.Users.FirstOrDefault(u => u.Id == id) ?? throw new AppException(404, "not_found");
        if (user.Id == adminId) throw new AppException(400, "cannot_modify_self");
        var convIds = _db.Conversations.Where(c => c.UserId == id).Select(c => c.Id).ToList();
        var msgs = _db.Messages.Where(m => convIds.Contains(m.ConversationId)).ToList();
        foreach (var m in msgs) _db.Messages.Remove(m);
        var convs = _db.Conversations.Where(c => c.UserId == id).ToList();
        foreach (var c in convs) _db.Conversations.Remove(c);
        var settings = _db.UserSettings.FirstOrDefault(s => s.UserId == id);
        if (settings != null) _db.UserSettings.Remove(settings);
        var keys = _db.CustomAiKeys.Where(k => k.UserId == id).ToList();
        foreach (var k in keys) _db.CustomAiKeys.Remove(k);
        _db.Users.Remove(user);
        await LogAsync(adminId, "delete_user", "users", user.Email);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateFlagsAsync(string role, FlagsPatch patch, Guid adminId)
    {
        var flags = _db.RoleFeatureFlags.FirstOrDefault(f => f.Role == role)
            ?? throw new AppException(400, "bad_role");
        if (patch.CanUseCustomApiKey.HasValue) flags.CanUseCustomApiKey = patch.CanUseCustomApiKey.Value;
        if (patch.CanAccessAllExpressions.HasValue) flags.CanAccessAllExpressions = patch.CanAccessAllExpressions.Value;
        if (patch.CanAccessAllAnimations.HasValue) flags.CanAccessAllAnimations = patch.CanAccessAllAnimations.Value;
        if (patch.CanSelectAvatarModel.HasValue) flags.CanSelectAvatarModel = patch.CanSelectAvatarModel.Value;
        if (patch.CanCustomizeVoice.HasValue) flags.CanCustomizeVoice = patch.CanCustomizeVoice.Value;
        if (patch.CanAccessChatHistory.HasValue) flags.CanAccessChatHistory = patch.CanAccessChatHistory.Value;
        if (patch.MaxConversationHistory.HasValue) flags.MaxConversationHistory = patch.MaxConversationHistory.Value;
        if (patch.MaxMessagesPerDay.HasValue) flags.MaxMessagesPerDay = patch.MaxMessagesPerDay.Value;
        flags.UpdatedAt = DateTime.UtcNow;
        _cache.Set($"flags:{role}", flags, TimeSpan.FromSeconds(60));
        await LogAsync(adminId, "update_flags", "flags", role);
        await _db.SaveChangesAsync();
    }

    public async Task UpdatePlanAsync(Guid id, decimal? price, bool? active, Guid adminId)
    {
        var plan = _db.SubscriptionPlans.FirstOrDefault(p => p.Id == id) ?? throw new AppException(404, "not_found");
        if (price.HasValue && price.Value >= 0) plan.Price = price.Value;
        if (active.HasValue) plan.IsActive = active.Value;
        await LogAsync(adminId, "update_plan", "plans", plan.Name);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateSystemAsync(string? uiLang, string? inputLang, bool? registrationOpen, string? aiModel, Guid adminId)
    {
        var sys = _db.SystemSettings.First();
        if (uiLang == "bn" || uiLang == "en") sys.DefaultUiLanguage = uiLang;
        if (inputLang == "bn" || inputLang == "en") sys.DefaultInputLanguage = inputLang;
        if (registrationOpen.HasValue) sys.RegistrationOpen = registrationOpen.Value;
        if (!string.IsNullOrWhiteSpace(aiModel)) sys.AiModel = aiModel.Trim();
        sys.UpdatedAt = DateTime.UtcNow;
        await LogAsync(adminId, "update_system", "system");
        await _db.SaveChangesAsync();
    }

    public async Task LogAsync(Guid? userId, string action, string resource, string? detail = null)
    {
        _db.AuditLogs.Add(new AuditLog { UserId = userId, Action = action, Resource = resource, Changes = detail });
        await Task.CompletedTask;
    }
}
