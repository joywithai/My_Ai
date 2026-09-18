namespace MyAi.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = "New chat";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public List<Message> Messages { get; set; } = new();
}

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "user";            // user | assistant
    public string Content { get; set; } = "";
    public string Lang { get; set; } = "bn";
    public string Segments { get; set; } = "[]";          // JSON: [{expression, text}]
    public string? AudioUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Conversation? Conversation { get; set; }
}

public class Expression
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Label { get; set; } = "";
    public string MinRole { get; set; } = "public_user";  // public_user | subscriber
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Animation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Label { get; set; } = "";
    public string MinRole { get; set; } = "public_user";
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AvatarModel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Gender { get; set; } = "female";        // female | male
    public string FileUrl { get; set; } = "";
    public string MinRole { get; set; } = "public_user";
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
