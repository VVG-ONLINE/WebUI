using System.Net;
using System.Text;
using Bunit;
using Microsoft.Extensions.DependencyInjection;
using VVG.Web.Pages;
using VVG.Web.Services;
using VVG.Web.Layout;

namespace VVG.Web.Tests.Components;

public sealed class PrivateAiTests : TestContext
{
    private static readonly string ProjectRoot = GetProjectRoot();

    [Fact]
    public async Task PrivateAiPage_Renders_Core_Conversion_Content()
    {
        RegisterServices();

        var layout = new MainLayout();
        var cut = RenderComponent<PrivateAi>(parameters => parameters.AddCascadingValue(layout));

        // Wait for HeroBanner typewriter animation to complete (50 chars at 72ms = ~3.6s)
        await Task.Delay(4000);

        // Re-render to update the component with the full title
        cut.Render();

        // Check for content that's guaranteed to be in the new layout
        Assert.Contains("Run useful AI where your business can control it", cut.Find("h1.hero-title").TextContent, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Energy", cut.Markup);
        Assert.Contains("₹1.5 lakh initial setup", cut.Markup);
        Assert.Contains("POWER + MAINTENANCE EXTRA", cut.Markup);
        Assert.Contains("5 DIMENSIONS", cut.Markup);
        Assert.Contains("45 POINTS", cut.Markup);
        Assert.Contains("36-45", cut.Markup);
        Assert.NotEmpty(cut.FindAll("a[href='contact']"));
        Assert.NotEmpty(cut.FindAll("a[href='blog']"));
    }

    [Fact]
    public void PrivateAiPage_Loads_Canonical_Metadata()
    {
        RegisterServices();

        var layout = new MainLayout();
        RenderComponent<PrivateAi>(parameters => parameters.AddCascadingValue(layout));

        var metadata = Services.GetRequiredService<MetadataService>().PageMetadata;
        Assert.Equal("Private AI for Bharat's SMBs - VVG ONLINE", metadata.Title);
        Assert.Equal("https://vvgonline.net/private-ai", metadata.CanonicalUrl);
        Assert.Equal("https://vvgonline.net/private-ai", metadata.OgUrl);
    }

    [Fact]
    public void SiteFooter_Exposes_PrivateAi_Route()
    {
        var cut = RenderComponent<VVG.Web.Shared.SiteFooter>();

        var link = cut.Find("a[href='private-ai']");
        Assert.Equal("Private AI", link.TextContent.Trim());
    }

    private void RegisterServices()
    {
        JSInterop.SetupVoid("setPageMetadata", _ => true).SetVoidResult();
        JSInterop.Setup<string>("getRandomQuestion").SetResult("// Try asking 'What is private AI?'");
        JSInterop.Setup<string>("extractRawFromPlaceholder", _ => true).SetResult("What is private AI?");
        JSInterop.SetupVoid("eval", _ => true).SetVoidResult();

        var routes = new Dictionary<string, string>
        {
            ["assets/data/json/metadata.json"] = ReadAsset("metadata.json"),
            ["assets/data/json/open-graph.json"] = ReadAsset("open-graph.json"),
            ["assets/data/json/twitter-card.json"] = ReadAsset("twitter-card.json")
        };

        var httpClient = new HttpClient(new JsonAssetHandler(routes))
        {
            BaseAddress = new Uri("http://localhost/")
        };

        Services.AddSingleton(httpClient);
        Services.AddSingleton(new MetadataService(httpClient, JSInterop.JSRuntime));
    }

    private static string ReadAsset(string filename) => File.ReadAllText(
        Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "data", "json", filename));

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

    private sealed class JsonAssetHandler : HttpMessageHandler
    {
        private readonly IReadOnlyDictionary<string, string> _routes;

        public JsonAssetHandler(IReadOnlyDictionary<string, string> routes) => _routes = routes;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var path = request.RequestUri?.AbsolutePath.TrimStart('/') ?? string.Empty;
            if (_routes.TryGetValue(path, out var content))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(content, Encoding.UTF8, "application/json")
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}
