using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using VVG.Web.Models;
using YamlDotNet.Serialization;

public class Program
{
    public static void Main(string[] args)
    {
        var workspaceRoot = GetWorkspaceRoot();
        var blogDir = Path.Combine(workspaceRoot, "src", "wwwroot", "assets", "data", "blogs");
        var outputFile = Path.Combine(workspaceRoot, "src", "wwwroot", "data", "blog-index.json");

        var index = new BlogIndex
        {
            Posts = Array.Empty<BlogPost>(),
            TagsSummary = new Dictionary<string, int>(),
            YearsSummary = new Dictionary<string, int>()
        };
        
        var posts = new List<BlogPost>();

        var deserializer = new DeserializerBuilder().Build();

        foreach (var file in Directory.GetFiles(blogDir, "*.md"))
        {
            var content = File.ReadAllText(file);
            var (frontMatter, markdownContent) = SeparateFrontMatter(content);

            if (frontMatter is null) continue;

            var postData = deserializer.Deserialize<Dictionary<string, object>>(frontMatter);
            
            var wordCount = CountWords(markdownContent);

            var post = new BlogPost
            {
                Title = postData.GetValueOrDefault("title")?.ToString(),
                Slug = postData.GetValueOrDefault("slug")?.ToString(),
                PublishedAt = DateTime.Parse(postData.GetValueOrDefault("publishedAt")?.ToString() ?? DateTime.Now.ToString()),
                Tags = (postData.GetValueOrDefault("tags") as List<object>)?.Select(t => t.ToString() ?? "").ToArray(),
                Excerpt = postData.GetValueOrDefault("excerpt")?.ToString(),
                Draft = bool.Parse(postData.GetValueOrDefault("draft")?.ToString() ?? "false"),
                Category = postData.GetValueOrDefault("category")?.ToString(),
                Featured = bool.Parse(postData.GetValueOrDefault("featured")?.ToString() ?? "false"),
                TimeToRead = (int)Math.Ceiling(wordCount / 200.0)
            };

            if (!post.Draft)
            {
                posts.Add(post);
            }
        }
        
        // Sort posts by date descending
        index.Posts = posts.OrderByDescending(p => p.PublishedAt).ToArray();

        // Generate summaries
        foreach (var post in index.Posts)
        {
            if (post.Tags is not null)
            {
                foreach (var tag in post.Tags)
                {
                    if (!index.TagsSummary.ContainsKey(tag))
                    {
                        index.TagsSummary[tag] = 0;
                    }
                    index.TagsSummary[tag]++;
                }
            }

            var year = post.PublishedAt.Year.ToString();
            if (!index.YearsSummary.ContainsKey(year))
            {
                index.YearsSummary[year] = 0;
            }
            index.YearsSummary[year]++;
        }
        
        // Sort tags by count
        index.TagsSummary = index.TagsSummary.OrderByDescending(kvp => kvp.Value).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        
        var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(index, options);

        File.WriteAllText(outputFile, json);

        Console.WriteLine($"Blog index generated successfully at {outputFile}");
    }

    private static (string? frontMatter, string? markdown) SeparateFrontMatter(string content)
    {
        var match = Regex.Match(content, @"^---\s*\n(.*?)\n---\s*\n(.*)", RegexOptions.Singleline);
        if (!match.Success) return (null, content);
        
        return (match.Groups[1].Value, match.Groups[2].Value);
    }
    
    private static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return Regex.Matches(text, @"[\w-]+").Count;
    }

    private static string GetWorkspaceRoot()
    {
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (currentDir != null && !currentDir.GetFiles("*.sln").Any())
        {
            currentDir = currentDir.Parent;
        }
        return currentDir?.FullName ?? throw new Exception("Could not find workspace root.");
    }
}

public static class DictionaryExtensions
{
    public static TValue? GetValueOrDefault<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key)
    {
        return dict.TryGetValue(key, out var value) ? value : default;
    }
}
