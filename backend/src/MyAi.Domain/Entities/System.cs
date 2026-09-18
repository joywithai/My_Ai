namespace MyAi.Domain.Entities;

/// <summary>One row per role — admin controlled feature matrix (README 2.6).</summary>
public class RoleFeatureFlag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Role { get; set; } = "public_user";
    public bool CanUseCustomApiKey { get; set; }
    public bool CanAccessAllExpressions { get; set; }
    public bool CanAccessAllAnimations { get; set; }
    public bool CanSelectAvatarModel { get; set; }
    public bool CanCustomizeVoice { get; set; }
    public bool CanAccessChatHistory { get; set; } = true;
    public int MaxConversationHistory { get; set; } = 10;  // -1 = unlimited
    public int MaxMessagesPerDay { get; set; } = 50;       // -1 = unlimited
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Single row (Id = 1) with global system settings.</summary>
public class SystemSetting
{
    public int Id { get; set; } = 1;
    public string DefaultUiLanguage { get; set; } = "en";
    public string DefaultInputLanguage { get; set; } = "bn";
    public bool RegistrationOpen { get; set; } = true;
    public string AiModel { get; set; } = "gemini-2.5-flash";

    /// <summary>JSON: {targetY, camY, camZ, fov, locked} — admin-locked avatar framing.</summary>
    public string Framing { get; set; } = "{\"targetY\":1.43,\"camY\":1.46,\"camZ\":1.4,\"fov\":33,\"locked\":false}";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string Action { get; set; } = "";
    public string Resource { get; set; } = "";
    public Guid? ResourceId { get; set; }
    public string? Changes { get; set; }                   // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
