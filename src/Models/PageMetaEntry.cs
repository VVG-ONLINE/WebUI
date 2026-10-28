namespace VVG.Web.Models
{
    public class PageMetaEntry
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Keywords { get; set; }
        public string? Image { get; set; }
        public string? Url { get; set; }

        public string? OgType { get; set; }
        public string? OgTitle { get; set; }
        public string? OgDescription { get; set; }
        public string? OgUrl { get; set; }
        public string? OgImage { get; set; }
        public string? OgSiteName { get; set; }

        public string? TwitterCard { get; set; }
        public string? TwitterTitle { get; set; }
        public string? TwitterDescription { get; set; }
        public string? TwitterImage { get; set; }
        public string? TwitterSite { get; set; }
        public string? TwitterCreator { get; set; }
    }
}
