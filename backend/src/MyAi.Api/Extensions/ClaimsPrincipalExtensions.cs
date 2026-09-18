using System.Security.Claims;

namespace MyAi.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid UserId(this ClaimsPrincipal user)
    {
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(v, out var g) ? g : throw new UnauthorizedAccessException();
    }
}
