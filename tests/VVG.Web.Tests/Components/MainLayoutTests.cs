/// <summary>
/// bUnit component tests for MainLayout — the shell that wraps every page.
///
/// These tests verify that the content area and footer render correctly.
/// JS interop calls are mocked so the tests run without a real browser.
///
/// bUnit provides a simulated DOM (Find/FindAll), mocks JS interop
/// (JSInterop.Setup...), and renders Blazor components in-memory.
/// </summary>
using Bunit;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using VVG.Web.Layout;
using VVG.Web.Services;

namespace VVG.Web.Tests.Components
{
    public class MainLayoutTests : TestContext
    {
        /// <summary>
        /// Registers all the services MainLayout depends on:
        /// - Mocked JS interop for localStorage, theme, grid colour, chat, meta
        /// - Mocked HTTP client (returns 404 for all knowledge-base requests)
        /// - Real ThemeService and MetadataService instances
        /// </summary>
        private void RegisterRequiredServices()
        {
            JSInterop.Setup<string>("localStorage.getItem", "theme").SetResult("light");
            JSInterop.Setup<string>("vvg.theme.current").SetResult("light");
            JSInterop.SetupVoid("localStorage.setItem", _ => true).SetVoidResult();
            JSInterop.SetupVoid("vvg.updateGridColor", _ => true).SetVoidResult();
            JSInterop.SetupVoid("vvg.updateMeta", _ => true).SetVoidResult();
            JSInterop.SetupVoid("transformersChat.init", _ => true).SetVoidResult();
            JSInterop.SetupVoid("eval", _ => true).SetVoidResult();
            JSInterop.SetupVoid("setPageMetadata", _ => true).SetVoidResult();
            JSInterop.Setup<string>("transformersChat.generate", _ => true).SetResult("// Response");

            var mockHandler = new MockHttpHandler();
            var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost/") };

            Services.AddSingleton(httpClient);
            Services.AddSingleton<ThemeService>(sp => new ThemeService(JSInterop.JSRuntime));
            Services.AddSingleton<MetadataService>(sp => new MetadataService(httpClient, JSInterop.JSRuntime));
        }

        [Fact]
        public void MainLayout_Renders_Content_Area()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var content = cut.Find("article.content");
            Assert.NotNull(content);
        }

        [Fact]
        public void MainLayout_Renders_Footer()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var footer = cut.Find("footer");
            Assert.NotNull(footer);
            Assert.Contains("VVG ONLINE", footer.TextContent);
        }
    }

    /// <summary>
    /// Mock HTTP handler that returns 404 for every request.
    /// This prevents knowledge-base loading from making real network calls
    /// during tests, while still letting the component initialize normally.
    /// </summary>
    public class MockHttpHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}
