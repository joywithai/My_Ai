using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;

namespace MyAi.Api.Controllers;

[ApiController]
[Route("api")]
public class CatalogController : ControllerBase
{
    private readonly IAppDbContext _db;

    public CatalogController(IAppDbContext db) => _db = db;

    [HttpGet("avatars")]
    [Authorize]
    public IActionResult Avatars()
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        var rank = new Dictionary<string, int> { ["public_user"] = 0, ["subscriber"] = 1, ["admin"] = 2 };
        var models = _db.AvatarModels
            .Where(a => a.IsActive && rank[user.Role] >= rank[a.MinRole])
            .Select(a => new { id = a.Id, name = a.Name, gender = a.Gender, file = a.FileUrl, isDefault = a.IsDefault })
            .ToList();
        return Ok(new { models });
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public IActionResult Plans() =>
        Ok(new
        {
            plans = _db.SubscriptionPlans
                .Where(p => p.IsActive)
                .OrderBy(p => p.Price)
                .Select(PlanMapper.ToDto),
        });