namespace VVG.Web.Models
{
    public class PageMetadata
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Keywords { get; set; }
        public string? Author { get; set; }
        public string? Image { get; set; }  // ADD THIS
        public string? JsonLd { get; set; }  // ADD THIS

        // Open Graph
        public string? OgTitle { get; set; }
        public string? OgDescription { get; set; }
        public string? OgType { get; set; } = "website";
        public string? OgUrl { get; set; }
        public string? OgImage { get; set; }
        public string? OgSiteName { get; set; }

        // Twitter Card
        public string? TwitterCard { get; set; } = "summary_large_image";
        public string? TwitterTitle { get; set; }
        public string? TwitterDescription { get; set; }
        public string? TwitterImage { get; set; }
        public string? TwitterSite { get; set; }
        public string? TwitterCreator { get; set; }

        // Article specific
        public string? ArticlePublishedTime { get; set; }
        public string? ArticleModifiedTime { get; set; }
        public string? ArticleAuthor { get; set; }
        public string? ArticleSection { get; set; }
        public string[]? ArticleTags { get; set; }
    }
}
