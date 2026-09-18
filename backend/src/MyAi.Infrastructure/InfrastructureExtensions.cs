using Microsoft.Extensions.DependencyInjection;
using MyAi.Application.Interfaces;
using MyAi.Infrastructure.Ai;
using MyAi.Infrastructure.Auth;
using MyAi.Infrastructure.Caching;
using MyAi.Infrastructure.Security;
using MyAi.Infrastructure.Tts;

namespace MyAi.Infrastructure;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtService, JwtTokenService>();
        services.AddScoped<IEncryptionService, AesEncryptionService>();
        services.AddScoped<IAiProvider, AiProvider>();
        services.AddScoped<ITtsService, EdgeTtsService>();
        services.AddScoped<ICache, RedisCacheService>();
        return services;
    }
}
