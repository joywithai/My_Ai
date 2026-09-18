using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public class ChatController : ControllerBase
{
    private readonly ChatService _chat;
    private readonly IAppDbContext _db;
    private readonly ITtsService _tts;

    public ChatController(ChatService chat, IAppDbContext db, ITtsService tts)
    {
        _chat = chat;
        _db = db;
        _tts = tts;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<ChatResponse>> Ask(ChatRequest req)
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        if (user.Status == "banned") return StatusCode(403, new { error = "banned" });
        return await _chat.SendAsync(user, req);
    }

    /// <summary>Neural TTS audio + word boundaries for 100% synced lip-sync.</summary>
    [HttpPost("tts")]
    public async Task<IActionResult> Tts(TtsRequest req)
    {
        var result = await _tts.SynthesizeAsync(req.Text, req.Lang, req.Voice ?? "", req.Rate, req.Pitch);
        return Ok(new
        {
            audioBase64 = Convert.ToBase64String(result.Audio),
            contentType = result.ContentType,
            boundaries = result.Boundaries,
        });
    }
}
