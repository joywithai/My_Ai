using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.Interfaces;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/conversations")]
public class ConversationsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public ConversationsController(IAppDbContext db) => _db = db;

    [HttpGet]
    public IActionResult List()
    {
        var userId = User.UserId();
        var role = User.FindFirstValue(System.Security.Claims.ClaimTypes.Role) ?? "public_user";
        var flags = _db.RoleFeatureFlags.First(f => f.Role == role);
        var convs = _db.Conversations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToList();
        if (flags.MaxConversationHistory >= 0) convs = convs.Take(flags.MaxConversationHistory).ToList();
        return Ok(new
        {
            conversations = convs.Select(c => new
            {
                id = c.Id,
                title = c.Title,
                updatedAt = c.UpdatedAt,
                messageCount = _db.Messages.Count(m => m.ConversationId == c.Id),
            }),
        });
    }

    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id)
    {
        var userId = User.UserId();
        var conv = _db.Conversations.FirstOrDefault(c => c.Id == id && c.UserId == userId);
        if (conv == null) return NotFound(new { error = "not_found" });
        var messages = _db.Messages
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.Role, m.Content, m.Lang, m.Segments, m.CreatedAt })
            .ToList();
        return Ok(new
        {
            conversation = new { id = conv.Id, title = conv.Title, updatedAt = conv.UpdatedAt },
            messages = messages.Select(m => new
            {
                role = m.Role,
                content = m.Content,
                lang = m.Lang,
                // stored as JSON string in the DB → ship as a real array to the UI
                segments = ParseSegments(m.Segments),
                createdAt = m.CreatedAt,
            }),
        });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        var userId = User.UserId();
        var conv = _db.Conversations.FirstOrDefault(c => c.Id == id && c.UserId == userId);
        if (conv == null) return NotFound(new { error = "not_found" });
        var msgs = _db.Messages.Where(m => m.ConversationId == id).ToList();
        foreach (var m in msgs) _db.Messages.Remove(m);
        _db.Conversations.Remove(conv);
        _db.SaveChanges();
        return Ok(new { ok = true });
    }

    private static List<MyAi.Application.DTOs.ExpressionSegment> ParseSegments(string json)
    {
        try { return JsonSerializer.Deserialize<List<MyAi.Application.DTOs.ExpressionSegment>>(json) ?? new(); }
        catch { return new(); }
    }
}
