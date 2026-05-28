/// <summary>
/// Comprehensive SEO and metadata tests covering 4 layers:
///
///   A. MODEL VALIDATION — JSON files deserialise into correct C# models
///   B. DATA FILE INTEGRITY — metadata/open-graph/twitter-card/JSON-LD files are well-formed
///   C. METADATA SERVICE — GetMetadataAsync, caching, defaults, OnMetadataChanged event
///   D. META TAGS COMPONENT — bUnit render tests + JS interop verification
///
/// Uses mock HTTP handlers to simulate server responses without network access.
/// </summary>
using System.Net;
using System.Text;
using System.Text.Json;
using Bunit;
using Microsoft.Extensions.DependencyInjection;
using VVG.Web.Layout;
using VVG.Web.Models;
using VVG.Web.Services;
using VVG.Web.Shared;

namespace VVG.Web.Tests.SEO
{
    public class SeoMetadataTests : TestContext
    {
        private static readonly string ProjectRoot = GetProjectRoot();
        private static JsonSerializerOptions JsonOptions => new() { PropertyNameCaseInsensitive = true };

        private static string GetProjectRoot()
        {
            var current = AppContext.BaseDirectory;
            while (!Directory.Exists(Path.Combine(current, "src")))
            {
                var parent = Directory.GetParent(current);
                if (parent == null) throw new DirectoryNotFoundException("Could not find project root");
                current = parent.FullName;
            }
            return current;
        }

        private static string ReadJsonDataFile(string filename)
        {
            return File.ReadAllText(Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "data", "json", filename));
        }

        // ========================================================================
        // A. MODEL VALIDATION TESTS
        // ========================================================================

        [Fact]
        public void Metadata_Model_Deserializes_From_Json()
        {
            var json = ReadJsonDataFile("metadata.json");
            var metadata = JsonSerializer.Deserialize<Metadata>(json, JsonOptions);
            Assert.NotNull(metadata);
            Assert.NotNull(metadata.DefaultTitle);
            Assert.NotEmpty(metadata.DefaultTitle);
            Assert.NotNull(metadata.DefaultDescription);
            Assert.NotEmpty(metadata.DefaultDescription);
            Assert.NotNull(metadata.Keywords);
            Assert.NotEmpty(metadata.Keywords);
            Assert.NotNull(metadata.Author);
            Assert.NotEmpty(metadata.Author);
        }

        [Fact]
        public void OpenGraph_Model_Deserializes_From_Json()
        {
            var json = ReadJsonDataFile("open-graph.json");
            var og = JsonSerializer.Deserialize<OpenGraph>(json, JsonOptions);
            Assert.NotNull(og);
            Assert.NotNull(og.Type);
            Assert.NotEmpty(og.Type);
            Assert.NotNull(og.Title);
            Assert.NotEmpty(og.Title);
            Assert.NotNull(og.Description);
            Assert.NotEmpty(og.Description);
            Assert.NotNull(og.Url);
            Assert.NotNull(og.Image);
            Assert.NotEmpty(og.Image);
        }

        [Fact]
        public void TwitterCard_Model_Deserializes_From_Json()
        {
            var json = ReadJsonDataFile("twitter-card.json");
            var tc = JsonSerializer.Deserialize<TwitterCard>(json, JsonOptions);
            Assert.NotNull(tc);
            Assert.NotNull(tc.Card);
            Assert.NotEmpty(tc.Card);
            Assert.NotNull(tc.Site);
            Assert.NotEmpty(tc.Site);
            Assert.NotNull(tc.Title);
            Assert.NotEmpty(tc.Title);
            Assert.NotNull(tc.Description);
            Assert.NotEmpty(tc.Description);
            Assert.NotNull(tc.Image);
        }

        [Fact]
        public void PageMetadata_Has_Sensible_Defaults()
        {
            var pm = new PageMetadata();
            Assert.Equal("website", pm.OgType);
            Assert.Equal("summary_large_image", pm.TwitterCard);
        }

        // ========================================================================
        // B. DATA FILE INTEGRITY TESTS
        // ========================================================================

        [Fact]
        public void Metadata_Json_Exists_And_Has_Required_Fields()
        {
            var json = ReadJsonDataFile("metadata.json");
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            Assert.True(root.TryGetProperty("defaultTitle", out var title) && title.ValueKind == JsonValueKind.String);
            Assert.True(root.TryGetProperty("defaultDescription", out var desc) && desc.ValueKind == JsonValueKind.String);
            Assert.True(root.TryGetProperty("keywords", out var kw) && kw.ValueKind == JsonValueKind.String);
            Assert.False(string.IsNullOrWhiteSpace(title.GetString()));
            Assert.False(string.IsNullOrWhiteSpace(desc.GetString()));
            Assert.False(string.IsNullOrWhiteSpace(kw.GetString()));
        }

