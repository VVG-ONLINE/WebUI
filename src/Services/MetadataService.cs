using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.JSInterop;
using VVG.Web.Models;

namespace VVG.Web.Services
{
    public class MetadataService
    {
        private readonly HttpClient _http;
        private readonly IJSRuntime _jsRuntime;
        private Metadata? _metadata;
        private TwitterCard? _twitterCard;
        private OpenGraph? _openGraph;
        private string? _jsonLd;

        public PageMetadata PageMetadata { get; private set; } = new PageMetadata();
        public event Action? OnMetadataChanged;

        public MetadataService(HttpClient http, IJSRuntime jsRuntime)
        {
            _http = http;
            _jsRuntime = jsRuntime;
        }

        /// <summary>
        /// Sets page metadata and updates DOM meta tags via JavaScript
        /// </summary>
        public async Task SetPageMetadata(PageMetadata newMetadata)
        {
            PageMetadata = newMetadata;
            OnMetadataChanged?.Invoke();

            try
            {
                // Update DOM meta tags using JavaScript
                await _jsRuntime.InvokeVoidAsync("setPageMetadata", newMetadata);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MetadataService: Failed to update DOM metadata - {ex.Message}");
            }
        }

        /// <summary>
        /// Gets default metadata from configuration file
        /// </summary>
        public async Task<Metadata?> GetMetadataAsync()
        {
            if (_metadata == null)
            {
                try
                {
                    _metadata = await _http.GetFromJsonAsync<Metadata>("assets/data/metadata.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load metadata.json - {ex.Message}");
                }
            }
            return _metadata;
        }

        /// <summary>
        /// Gets Twitter Card configuration
        /// </summary>
        public async Task<TwitterCard?> GetTwitterCardAsync()
        {
            if (_twitterCard == null)
            {
                try
                {
                    _twitterCard = await _http.GetFromJsonAsync<TwitterCard>("assets/data/twitter-card.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load twitter-card.json - {ex.Message}");
                }
            }
            return _twitterCard;
        }

        /// <summary>
        /// Gets Open Graph configuration
        /// </summary>
        public async Task<OpenGraph?> GetOpenGraphAsync()
        {
            if (_openGraph == null)
            {
                try
                {
                    _openGraph = await _http.GetFromJsonAsync<OpenGraph>("assets/data/open-graph.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load open-graph.json - {ex.Message}");
                }
            }
            return _openGraph;
        }

        /// <summary>
        /// Gets JSON-LD structured data
        /// </summary>
        public async Task<string?> GetJsonLdAsync()
        {
            if (_jsonLd == null)
            {
                try
                {
                    _jsonLd = await _http.GetStringAsync("assets/data/json-ld.json");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MetadataService: Failed to load json-ld.json - {ex.Message}");
                }
            }
            return _jsonLd;
        }

        /// <summary>
        /// Resets metadata to default values
        /// </summary>
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
