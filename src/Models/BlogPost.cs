using System.Text.Json.Serialization;

namespace VVG.Web.Models;

/// <summary>
/// Represents a single blog article. Each field maps to a YAML frontmatter
/// property from the Markdown source files. These objects are serialised
/// into blog-index.json by the Indexer tool and loaded at runtime.
/// </summary>
public class BlogPost
{
    /// <summary>Title shown in listings and on the post page.</summary>
    public string? Title { get; set; }

    /// <summary>File name with extension (e.g., "my-post.md").</summary>
    public string Filename { get; set; } = string.Empty;

    /// <summary>URL-friendly version of the title (e.g., "my-post").</summary>
    public string? Slug { get; set; }

    /// <summary>Publication date (used for sorting and display).</summary>
    public DateTime PublishedAt { get; set; }

    /// <summary>List of topic tags for filtering (e.g., ["AI", "Business"]).</summary>
    public string[]? Tags { get; set; }

    /// <summary>Short preview text shown in listing cards.</summary>
    public string? Excerpt { get; set; }

    /// <summary>If true, the post is hidden from public views.</summary>
    public bool Draft { get; set; }

    /// <summary>
    /// Category enum (Article, Business, Technology, etc.).
    /// The JsonStringEnumConverter tells the JSON serializer to use the enum
    /// name string (e.g., "Business") instead of the numeric value (e.g., 1).
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Category? Category { get; set; }

    /// <summary>If true, the post appears in the featured section.</summary>
    public bool Featured { get; set; }

    /// <summary>Estimated reading time in minutes, calculated from word count.</summary>
    public int TimeToRead { get; set; }
}
