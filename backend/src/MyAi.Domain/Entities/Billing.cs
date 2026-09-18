namespace MyAi.Domain.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "BDT";
    public string BillingPeriod { get; set; } = "monthly"; // monthly | yearly
    public string Description { get; set; } = "";
    public string Features { get; set; } = "[]";           // JSON array of strings
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<UserSubscription> Subscriptions { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class UserSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public string Status { get; set; } = "active";         // active | cancelled | expired
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool AutoRenew { get; set; } = true;
    public Guid? PaymentId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public SubscriptionPlan? Plan { get; set; }
}

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "BDT";
    public string Status { get; set; } = "pending";        // pending | succeeded | failed
    public string Provider { get; set; } = "demo";         // demo | stripe | sslcommerz
    public string ReferenceId { get; set; } = "";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public SubscriptionPlan? Plan { get; set; }
}
