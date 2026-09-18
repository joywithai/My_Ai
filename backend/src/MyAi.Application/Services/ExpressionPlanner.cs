using System.Text.Json;
using MyAi.Application.DTOs;

namespace MyAi.Application.Services;

/// <summary>
/// Splits an AI reply into expression segments the avatar performs while speaking.
/// Kept deliberately simple: sentence split + keyword/punctuation heuristics.
/// </summary>
public static class ExpressionPlanner
{
    public static List<ExpressionSegment> BuildSegments(string text, string lang)
    {
        var sentences = text
            .Replace("।", "।|").Replace("!", " !|").Replace("?", " ?|")
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => s.Length > 0)
            .ToList();
        if (sentences.Count == 0) sentences.Add(text);

        // cap at 3 segments like the demo
        if (sentences.Count > 3)
        {
            sentences = new List<string> {
                string.Join(" ", sentences.Take(2)),
                string.Join(" ", sentences.Skip(2).Take(Math.Max(1, sentences.Count - 3))),
                string.Join(" ", sentences.Skip(Math.Max(3, sentences.Count - 1))),
            }.Where(s => s.Trim().Length > 0).ToList();
        }

        return sentences.Select(s => new ExpressionSegment
        {
            Expression = Pick(s, lang),
            Text = s.Trim(),
        }).ToList();
    }

    private static string Pick(string sentence, string lang)
    {
        var lower = sentence.ToLowerInvariant();
        bool bn = lang == "bn";

        if (sentence.Contains('!')) return "excited";
        if (sentence.Contains('?')) return "surprised";

        string[] happyWords = bn
            ? ["ভালো", "খুশি", "দারুণ", "অবশ্যই", "হ্যাঁ", "প্রেম", "পছন্দ"]
            : ["great", "happy", "sure", "yes", "love", "nice", "welcome"];
        string[] sadWords = bn
            ? ["দুঃখ", "কষ্ট", "মন খারাপ", "দুঃখিত", "ব্যথা"]
            : ["sad", "sorry", "bad", "hurt"];
        string[] thinkWords = bn
            ? ["ভাব", "মনে হয়", "হয়তো", "কেন"]
            : ["think", "maybe", "perhaps", "why", "consider"];

        if (sadWords.Any(lower.Contains)) return "sad";
        if (happyWords.Any(lower.Contains)) return "happy";
        if (thinkWords.Any(lower.Contains)) return "thoughtful";
        return "neutral";
    }
}
