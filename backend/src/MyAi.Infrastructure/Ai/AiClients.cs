using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using MyAi.Application.Interfaces;

namespace MyAi.Infrastructure.Ai;

/// <summary>Routes to OpenRouter or Gemini; falls back to a demo reply when no key is configured.</summary>
public class AiProvider : IAiProvider
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public AiProvider(IHttpClientFactory http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> CompleteAsync(AiRequest request, CancellationToken ct = default)
    {
        var apiKey = request.ApiKey
            ?? _config["AI:ApiKey"]
            ?? throw new InvalidOperationException("no_api_key"); // ChatService degrades gracefully

        return request.Provider switch
        {
            "openrouter" => await OpenRouterAsync(request, apiKey, ct),
            _ => await GeminiAsync(request, apiKey, ct),
        };
    }

    private static async Task<string> OpenRouterAsync(AiRequest r, string key, CancellationToken ct)
    {
        using var http = new HttpClient();
        http.BaseAddress = new Uri(string.IsNullOrEmpty(r.BaseUrl) ? "https://openrouter.ai/api/v1/" : r.BaseUrl);
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", key);
        var body = new
        {
            model = r.Model,
            temperature = r.Temperature,
            max_tokens = r.MaxOutputTokens,
            messages = new object[]
            {
                new { role = "system", content = r.SystemPrompt },
                new { role = "user", content = r.UserText },
            },
        };
        var resp = await http.PostAsJsonAsync("chat/completions", body, ct);
        resp.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }

    private static async Task<string> GeminiAsync(AiRequest r, string key, CancellationToken ct)
    {
        using var http = new HttpClient();
        var baseUrl = string.IsNullOrEmpty(r.BaseUrl) ? "https://generativelanguage.googleapis.com/v1beta/" : r.BaseUrl;
        var url = $"{baseUrl}models/{r.Model}:generateContent?key={key}";
        var body = new
        {
            system_instruction = new { parts = new[] { new { text = r.SystemPrompt } } },
            contents = new[] { new { parts = new[] { new { text = r.UserText } } } },
            generationConfig = new { temperature = r.Temperature, maxOutputTokens = r.MaxOutputTokens },
        };
        var resp = await http.PostAsJsonAsync(url, body, ct);
        resp.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "";
    }
}
