using System.Text.Json;
using MyAi.Domain.Entities;

namespace MyAi.Application.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = "";
    public string RefreshToken { get; set; } = "";
    public object User { get; set; } = new();
    public object? Settings { get; set; }
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = "";
}

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RegisterRequest
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class UpdateProfileRequest { public string Name { get; set; } = ""; }

public class ChatRequest
{
    public string Message { get; set; } = "";
    public string Lang { get; set; } = "bn";
    public Guid? ConversationId { get; set; }
}

public class ChatResponse
{
    public Guid ConversationId { get; set; }
    public List<ExpressionSegment> Segments { get; set; } = new();
    public UsageInfo Usage { get; set; } = new();
}

public class ExpressionSegment
{
    public string Expression { get; set; } = "neutral";
    public string Text { get; set; } = "";
}

public class UsageInfo
{
    public int Count { get; set; }
    public int Limit { get; set; } = -1;
}

public class TtsRequest
{
    public string Text { get; set; } = "";
    public string Lang { get; set; } = "bn";
    public string? Voice { get; set; }
    public double Rate { get; set; } = 1.0;
    public int Pitch { get; set; } = 0;
}

public class CheckoutRequest { public Guid PlanId { get; set; } }

public class SettingsPatch
{
    public string? Language { get; set; }
    public string? UiLanguage { get; set; }
    public string? VoiceName { get; set; }
    public decimal? VoiceSpeed { get; set; }
    public int? VoicePitch { get; set; }
    public string? DefaultExpression { get; set; }
    public List<string>? EnabledAnimations { get; set; }
    public bool? BlinkEnabled { get; set; }
    public bool? ThinkingPoseEnabled { get; set; }
    public bool? ShowSubtitles { get; set; }
    public bool? AutoPlayAudio { get; set; }
    public bool? DemoVoiceOn { get; set; }
    public Guid? AvatarModelId { get; set; }
    /// null = remove key, absent = untouched, object = save (matches frontend demo semantics)
    public JsonElement? CustomAi { get; set; }
}

public class CustomAiInput
{
    public string Provider { get; set; } = "gemini";
    public string? ApiKey { get; set; }                    // null → keep existing
    public string Model { get; set; } = "gemini-2.5-flash";
    public string BaseUrl { get; set; } = "";
    public double Temperature { get; set; } = 0.7;
    public int MaxOutputTokens { get; set; } = 2048;
}

public class FlagsPatch
{
    public bool? CanUseCustomApiKey { get; set; }
    public bool? CanAccessAllExpressions { get; set; }
    public bool? CanAccessAllAnimations { get; set; }
    public bool? CanSelectAvatarModel { get; set; }
    public bool? CanCustomizeVoice { get; set; }
    public bool? CanAccessChatHistory { get; set; }
    public int? MaxConversationHistory { get; set; }
    public int? MaxMessagesPerDay { get; set; }
}

public static class PlanMapper
{
    /// <summary>UI contract: {id,name,price,currency,cycle,features[],popular,active}.</summary>
    public static object ToDto(SubscriptionPlan p) => new
    {
        id = p.Id,
        name = p.Name,
        price = p.Price,
        currency = p.Currency,
        cycle = p.BillingPeriod,
        features = ParseFeatures(p.Features),
        popular = p.BillingPeriod == "monthly" && p.Price > 0,
        active = p.IsActive,
    };

    private static List<string> ParseFeatures(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
        catch { return new List<string>(); }
    }
}

public static class UserMapper
{
    public static object ToDto(User u) => new
    {
        id = u.Id,
        email = u.Email,
        name = u.DisplayName,
        role = u.Role,
        status = u.Status,
    };

    public static object ToDto(UserSettings s, string? maskedKey = null) => new
    {
        language = s.Language,
        uiLanguage = s.UiLanguage,
        voiceName = s.DefaultVoice,
        voiceSpeed = s.VoiceSpeed,
        voicePitch = s.VoicePitch,
        defaultExpression = s.DefaultExpression,
        enabledAnimations = s.EnabledAnimations.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
        blinkEnabled = s.BlinkEnabled,
        thinkingPoseEnabled = s.ThinkingPoseEnabled,
        showSubtitles = s.ShowSubtitles,
        autoPlayAudio = s.AutoPlayAudio,
        demoVoiceOn = s.DemoVoiceOn,
        avatarModelId = s.DefaultAvatarId,
    };
}
