using Microsoft.EntityFrameworkCore;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<CustomAiKey> CustomAiKeys => Set<CustomAiKey>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Expression> Expressions => Set<Expression>();
    public DbSet<Animation> Animations => Set<Animation>();
    public DbSet<AvatarModel> AvatarModels => Set<AvatarModel>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<RoleFeatureFlag> RoleFeatureFlags => Set<RoleFeatureFlag>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasOne(u => u.Settings).WithOne(s => s.User).HasForeignKey<UserSettings>(s => s.UserId);
        b.Entity<RefreshToken>().HasIndex(r => r.Token).IsUnique();
        b.Entity<Message>().HasIndex(m => new { m.UserId, m.CreatedAt });
        b.Entity<UserSubscription>().HasIndex(s => new { s.UserId, s.Status });
        b.Entity<Payment>().HasIndex(p => new { p.UserId, p.CreatedAt });
        b.Entity<CustomAiKey>().HasIndex(k => new { k.UserId, k.IsValid });
        b.Entity<AuditLog>().HasIndex(a => new { a.UserId, a.CreatedAt });
    }
}
