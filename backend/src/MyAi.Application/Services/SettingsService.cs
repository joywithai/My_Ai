using System.Text.Json;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

public class SettingsService
{
    private readonly IAppDbContext _db;
    private readonly IEncryptionService _encryption;

    public SettingsService(IAppDbContext db, IEncryptionService encryption)
    {
        _db = db;
        _encryption = encryption;
    }

    public async Task<SettingsPatch> ApplyAsync(User user, SettingsPatch patch)
    {
        var s = _db.UserSettings.First(x => x.UserId == user.Id);

        if (!string.IsNullOrEmpty(patch.Language)) s.Language = patch.Language;
        if (!string.IsNullOrEmpty(patch.UiLanguage)) s.UiLanguage = patch.UiLanguage;
        if (!string.IsNullOrEmpty(patch.VoiceName)) s.DefaultVoice = patch.VoiceName;
        if (patch.VoiceSpeed.HasValue) s.VoiceSpeed = Math.Clamp(patch.VoiceSpeed.Value, 0.5m, 2.0m);
        if (patch.VoicePitch.HasValue) s.VoicePitch = Math.Clamp(patch.VoicePitch.Value, -50, 50);
        if (!string.IsNullOrEmpty(patch.DefaultExpression)) s.DefaultExpression = patch.DefaultExpression;
        if (patch.EnabledAnimations != null) s.EnabledAnimations = string.Join(",", patch.EnabledAnimations);
        if (patch.BlinkEnabled.HasValue) s.BlinkEnabled = patch.BlinkEnabled.Value;
        if (patch.ThinkingPoseEnabled.HasValue) s.ThinkingPoseEnabled = patch.ThinkingPoseEnabled.Value;
        if (patch.ShowSubtitles.HasValue) s.ShowSubtitles = patch.ShowSubtitles.Value;
        if (patch.AutoPlayAudio.HasValue) s.AutoPlayAudio = patch.AutoPlayAudio.Value;
        if (patch.DemoVoiceOn.HasValue) s.DemoVoiceOn = patch.DemoVoiceOn.Value;
        if (patch.AvatarModelId.HasValue) s.DefaultAvatarId = patch.AvatarModelId;
        s.UpdatedAt = DateTime.UtcNow;

        if (patch.CustomAi == null)
        {
            var old = _db.CustomAiKeys.Where(k => k.UserId == user.Id).ToList();
            foreach (var k in old) _db.CustomAiKeys.Remove(k);
        }
        else if (!string.IsNullOrEmpty(patch.CustomAi.ApiKey))
        {
            var flags = _db.RoleFeatureFlags.First(f => f.Role == user.Role);
            if (!flags.CanUseCustomApiKey)
                throw new AppException(403, "forbidden");

            var input = patch.CustomAi;
            var raw = input.ApiKey!;
            var old2 = _db.CustomAiKeys.Where(k => k.UserId == user.Id).ToList();
            foreach (var k in old2) _db.CustomAiKeys.Remove(k);
            _db.CustomAiKeys.Add(new CustomAiKey
            {
                UserId = user.Id,
                Provider = input.Provider == "openrouter" ? "openrouter" : "gemini",
                KeyEncrypted = _encryption.Encrypt(raw),
                MaskedKey = raw.Length > 10 ? raw[..5] + "…" + raw[^4..] : "••••••",
                AiModel = input.Model,
                BaseUrl = string.IsNullOrEmpty(input.BaseUrl)
                    ? (input.Provider == "openrouter" ? "https://openrouter.ai/api/v1/" : "https://generativelanguage.googleapis.com/v1beta/")
                    : input.BaseUrl,
                Temperature = (decimal)input.Temperature,
                MaxOutputTokens = input.MaxOutputTokens,
                IsValid = true,
                TestedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
        return patch;
    }
}
