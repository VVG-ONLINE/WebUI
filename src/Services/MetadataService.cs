using System.Net.Http;
using System.Net.Http.Json;
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
