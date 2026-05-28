namespace VVG.Web.Models
{
    /// <summary>
    /// Default Open Graph configuration loaded from open-graph.json.
    /// Open Graph tags control how the page appears when shared on
    /// Facebook, LinkedIn, Discord, and other platforms.
    /// </summary>
    public class OpenGraph
    {
        /// <summary>Title of the shared link card.</summary>
        public string? Title { get; set; }

        /// <summary>
        /// Content type. Common values:
        /// "website" for regular pages, "article" for blog posts.
        /// </summary>
        public string? Type { get; set; }

        /// <summary>Canonical URL of the page being shared.</summary>
        public string? Url { get; set; }

        /// <summary>Thumbnail image URL (1200×630 pixels recommended).</summary>
        public string? Image { get; set; }

        /// <summary>Short description shown below the title.</summary>
        public string? Description { get; set; }

        /// <summary>Site name (e.g., "VVG ONLINE").</summary>
        public string? SiteName { get; set; }
    }
}
