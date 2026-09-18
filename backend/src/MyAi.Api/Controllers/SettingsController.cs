using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly SettingsService _settings;
    private readonly IAppDbContext _db;

    public SettingsController(SettingsService settings, IAppDbContext db)
    {
        _settings = settings;
        _db = db;
    }

    [HttpGet]
    public IActionResult Get()
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        var s = _db.UserSettings.First(x => x.UserId == user.Id);
        var key = _db.CustomAiKeys.FirstOrDefault(k => k.UserId == user.Id);
        return Ok(new
        {
            settings = UserMapper.ToDto(s),
            customAi = key == null ? null : new
            {
                provider = key.Provider,
                maskedKey = key.MaskedKey,
                model = key.AiModel,
                baseUrl = key.BaseUrl,
                temperature = key.Temperature,
                maxOutputTokens = key.MaxOutputTokens,
                isValid = key.IsValid,
            },
        });
    }

    [HttpPut]
    public async Task<IActionResult> Put(SettingsPatch patch)
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        await _settings.ApplyAsync(user, patch);
        return Get();
    }
}
