using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.JSInterop;
using VVG.Web.Models;

namespace VVG.Web.Services
{
    // ==========================================================================
    // MetadataService — manages all SEO-related data for the website
    //
    // Loads metadata from static JSON files (metadata.json, open-graph.json,
    // twitter-card.json, json-ld.json) and caches them after first load.
    // When a page changes, it pushes updated meta tags to the browser DOM
    // via JavaScript interop (calls setPageMetadata in meta.js).
    // ==========================================================================
    public class MetadataService
    {
        private readonly HttpClient _http;
        private readonly IJSRuntime _jsRuntime;

        // Cached data — each is loaded only once from its JSON file
        private Metadata? _metadata;
        private TwitterCard? _twitterCard;
        private OpenGraph? _openGraph;
        private string? _jsonLd;

        // Holds the CURRENT page's metadata (changes on every navigation)
        public PageMetadata PageMetadata { get; private set; } = new PageMetadata();

        // Fired when SetPageMetadata is called — MetaTags.razor subscribes to this
        public event Action? OnMetadataChanged;

        public MetadataService(HttpClient http, IJSRuntime jsRuntime)
        {
            _http = http;
            _jsRuntime = jsRuntime;
        }

        // Called by pages when they want to update the <title>, <meta>, OG, Twitter tags
        public async Task SetPageMetadata(PageMetadata newMetadata)
        {
            PageMetadata = newMetadata;
            OnMetadataChanged?.Invoke(); // Notify MetaTags.razor to re-render

            try
            {
                // Push metadata to the browser's <head> via JavaScript
                await _jsRuntime.InvokeVoidAsync("setPageMetadata", newMetadata);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MetadataService: Failed to update DOM metadata - {ex.Message}");
            }
        }

        // Loads default site metadata (title, description, keywords, author)
        // Only fetches from the network the first time — caches result
        public async Task<Metadata?> GetMetadataAsync()
        {
            if (_metadata == null)
            {
                try
                {
                    _metadata = await _http.GetFromJsonAsync<Metadata>("assets/data/json/metadata.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load metadata.json - {ex.Message}");
                }
            }
            return _metadata;
        }

        // Loads Twitter Card defaults (card type, site handle, creator, image)
        public async Task<TwitterCard?> GetTwitterCardAsync()
        {
            if (_twitterCard == null)
            {
                try
                {
                    _twitterCard = await _http.GetFromJsonAsync<TwitterCard>("assets/data/json/twitter-card.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load twitter-card.json - {ex.Message}");
                }
            }
            return _twitterCard;
        }

        // Loads Open Graph defaults (og:type, og:title, og:image, og:url)
        public async Task<OpenGraph?> GetOpenGraphAsync()
        {
            if (_openGraph == null)
            {
                try
                {
                    _openGraph = await _http.GetFromJsonAsync<OpenGraph>("assets/data/json/open-graph.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load open-graph.json - {ex.Message}");
                }
            }
            return _openGraph;
        }

        // Loads JSON-LD structured data (schema.org — helps search engines)
        // Returns raw string because JSON-LD is injected as-is into a <script> tag
        public async Task<string?> GetJsonLdAsync()
        {
            if (_jsonLd == null)
            {
                try
                {
                    _jsonLd = await _http.GetStringAsync("assets/data/json/json-ld.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load json-ld.json - {ex.Message}");
                }
            }
            return _jsonLd;
        }

        // Builds a PageMetadata object for a given page key by merging
        // per-page entries from all JSON files with site-wide defaults.
        public async Task<PageMetadata> GetPageMetadataAsync(string pageKey)
        {
            var defaultMeta = await GetMetadataAsync();
            var defaultOG = await GetOpenGraphAsync();
            var defaultTC = await GetTwitterCardAsync();

            var pageMeta = defaultMeta?.Pages?.GetValueOrDefault(pageKey);
            var pageOG = defaultOG?.Pages?.GetValueOrDefault(pageKey);
            var pageTC = defaultTC?.Pages?.GetValueOrDefault(pageKey);

            var defaultImage = pageOG?.Image ?? pageTC?.Image
                ?? defaultOG?.Image ?? defaultTC?.Image;

            return new PageMetadata
            {
                Title = pageMeta?.Title ?? defaultMeta?.DefaultTitle,
                Description = pageMeta?.Description ?? defaultMeta?.DefaultDescription,
                Keywords = pageMeta?.Keywords ?? defaultMeta?.Keywords,
                Image = defaultImage,

                OgType = pageOG?.OgType ?? defaultOG?.Type ?? "website",
                OgTitle = pageOG?.OgTitle ?? pageOG?.Title ?? pageMeta?.Title ?? defaultOG?.Title,
                OgDescription = pageOG?.OgDescription ?? pageOG?.Description ?? pageMeta?.Description ?? defaultOG?.Description,
                OgImage = pageOG?.Image ?? pageTC?.Image ?? defaultOG?.Image ?? defaultTC?.Image,
                OgUrl = pageOG?.Url ?? defaultOG?.Url,
                OgSiteName = pageOG?.OgSiteName ?? defaultOG?.SiteName ?? "VVG ONLINE",

                TwitterCard = pageTC?.TwitterCard ?? defaultTC?.Card ?? "summary_large_image",
                TwitterSite = pageTC?.TwitterSite ?? defaultTC?.Site ?? "@vvgonline",
                TwitterCreator = pageTC?.TwitterCreator ?? defaultTC?.Creator ?? "@vvgonline",
                TwitterTitle = pageTC?.TwitterTitle ?? pageTC?.Title ?? pageOG?.Title ?? pageMeta?.Title ?? defaultTC?.Title,
                TwitterDescription = pageTC?.TwitterDescription ?? pageTC?.Description ?? pageOG?.Description ?? pageMeta?.Description ?? defaultTC?.Description,
                TwitterImage = pageTC?.Image ?? pageOG?.Image ?? defaultTC?.Image
            };
        }

        // Extracts page-specific JSON-LD structured data from the "pages" section
        // of json-ld.json. Returns null if no entry exists for the page key.
        public async Task<string?> GetPageJsonLdAsync(string pageKey)
        {
            var raw = await GetJsonLdAsync();
            if (string.IsNullOrEmpty(raw)) return null;

            try
            {
                using var doc = JsonDocument.Parse(raw);
                if (!doc.RootElement.TryGetProperty("pages", out var pages)) return null;
                if (!pages.TryGetProperty(pageKey, out var entry)) return null;
                return entry.GetRawText();
            }
            catch
            {
                return null;
            }
        }

        // Resets page metadata back to the default site-wide values
        // Useful when navigating from a blog post to the home page
        public async Task ResetToDefaultMetadata()
        {
            var defaultMetadata = await GetMetadataAsync();
            if (defaultMetadata != null)
            {
                await SetPageMetadata(new PageMetadata
                {
                    Title = defaultMetadata.Title,
                    Description = defaultMetadata.Description,
                    Keywords = defaultMetadata.Keywords
                });
            }
        }
    }
}
