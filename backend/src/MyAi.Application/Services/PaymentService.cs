using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

public class PaymentService
{
    private readonly IAppDbContext _db;

    public PaymentService(IAppDbContext db) => _db = db;

    /// <summary>Demo gateway: succeeds instantly. Swap provider string for Stripe/SSLCommerz later.</summary>
    public async Task<Payment> CheckoutAsync(User user, Guid planId)
    {
        var plan = _db.SubscriptionPlans.FirstOrDefault(p => p.Id == planId && p.IsActive)
            ?? throw new AppException(400, "invalid_plan");
        if (plan.Price <= 0) throw new AppException(400, "invalid_plan");

        var payment = new Payment
        {
            UserId = user.Id,
            PlanId = plan.Id,
            Amount = plan.Price,
            Currency = plan.Currency,
            Status = "succeeded",
            Provider = "demo",
            ReferenceId = "demo_" + Guid.NewGuid().ToString("N")[..8],
        };
        _db.Payments.Add(payment);

        // cancel old, add new subscription
        var subs = _db.UserSubscriptions.Where(s => s.UserId == user.Id && s.Status == "active").ToList();
        foreach (var s in subs) s.Status = "cancelled";
        var days = plan.BillingPeriod == "yearly" ? 365 : 30;
        _db.UserSubscriptions.Add(new UserSubscription
        {
            UserId = user.Id,
            PlanId = plan.Id,
            Status = "active",
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            PaymentId = payment.Id,
        });

        // upgrade role
        if (user.Role == "public_user") user.Role = "subscriber";

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = user.Id,
            Action = "subscribe",
            Resource = "payment",
            Changes = $"{plan.Name} {plan.Price} {plan.Currency}",
        });
        await _db.SaveChangesAsync();
        return payment;
    }
}
