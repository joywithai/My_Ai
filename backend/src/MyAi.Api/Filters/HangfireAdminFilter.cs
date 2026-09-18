using Hangfire.Dashboard;

namespace MyAi.Api.Filters;

/// <summary>Hangfire dashboard is admin-only.</summary>
public class HangfireAdminFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var http = context.GetHttpContext();
        return http.User.Identity?.IsAuthenticated == true
            && http.User.IsInRole("admin");
    }
}
