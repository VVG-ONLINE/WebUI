namespace VVG.Web.Models
{
    /// <summary>
    /// All SEO and social-media metadata for a single page.
    /// Includes standard meta tags, Open Graph (Facebook/LinkedIn),
    /// Twitter Cards, and article-specific markup for blog posts.
    /// 
    /// The MetadataService merges this with site-wide defaults from Metadata.
    /// </summary>
    public class PageMetadata
    {
        // ── Standard SEO ──

        /// <summary>Browser tab title.</summary>
        public string? Title { get; set; }

        /// <summary>Meta description for search results.</summary>
        public string? Description { get; set; }

        /// <summary>Comma-separated keywords for search engines.</summary>
        public string? Keywords { get; set; }

        /// <summary>Content author name.</summary>
        public string? Author { get; set; }

        /// <summary>URL of the representative image for the page.</summary>
        public string? Image { get; set; }

        /// <summary>JSON-LD structured data (schema.org) for rich results.</summary>
        public string? JsonLd { get; set; }

        // ── Open Graph (used by Facebook, LinkedIn, Discord, etc.) ──

        public string? OgTitle { get; set; }
        public string? OgDescription { get; set; }

        /// <summary>
        /// Content type. Common values: "website", "article", "profile".
        /// Defaults to "website" for most pages.
        /// </summary>
        public string? OgType { get; set; } = "website";

        /// <summary>Canonical URL of the page.</summary>
        public string? OgUrl { get; set; }

        /// <summary>Image URL for the link preview card.</summary>
        public string? OgImage { get; set; }

        /// <summary>Site/brand name (e.g., "VVG ONLINE").</summary>
        public string? OgSiteName { get; set; }

        // ── Twitter Card (used by Twitter/X for link previews) ──

        /// <summary>
        /// Card type. "summary_large_image" shows a big preview image;
        /// "summary" shows a small inline thumbnail.
        /// </summary>
        public string? TwitterCard { get; set; } = "summary_large_image";

        public string? TwitterTitle { get; set; }
        public string? TwitterDescription { get; set; }
        public string? TwitterImage { get; set; }

        /// <summary>@username of the website's Twitter account.</summary>
        public string? TwitterSite { get; set; }

        /// <summary>@username of the content author.</summary>
        public string? TwitterCreator { get; set; }

        // ── Article-specific (schema.org Article markup) ──

        /// <summary>ISO 8601 date when the article was first published.</summary>
        public string? ArticlePublishedTime { get; set; }

        /// <summary>ISO 8601 date when the article was last modified.</summary>
        public string? ArticleModifiedTime { get; set; }

        /// <summary>Author name for the article schema.</summary>
        public string? ArticleAuthor { get; set; }

        /// <summary>Section/category the article belongs to.</summary>
        public string? ArticleSection { get; set; }

        /// <summary>Tags associated with the article.</summary>
        public string[]? ArticleTags { get; set; }
    }
}
