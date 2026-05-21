using System.Text.Json.Serialization;

namespace VVG.Web.Models;

public class BlogPost
{
    public string? Title { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public DateTime PublishedAt { get; set; }
    public string[]? Tags { get; set; }
    public string? Excerpt { get; set; }
    public bool Draft { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Category? Category { get; set; }  // Make it nullable Category?

    public bool Featured { get; set; }
    public int TimeToRead { get; set; }
}
