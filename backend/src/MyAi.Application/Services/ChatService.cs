using System.Text.Json;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Domain.Entities;

namespace MyAi.Application.Services;

public class ChatService
{
    private readonly IAppDbContext _db;
    private readonly IAiProvider _ai;
    private readonly IEncryptionService _encryption;
    private readonly ICache _cache;

    public ChatService(IAppDbContext db, IAiProvider ai, IEncryptionService encryption, ICache cache)
    {
        _db = db;
        _ai = ai;
        _encryption = encryption;
        _cache = cache;
    }

    private RoleFeatureFlag CacheAndReturn(RoleFeatureFlag flags, string role)
    {
        _cache.Set($"flags:{role}", flags, TimeSpan.FromSeconds(60));
        return flags;
    }

    public async Task<ChatResponse> SendAsync(User user, ChatRequest request, CancellationToken ct = default)
    {
        var text = (request.Message ?? "").Trim();
        if (text.Length == 0) throw new AppException(400, "empty");
        text = text.Length > 500 ? text[..500] : text;
        var lang = request.Lang == "en" ? "en" : "bn";

        var flags = _cache.GetOrNothing<RoleFeatureFlag>($"flags:{user.Role}")
            ?? CacheAndReturn(_db.RoleFeatureFlags.First(f => f.Role == user.Role), user.Role);

        // daily rate limit (server enforced)
        var todayUtc = DateTime.UtcNow.Date;
        var count = await Task.Run(() => _db.Messages.Count(m =>
            m.UserId == user.Id && m.Role == "user" && m.CreatedAt >= todayUtc), ct);
        if (flags.MaxMessagesPerDay >= 0 && count >= flags.MaxMessagesPerDay)
            throw new AppException(429, "limit_reached");
        count++;

        // conversation (new or existing)
        Conversation? conv = null;
        if (request.ConversationId.HasValue)
            conv = _db.Conversations.FirstOrDefault(c => c.Id == request.ConversationId.Value && c.UserId == user.Id);
        if (conv == null)
        {
            conv = new Conversation { UserId = user.Id, Title = text.Length > 40 ? text[..40] : text };
            _db.Conversations.Add(conv);
        }
        conv.UpdatedAt = DateTime.UtcNow;

        _db.Messages.Add(new Message
        {
            ConversationId = conv.Id,
            UserId = user.Id,
            Role = "user",
            Content = text,
            Lang = lang,
        });

        // AI completion — user's own key when configured, else system default
        var custom = _db.CustomAiKeys.FirstOrDefault(k => k.UserId == user.Id && k.IsValid);
        var sys = _db.SystemSettings.First();
        string reply;
        try
        {
            reply = await _ai.CompleteAsync(new AiRequest
            {
                Provider = custom?.Provider ?? "gemini",
                ApiKey = custom == null ? null : _encryption.Decrypt(custom.KeyEncrypted),
                Model = custom?.AiModel ?? sys.AiModel,
                BaseUrl = custom?.BaseUrl ?? "",
                Temperature = (double)(custom?.Temperature ?? 0.7m),
                MaxOutputTokens = custom?.MaxOutputTokens ?? 2048,
                SystemPrompt = SystemPrompt(lang),
                UserText = text,
            }, ct);
        }
        catch (Exception)
        {
            // graceful degradation (README 3.3): AI down → friendly fallback, no crash
            reply = lang == "bn"
                ? "এখন আমার মাথায় একটু ঝামেলা চলছে, একটু পরে আবার জিজ্ঞেস করো।"
                : "My head is a little busy right now, please ask me again in a moment.";
        }

        var segments = ExpressionPlanner.BuildSegments(reply, lang);
        var full = string.Join(" ", segments.Select(s => s.Text));

        _db.Messages.Add(new Message
        {
            ConversationId = conv.Id,
            UserId = user.Id,
            Role = "assistant",
            Content = full,
            Lang = lang,
            Segments = JsonSerializer.Serialize(segments),
        });

        // history limit per role (README 2.1: public keeps last 10)
        if (flags.MaxConversationHistory >= 0)
            await TrimHistoryAsync(user.Id, flags.MaxConversationHistory);

        await _db.SaveChangesAsync(ct);

        return new ChatResponse
        {
            ConversationId = conv.Id,
            Segments = segments,
            Usage = new UsageInfo { Count = count, Limit = flags.MaxMessagesPerDay },
        };
    }

    private async Task TrimHistoryAsync(Guid userId, int max)
    {
        var mine = _db.Conversations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToList();
        var drop = mine.Skip(max).Select(c => c.Id).ToList();
        if (drop.Count == 0) return;
        var msgs = _db.Messages.Where(m => drop.Contains(m.ConversationId)).ToList();
        foreach (var m in msgs) _db.Messages.Remove(m);
        foreach (var c in _db.Conversations.Where(c => drop.Contains(c.Id)).ToList())
            _db.Conversations.Remove(c);
        await Task.CompletedTask;
    }

    private static string SystemPrompt(string lang)
    {
        return lang == "bn"
            ? "তুমি MyAi — একজন বন্ধুত্বপূর্ণ 3D এআই সঙ্গী। সংক্ষিপ্ত, উষ্ণ উত্তর দাও (সর্বোচ্চ ২-৩ বাক্য), বাংলায়।"
            : "You are MyAi — a friendly 3D AI companion. Reply short and warm (2-3 sentences max), in English.";
    }
}
