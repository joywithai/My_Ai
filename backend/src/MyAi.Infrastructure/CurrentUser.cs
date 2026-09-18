using System.Security.Claims;
using Microsoft.Extensions.DependencyInjection;
using MyAi.Application.Interfaces;

namespace MyAi.Infrastructure;

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var v = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(v, out var g) ? g : null;
        }
    }

    public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);
}
