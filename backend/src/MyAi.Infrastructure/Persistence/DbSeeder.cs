using Microsoft.EntityFrameworkCore;
using MyAi.Domain.Entities;

namespace MyAi.Infrastructure.Persistence;

/// <summary>Seeds demo accounts, flags, catalog and system settings (idempotent).</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (!db.SystemSettings.Any())
            db.SystemSettings.Add(new SystemSetting());

        if (!db.RoleFeatureFlags.Any())
        {
            db.RoleFeatureFlags.AddRange(
                new RoleFeatureFlag
                {
                    Role = "admin",
                    CanUseCustomApiKey = true, CanAccessAllExpressions = true, CanAccessAllAnimations = true,
                    CanSelectAvatarModel = true, CanCustomizeVoice = true, CanAccessChatHistory = true,
                    MaxConversationHistory = -1, MaxMessagesPerDay = -1,
                },
                new RoleFeatureFlag
                {
                    Role = "subscriber",
                    CanUseCustomApiKey = true, CanAccessAllExpressions = true, CanAccessAllAnimations = true,
                    CanSelectAvatarModel = true, CanCustomizeVoice = true, CanAccessChatHistory = true,
                    MaxConversationHistory = -1, MaxMessagesPerDay = 500,
                },
                new RoleFeatureFlag
                {
                    Role = "public_user",
                    CanUseCustomApiKey = false, CanAccessAllExpressions = false, CanAccessAllAnimations = false,
                    CanSelectAvatarModel = false, CanCustomizeVoice = false, CanAccessChatHistory = true,
                    MaxConversationHistory = 10, MaxMessagesPerDay = 50,
                });
        }

        if (!db.Users.Any())
        {
            var admin = new User { Email = "admin@demo.com", DisplayName = "Admin", Role = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123") };
            var sub = new User { Email = "sub@demo.com", DisplayName = "Nabanita", Role = "subscriber", PasswordHash = BCrypt.Net.BCrypt.HashPassword("sub12345") };
            var pub = new User { Email = "public@demo.com", DisplayName = "Demo User", Role = "public_user", PasswordHash = BCrypt.Net.BCrypt.HashPassword("public123") };
            db.Users.AddRange(admin, sub, pub);
            foreach (var u in new[] { admin, sub, pub })
                db.UserSettings.Add(new UserSettings { UserId = u.Id });
        }

        if (!db.Expressions.Any())
        {
            var publicSet = new[] { "neutral", "happy", "sad", "surprised" };
            var all = new[] { "neutral", "happy", "sad", "angry", "surprised", "relaxed", "excited", "confused", "thoughtful", "concerned", "friendly", "serious" };
            foreach (var name in all)
                db.Expressions.Add(new Expression
                {
                    Name = name,
                    Label = char.ToUpper(name[0]) + name[1..],
                    MinRole = publicSet.Contains(name) ? "public_user" : "subscriber",
                });
        }

        if (!db.Animations.Any())
        {
            foreach (var (name, label, minRole) in new[]
            {
                ("breathing", "Breathing", "public_user"),
                ("head-sway", "Head sway", "subscriber"),
                ("shoulder-bob", "Shoulder bob", "subscriber"),
                ("hand-gesture", "Hand gesture", "subscriber"),
                ("thinking-pose", "Thinking pose", "subscriber"),
                ("wave", "Wave", "subscriber"),
            })
                db.Animations.Add(new Animation { Name = name, Label = label, MinRole = minRole });
        }

        if (!db.AvatarModels.Any())
        {
            db.AvatarModels.AddRange(
                new AvatarModel { Name = "Nabanita (Female)", Gender = "female", FileUrl = "/models/avatar.vrm", MinRole = "public_user", IsDefault = true },
                new AvatarModel { Name = "Arjun (Male)", Gender = "male", FileUrl = "/models/avatar-male.vrm", MinRole = "subscriber" });
        }

        if (!db.SubscriptionPlans.Any())
        {
            db.SubscriptionPlans.AddRange(
                new SubscriptionPlan { Name = "Free", Price = 0, Currency = "BDT", BillingPeriod = "monthly", Features = "[\"50 messages / day\",\"Basic expressions\",\"Default avatar\",\"10 conversations\"]" },
                new SubscriptionPlan { Name = "Pro Monthly", Price = 499, Currency = "BDT", BillingPeriod = "monthly", Features = "[\"Unlimited messages\",\"All 12 expressions\",\"All animations\",\"Custom AI key\",\"Voice speed & pitch\",\"All avatars\"]" },
                new SubscriptionPlan { Name = "Pro Yearly", Price = 4990, Currency = "BDT", BillingPeriod = "yearly", Features = "[\"Everything in Pro\",\"2 months free\",\"Priority response\"]" });
        }

        await db.SaveChangesAsync();
    }
}
