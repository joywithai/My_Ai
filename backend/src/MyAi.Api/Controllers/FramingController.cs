using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.Interfaces;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api/framing")]
public class FramingController : ControllerBase
{
    private readonly IAppDbContext _db;

    public FramingController(IAppDbContext db) => _db = db;

    /// <summary>Public: the avatar framing everyone should see (locked = admin enforced).</summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var framing = JsonDocument.Parse(_db.SystemSettings.First().Framing).RootElement.Clone();
        return Ok(new { framing });
    }
}
