using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using MyAi.Application.Interfaces;

namespace MyAi.Infrastructure.Tts;

/// <summary>
/// Microsoft Edge neural TTS (same voices the README specifies: bn-BD-NabanitaNeural, …).
/// Streams audio bytes AND word boundaries — the boundaries drive the avatar's
/// visemes so lip-sync matches the voice 100%.
/// </summary>
public class EdgeTtsService : ITtsService
{
    private const string TrustedClientToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private const string WssUrl = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

    private readonly IConfiguration _config;
    public EdgeTtsService(IConfiguration config) => _config = config;

    public async Task<TtsResult> SynthesizeAsync(string text, string lang, string voice, double rate, double pitch, CancellationToken ct = default)
    {
        voice = string.IsNullOrEmpty(voice) ? DefaultVoice(lang) : voice;
        var pitchHz = (int)(pitch * 2.0); // -50..50 → -100..+100 Hz
        var ratePct = (int)Math.Round((rate - 1.0) * 100);

        var ws = new ClientWebSocket();
        ws.Options.SetRequestHeader("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold");
        ws.Options.SetRequestHeader("Sec-MS-GEC", SecMsGec());
        ws.Options.SetRequestHeader("Sec-MS-GEC-Version", "1-130.0.2849.68");
        await ws.ConnectAsync(new Uri($"{WssUrl}?TrustedClientToken={TrustedClientToken}"), ct);

        var requestId = Guid.NewGuid().ToString("N").Replace("-", "");
        var configMessage =
            "X-Timestamp:" + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffK") + "\r\n" +
            "Content-Type:application/json; charset=utf-8\r\n" +
            "Path:speech.config\r\n\r\n" +
            "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"true\"},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}";
        await ws.SendAsync(Encoding.UTF8.GetBytes(configMessage), WebSocketMessageType.Text, true, ct);

        var ssml = $"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang}'><voice name='{voice}'>" +
                   $"<prosody rate='{ratePct:+0;-0}%'>{{0}}</prosody></voice></speak>";
        var speakMessage =
            "X-RequestId:" + requestId + "\r\n" +
            "Content-Type:application/ssml+xml\r\n" +
            "X-Timestamp:" + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffK") + "\r\n" +
            "Path:ssml\r\n\r\n" + string.Format(ssml, EscapeXml(text));
        await ws.SendAsync(Encoding.UTF8.GetBytes(speakMessage), WebSocketMessageType.Text, true, ct);

        var audio = new MemoryStream();
        var boundaries = new List<WordBoundary>();
        var buffer = new byte[64 * 1024];
        while (ws.State == WebSocketState.Open)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
            if (result.MessageType == WebSocketMessageType.Close) break;
            var chunk = Encoding.UTF8.GetString(buffer, 0, result.Count);

            if (chunk.Contains("Path:turn.end")) break;

            if (chunk.Contains("Path:audio"))
            {
                // header is pure ASCII → char index == byte index
                var headerEnd = chunk.IndexOf("Path:audio\r\n", StringComparison.Ordinal);
                var payloadOffset = headerEnd + "Path:audio\r\n".Length;
                if (payloadOffset > 0 && payloadOffset < result.Count)
                    audio.Write(buffer, payloadOffset, result.Count - payloadOffset);
            }
            else if (chunk.Contains("WordBoundary"))
            {
                var match = Regex.Match(chunk, "\"offset\":(\\d+),\"duration\":(\\d+),\"text\":\\{\"WordBoundary\":\"([^\"]+)\",\"Length\":(\\d+)");
                if (match.Success)
                {
                    boundaries.Add(new WordBoundary
                    {
                        // offset is in 100-ns ticks from speech start
                        Offset = long.Parse(match.Groups[1].Value),
                        CharIndex = FindCharIndex(text, boundaries.Count, match.Groups[3].Value),
                        Length = int.Parse(match.Groups[4].Value),
                        Text = match.Groups[3].Value,
                    });
                }
            }
        }
        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", ct);

        return new TtsResult { Audio = audio.ToArray(), ContentType = "audio/mpeg", Boundaries = boundaries };
    }

    /// <summary>Map each word back to its position in the original text (frontend needs charIndex).</summary>
    private static int FindCharIndex(string text, int wordIndex, string word)
    {
        int from = 0;
        for (int i = 0; i <= wordIndex; i++)
        {
            var idx = text.IndexOf(word, from, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return from;
            if (i == wordIndex) return idx;
            from = idx + word.Length;
        }
        return from;
    }

    private static string EscapeXml(string s) => s
        .Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");

    /// <summary>DRM token required by the endpoint (tick-based, 5-minute windows).</summary>
    private static string SecMsGec()
    {
        var ticks = DateTime.UtcNow.Ticks - DateTime.Parse("1601-01-01T00:00:00Z").Ticks;
        var windows = ticks / (TimeSpan.TicksPerSecond * 300) * 300 * TimeSpan.TicksPerSecond;
        var input = windows.ToString(System.Globalization.CultureInfo.InvariantCulture) + TrustedClientToken;
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(input));
        return Convert.ToHexString(hash).ToUpperInvariant();
    }

    public static string DefaultVoice(string lang) => lang switch
    {
        "bn" => "bn-BD-NabanitaNeural",
        _ => "en-US-JennyNeural",
    };
}
