namespace MyAi.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "public_user";   // admin | subscriber | public_user
    public string Status { get; set; } = "active";      // active | inactive | banned
    public bool EmailVerified { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // navigation
    public UserSettings? Settings { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = new();
    public List<Conversation> Conversations { get; set; } = new();
    public List<UserSubscription> Subscriptions { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
    public List<CustomAiKey> CustomAiKeys { get; set; } = new();
}

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? CreatedByIp { get; set; }
    public string? ReplacedByToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

public class UserSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Language { get; set; } = "bn";          // chat input language
    public string UiLanguage { get; set; } = "en";        // interface language
    public string DefaultVoice { get; set; } = "bn-BD-NabanitaNeural";
    public decimal VoiceSpeed { get; set; } = 1.0m;       // 0.50 - 2.00
    public int VoicePitch { get; set; } = 0;              // -50 - +50
    public string DefaultExpression { get; set; } = "relaxed";
    public string EnabledAnimations { get; set; } = "breathing"; // comma separated
    public bool BlinkEnabled { get; set; } = true;
    public bool ThinkingPoseEnabled { get; set; } = true;
    public bool ShowSubtitles { get; set; } = true;
    public bool AutoPlayAudio { get; set; } = true;
    public bool DemoVoiceOn { get; set; } = true;
    public Guid? DefaultAvatarId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public AvatarModel? DefaultAvatar { get; set; }
}

public class CustomAiKey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Provider { get; set; } = "gemini";      // gemini | openrouter
    public byte[] KeyEncrypted { get; set; } = Array.Empty<byte>();
    public string MaskedKey { get; set; } = "";
    public string AiModel { get; set; } = "gemini-2.5-flash";
    public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1/";
    public decimal Temperature { get; set; } = 0.7m;
    public int MaxOutputTokens { get; set; } = 2048;
    public bool IsValid { get; set; } = true;
    public DateTime? TestedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
