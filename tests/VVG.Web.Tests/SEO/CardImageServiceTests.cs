/// <summary>
/// Tests for CardImageService — verifies slug-to-PNG mapping, fallback behavior, and caching.
/// </summary>
using System.Net;
using System.Text;
using System.Text.Json;
using Bunit;
using VVG.Web.Services;

namespace VVG.Web.Tests.SEO
{
    public class CardImageServiceTests : TestContext
    {
        private static readonly string ProjectRoot = GetProjectRoot();

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

        private static string ReadCardMappingJson()
        {
            var path = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "images", "twitter-cards", "card-mapping.json");
            return File.ReadAllText(path);
        }

        private CardImageService CreateService(HttpClient httpClient)
        {
            return new CardImageService(httpClient);
        }

        // ========================================================================
        // A. KNOWN SLUG MAPPING
        // ========================================================================

        [Fact]
        public async Task GetImageUrlAsync_HomeSlug_ReturnsHomeCardUrl()
        {
            var mappingJson = ReadCardMappingJson();
            var http = CreateMockHttpClient(mappingJson);
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("home");

            Assert.NotNull(url);
            Assert.Contains("home-twitter-card.png", url);
            Assert.StartsWith("assets/images/twitter-cards/", url);
        }

        [Fact]
        public async Task GetImageUrlAsync_ContactSlug_ReturnsContactCardUrl()
        {
            var mappingJson = ReadCardMappingJson();
            var http = CreateMockHttpClient(mappingJson);
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("contact");

            Assert.NotNull(url);
            Assert.Contains("contact-twitter-card.png", url);
        }

        [Fact]
        public async Task GetImageUrlAsync_BlogPostSlug_ReturnsCorrectCardUrl()
        {
            var mappingJson = ReadCardMappingJson();
            var http = CreateMockHttpClient(mappingJson);
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("communication-mastery-for-digital-business-success");

            Assert.NotNull(url);
            Assert.Contains("communication-mastery-for-digital-business-success-twitter-card.png", url);
        }

        // ========================================================================
        // B. FALLBACK BEHAVIOR
        // ========================================================================

        [Fact]
        public async Task GetImageUrlAsync_UnknownSlug_ReturnsFallbackHomeCard()
        {
            var mappingJson = ReadCardMappingJson();
            var http = CreateMockHttpClient(mappingJson);
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("nonexistent-page");

            Assert.NotNull(url);
            Assert.Contains("home-twitter-card.png", url);
        }

        [Fact]
        public async Task GetImageUrlAsync_EmptySlug_ReturnsFallbackHomeCard()
        {
            var mappingJson = ReadCardMappingJson();
            var http = CreateMockHttpClient(mappingJson);
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("");

            Assert.NotNull(url);
            Assert.Contains("home-twitter-card.png", url);
        }

        // ========================================================================
        // C. MISSING MAPPING FILE
        // ========================================================================

        [Fact]
        public async Task GetImageUrlAsync_MissingMappingFile_DoesNotCrash()
        {
            var http = CreateFailingHttpClient();
            var service = CreateService(http);

            var url = await service.GetImageUrlAsync("home");

            Assert.NotNull(url);
            Assert.Contains("home-twitter-card.png", url);
        }

        // ========================================================================
        // D. CACHING
        // ========================================================================

        [Fact]
        public async Task GetImageUrlAsync_CachesMapping_OnSubsequentCalls()
        {
            var mappingJson = ReadCardMappingJson();
            var callCount = 0;
            var handler = new CountingHttpHandler(mappingJson, () => callCount++);
            var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
            var service = CreateService(http);

            var url1 = await service.GetImageUrlAsync("home");
            var url2 = await service.GetImageUrlAsync("contact");

            Assert.Equal(1, callCount);
            Assert.NotNull(url1);
            Assert.NotNull(url2);
        }

        // ========================================================================
        // E. CARD MAPPING JSON INTEGRITY
        // ========================================================================

        [Fact]
        public void CardMappingJson_IsValidDictionary()
        {
            var json = ReadCardMappingJson();
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            Assert.NotEmpty(mapping);
        }

        [Fact]
        public void CardMappingJson_ContainsRequiredPages()
        {
            var json = ReadCardMappingJson();
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            Assert.True(mapping.ContainsKey("home"));
            Assert.True(mapping.ContainsKey("contact"));
            Assert.True(mapping.ContainsKey("services"));
            Assert.True(mapping.ContainsKey("about"));
            Assert.True(mapping.ContainsKey("blog"));
            Assert.True(mapping.ContainsKey("blog-archives"));
        }

        [Fact]
        public void CardMappingJson_AllValuesEndWithPng()
        {
            var json = ReadCardMappingJson();
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            foreach (var kvp in mapping)
            {
                Assert.EndsWith("-twitter-card.png", kvp.Value);
            }
        }

        // ========================================================================
        // MOCK HTTP HANDLERS
        // ========================================================================

        private static HttpClient CreateMockHttpClient(string jsonResponse)
        {
            var handler = new MockJsonHttpHandler(jsonResponse);
            return new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        }

        private static HttpClient CreateFailingHttpClient()
        {
            var handler = new FailingHttpHandler();
            return new HttpClient(handler) { BaseAddress = new Uri("http://localhost/") };
        }

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

        private class FailingHttpHandler : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }
        }
    }
}
