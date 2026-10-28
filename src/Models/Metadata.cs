namespace VVG.Web.Models
{
    /// <summary>
    /// Holds default site-wide SEO metadata. Loaded from metadata.json at
    /// startup and used as fallback values when a specific page doesn't
    /// provide its own title, description, or image.
    /// </summary>
    public class Metadata
    {
        /// <summary>Page title shown in the browser tab.</summary>
        public string? Title { get; set; }

        /// <summary>Meta description shown in search engine results.</summary>
        public string? Description { get; set; }

        /// <summary>Comma-separated SEO keywords.</summary>
        public string? Keywords { get; set; }

        /// <summary>Author name for the <meta name="author"> tag.</summary>
        public string? Author { get; set; }

        /// <summary>Site name for Open Graph (e.g., "VVG ONLINE").</summary>
        public string? SiteName { get; set; }

        /// <summary>
        /// Fallback title used when no page-specific title is set.
        /// Prevents an empty <title> tag in the browser.
        /// </summary>
        public string? DefaultTitle { get; set; }

        /// <summary>Fallback meta description.</summary>
        public string? DefaultDescription { get; set; }

        /// <summary>Fallback image URL for social sharing previews.</summary>
        public string? DefaultImage { get; set; }

        /// <summary>Per-page metadata overrides.</summary>
        public Dictionary<string, PageMetaEntry>? Pages { get; set; }
    }
}
