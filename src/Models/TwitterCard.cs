namespace VVG.Web.Models
{
    /// <summary>
    /// Default Twitter Card configuration loaded from twitter-card.json.
    /// Twitter Cards control how the page appears when shared on Twitter/X
    /// — large image preview vs. small inline thumbnail.
    /// </summary>
    public class TwitterCard
    {
        /// <summary>
        /// Card display type. "summary_large_image" gives a big preview image,
        /// "summary" shows a small square thumbnail next to the text.
        /// </summary>
        public string? Card { get; set; }

        /// <summary>Twitter @username of the website.</summary>
        public string? Site { get; set; }

        /// <summary>Twitter @username of the content author/creator.</summary>
        public string? Creator { get; set; }

        /// <summary>Title shown in the card.</summary>
        public string? Title { get; set; }

        /// <summary>Description shown below the title in the card.</summary>
        public string? Description { get; set; }

        /// <summary>
        /// Image URL for the card (1200×628 pixels recommended for
        /// summary_large_image; 120×120 for summary).
        /// </summary>
        public string? Image { get; set; }

        /// <summary>Per-page Twitter Card overrides.</summary>
        public Dictionary<string, PageMetaEntry>? Pages { get; set; }
    }
}
