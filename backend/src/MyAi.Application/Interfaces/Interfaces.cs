using MyAi.Domain.Entities;

namespace MyAi.Application.Interfaces;

/// <summary>EF Core DbContext abstraction so Application stays persistence-agnostic.</summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<UserSettings> UserSettings { get; }
    DbSet<CustomAiKey> CustomAiKeys { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Message> Messages { get; }
    DbSet<Expression> Expressions { get; }
    DbSet<Animation> Animations { get; }
    DbSet<AvatarModel> AvatarModels { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<UserSubscription> UserSubscriptions { get; }
    DbSet<Payment> Payments { get; }
    DbSet<RoleFeatureFlag> RoleFeatureFlags { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<AuditLog> AuditLogs { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    int SaveChanges();
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtService
{
    (string token, DateTime expiresAt) CreateAccessToken(User user);
    string CreateRefreshToken();
}

public interface IEncryptionService
{
    byte[] Encrypt(string plain);
    string Decrypt(byte[] cipher);
}

/// <summary>AI completion (OpenRouter / Gemini). System default or the user's own key.</summary>
public interface IAiProvider
{
    Task<string> CompleteAsync(AiRequest request, CancellationToken ct = default);
}

public class AiRequest
{
    public string Provider { get; set; } = "gemini";      // gemini | openrouter
    public string? ApiKey { get; set; }                    // null → system default from config
    public string Model { get; set; } = "gemini-2.5-flash";
    public string BaseUrl { get; set; } = "";
    public double Temperature { get; set; } = 0.7;
    public int MaxOutputTokens { get; set; } = 2048;
    public string SystemPrompt { get; set; } = "";
    public string UserText { get; set; } = "";
}

/// <summary>Text-to-speech with word boundaries for 100% synced lip-sync.</summary>
public interface ITtsService
{
    Task<TtsResult> SynthesizeAsync(string text, string lang, string voice, double rate, double pitch, CancellationToken ct = default);
}

public class TtsResult
{
    public byte[] Audio { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "audio/mpeg";
    public List<WordBoundary> Boundaries { get; set; } = new();
}

public class WordBoundary
{
    public int CharIndex { get; set; }
    public int Length { get; set; }
    public string Text { get; set; } = "";
    public long Offset { get; set; }   // 100-ns ticks from speech start → exact audio sync
}

/// <summary>Reads the current JWT user from the request.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Role { get; }
}