        [Fact]
        public void OpenGraph_Json_Has_Valid_Url()
        {
            var json = ReadJsonDataFile("open-graph.json");
            var og = JsonSerializer.Deserialize<OpenGraph>(json, JsonOptions);
            Assert.NotNull(og);
            Assert.StartsWith("https://", og.Url);
            Assert.Contains(".net", og.Url);
        }

        [Fact]
        public void TwitterCard_Json_Has_Valid_Card_Type()
        {
            var json = ReadJsonDataFile("twitter-card.json");
            var tc = JsonSerializer.Deserialize<TwitterCard>(json, JsonOptions);
            Assert.NotNull(tc);
            Assert.Equal("summary_large_image", tc.Card);
        }

        [Fact]
        public void JsonLd_File_Exists_And_Valid()
        {
            var jsonLdPath = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "data", "json", "json-ld.json");
            Assert.True(File.Exists(jsonLdPath), "json-ld.json not found");
            var content = File.ReadAllText(jsonLdPath);
            Assert.NotEmpty(content);
            using var doc = JsonDocument.Parse(content);
            Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        }

        // ========================================================================
        // C. METADATA SERVICE TESTS
        // ========================================================================

        private static HttpClient CreateMockHttpClient(string jsonResponse)
        {
            var handler = new MockJsonHttpHandler(jsonResponse);
            return new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        }

        private MetadataService CreateMetadataService(HttpClient httpClient)
        {
            JSInterop.SetupVoid("setPageMetadata", _ => true).SetVoidResult();
            return new MetadataService(httpClient, JSInterop.JSRuntime);
        }

        [Fact]
        public async Task GetMetadataAsync_Returns_Valid_Data()
        {
            var json = ReadJsonDataFile("metadata.json");
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            var result = await service.GetMetadataAsync();
            Assert.NotNull(result);
            Assert.NotNull(result.DefaultTitle);
            Assert.NotEmpty(result.DefaultTitle);
            Assert.NotNull(result.DefaultDescription);
            Assert.NotEmpty(result.DefaultDescription);
        }

        [Fact]
        public async Task GetOpenGraphAsync_Returns_Valid_Data()
        {
            var json = ReadJsonDataFile("open-graph.json");
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            var result = await service.GetOpenGraphAsync();
            Assert.NotNull(result);
            Assert.NotNull(result.Type);
            Assert.Equal("website", result.Type);
            Assert.NotNull(result.Url);
            Assert.StartsWith("https://", result.Url);
        }

        [Fact]
        public async Task GetTwitterCardAsync_Returns_Valid_Data()
        {
            var json = ReadJsonDataFile("twitter-card.json");
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            var result = await service.GetTwitterCardAsync();
            Assert.NotNull(result);
            Assert.NotNull(result.Card);
            Assert.Equal("summary_large_image", result.Card);
            Assert.NotNull(result.Site);
            Assert.StartsWith("@", result.Site);
        }

        [Fact]
        public async Task GetJsonLdAsync_Returns_NonEmpty_String()
        {
            var jsonLdPath = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "data", "json", "json-ld.json");
            var json = File.ReadAllText(jsonLdPath);
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            var result = await service.GetJsonLdAsync();
            Assert.NotNull(result);
            Assert.NotEmpty(result);
        }

        [Fact]
        public async Task SetPageMetadata_Fires_OnMetadataChanged()
        {
            var json = ReadJsonDataFile("metadata.json");
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            var fired = false;
            service.OnMetadataChanged += () => fired = true;
            await service.SetPageMetadata(new PageMetadata { Title = "Test Title" });
            Assert.True(fired);
            Assert.Equal("Test Title", service.PageMetadata.Title);
        }

        [Fact]
        public async Task Service_Caches_Loaded_Data()
        {
            var json = ReadJsonDataFile("metadata.json");
            var callCount = 0;
            var handler = new CountingHttpHandler(json, () => callCount++);
            var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
            var service = CreateMetadataService(http);
            var result1 = await service.GetMetadataAsync();
            Assert.NotNull(result1);
            var result2 = await service.GetMetadataAsync();
            Assert.NotNull(result2);
            Assert.Same(result1, result2);
            Assert.Equal(1, callCount);
        }

        [Fact]
        public async Task ResetToDefaultMetadata_Loads_Defaults()
        {
            var json = ReadJsonDataFile("metadata.json");
            var http = CreateMockHttpClient(json);
            var service = CreateMetadataService(http);
            await service.SetPageMetadata(new PageMetadata { Title = "Custom", Description = "Custom desc" });
            Assert.Equal("Custom", service.PageMetadata.Title);
            await service.ResetToDefaultMetadata();
            Assert.NotEqual("Custom", service.PageMetadata.Title);
            Assert.NotNull(service.PageMetadata.Keywords);
        }

        // ========================================================================
        // D. META TAGS COMPONENT TESTS (bUnit)
        // ========================================================================

        private void RegisterSeoTestServices()
        {
            var metadataJson = ReadJsonDataFile("metadata.json");
            var ogJson = ReadJsonDataFile("open-graph.json");
            var tcJson = ReadJsonDataFile("twitter-card.json");
            var jsonLdPath = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "data", "json", "json-ld.json");

            JSInterop.SetupVoid("vvg.updateMeta", _ => true).SetVoidResult();
            JSInterop.Setup<string>("vvg.theme.current").SetResult("light");
            JSInterop.SetupVoid("vvg.updateGridColor", _ => true).SetVoidResult();
            JSInterop.SetupVoid("eval", _ => true).SetVoidResult();

            var handler = new MultiRouteHttpHandler(new Dictionary<string, string>
            {
                ["assets/data/json/metadata.json"] = metadataJson,
                ["assets/data/json/open-graph.json"] = ogJson,
                ["assets/data/json/twitter-card.json"] = tcJson,
                ["assets/data/json/json-ld.json"] = File.Exists(jsonLdPath) ? File.ReadAllText(jsonLdPath) : "{}",
                ["assets/data/dataset-manifest.json"] = "{\"version\":\"1.0\",\"files\":{\"markdown\":[],\"json\":[],\"csv\":[],\"txt\":[]}}"
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
            Services.AddSingleton(httpClient);
            Services.AddSingleton(new MetadataService(httpClient, JSInterop.JSRuntime));
        }

        [Fact]
        public void MetaTags_Component_Renders_Without_Errors()
        {
            RegisterSeoTestServices();
            var cut = RenderComponent<MetaTags>();
            Assert.NotNull(cut);
        }

        [Fact]
        public async Task MetaTags_UpdateMeta_Triggered_On_Init()
        {
            RegisterSeoTestServices();
            RenderComponent<MetaTags>();
            var invocations = JSInterop.Invocations
                .Where(i => i.Identifier == "vvg.updateMeta")
                .ToList();
            Assert.NotEmpty(invocations);
        }

        [Fact]
        public async Task MetaTags_UpdateMeta_Called_On_MetadataChanged()
        {
            RegisterSeoTestServices();
            RenderComponent<MetaTags>();
            var initialCount = JSInterop.Invocations
                .Count(i => i.Identifier == "vvg.updateMeta");
            var metadataService = Services.GetRequiredService<MetadataService>();
            await metadataService.SetPageMetadata(new PageMetadata
            {
                Title = "Updated Title",
                Description = "Updated Description",
                Keywords = "test, seo",
                OgType = "article",
                TwitterCard = "summary"
            });
            var finalCount = JSInterop.Invocations
                .Count(i => i.Identifier == "vvg.updateMeta");
            Assert.True(finalCount > initialCount);
        }

        // ========================================================================
        // MOCK HTTP HANDLERS
        // ========================================================================

        private class MockJsonHttpHandler : HttpMessageHandler
        {
            private readonly string _jsonResponse;
            public MockJsonHttpHandler(string jsonResponse) => _jsonResponse = jsonResponse;

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_jsonResponse, Encoding.UTF8, "application/json")
                });
            }
        }

        private class CountingHttpHandler : HttpMessageHandler
        {
            private readonly string _jsonResponse;
            private readonly Action _onRequest;
            public CountingHttpHandler(string jsonResponse, Action onRequest)
            {
                _jsonResponse = jsonResponse;
                _onRequest = onRequest;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                _onRequest();
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_jsonResponse, Encoding.UTF8, "application/json")
                });
            }
        }

        private class MultiRouteHttpHandler : HttpMessageHandler
        {
            private readonly Dictionary<string, string> _routes;
            public MultiRouteHttpHandler(Dictionary<string, string> routes) => _routes = routes;

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                var path = request.RequestUri!.AbsolutePath.TrimStart('/');
                if (_routes.TryGetValue(path, out var content))
                {
                    var contentType = path.EndsWith(".json") ? "application/json" : "text/plain";
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(content, Encoding.UTF8, contentType)
                    });
                }
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }
        }
    }
}
