using MyAi.Application.Interfaces;

namespace MyAi.Api.Jobs;

/// <summary>Daily: expire lapsed subscriptions + trim audit log (README §17.4 retention).</summary>
public class SubscriptionCleanupJob
{
    private readonly IAppDbContext _db;
    private readonly ILogger<SubscriptionCleanupJob> _logger;

    public SubscriptionCleanupJob(IAppDbContext db, ILogger<SubscriptionCleanupJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Run()
    {
        var now = DateTime.UtcNow;
        var lapsed = _db.UserSubscriptions.Where(s => s.Status == "active" && s.ExpiresAt < now).ToList();
        foreach (var s in lapsed)
        {
            s.Status = "expired";
            var user = _db.Users.FirstOrDefault(u => u.Id == s.UserId);
            if (user != null && user.Role == "subscriber") user.Role = "public_user";
        }

        var cutoff = now.AddYears(-2);
        var oldAudit = _db.AuditLogs.Where(a => a.CreatedAt < cutoff).ToList();
        foreach (var a in oldAudit) _db.AuditLogs.Remove(a);

        await _db.SaveChangesAsync();
        _logger.LogInformation("Cleanup: {Expired} subscriptions expired, {Audit} audit rows purged", lapsed.Count, oldAudit.Count);
    }
}
