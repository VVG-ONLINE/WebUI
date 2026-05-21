using Bunit;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using VVG.Web.Layout;
using VVG.Web.Services;

namespace VVG.Web.Tests.Components
{
    public class MainLayoutTests : TestContext
    {
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

            var mockHandler = new MockHttpHandler();
            var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost/") };

            Services.AddSingleton(httpClient);
            Services.AddSingleton<ThemeService>(sp => new ThemeService(JSInterop.JSRuntime));
            Services.AddSingleton<MetadataService>(sp => new MetadataService(httpClient, JSInterop.JSRuntime));
        }

        [Fact]
        public void MainLayout_Renders_AITerminal()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var terminal = cut.Find("#ai-terminal");
            Assert.NotNull(terminal);
        }

        [Fact]
        public void MainLayout_Terminal_Has_Correct_Header()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var header = cut.Find(".terminal-title");
            Assert.NotNull(header);
            Assert.Contains("VIKAS_AI_AGENT", header.TextContent);
        }

        [Fact]
        public void MainLayout_Terminal_Closed_Has_Correct_Class()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var terminal = cut.Find("#ai-terminal");
            Assert.Contains("terminal-closed", terminal.ClassList);
        }

        [Fact]
        public void MainLayout_Renders_Chat_Output_Area()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var chatOutput = cut.Find("#chat-output");
            Assert.NotNull(chatOutput);
        }

        [Fact]
        public void MainLayout_Renders_User_Input()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var input = cut.Find("#user-input");
            Assert.NotNull(input);
            Assert.Equal("Ask Vikas AI...", input.GetAttribute("placeholder"));
        }

        [Fact]
        public void MainLayout_Input_Has_Autocomplete_Off()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var input = cut.Find("#user-input");
            Assert.Equal("off", input.GetAttribute("autocomplete"));
        }

        [Fact]
        public void MainLayout_Renders_Terminal_Prompt()
        {
            RegisterRequiredServices();
            var cut = RenderComponent<MainLayout>();
            var prompts = cut.FindAll(".terminal-prompt");
            Assert.NotEmpty(prompts);
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

    public class MockHttpHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}