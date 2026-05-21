using Bunit;
using Xunit;
using Moq;
using System.Net.Http;
using Microsoft.AspNetCore.Components;
using VVG.Web.Models;
using VVG.Web.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;

namespace VVG.Web.Tests
{
    public class BlogPostTests : TestContext
    {
        [Fact]
        public void BlogPost_ComponentInitializes()
        {
            // Arrange
            var mockNav = new Mock<NavigationManager>();
            var mockMeta = new Mock<MetadataService>(Mock.Of<HttpClient>(), Mock.Of<IJSRuntime>());
            var mockJS = new Mock<IJSRuntime>();
            
            mockNav.Setup(n => n.BaseUri).Returns("http://localhost/");
            mockNav.Setup(n => n.Uri).Returns("http://localhost/blog/test");
            
            Services.AddSingleton(mockNav.Object);
            Services.AddSingleton(mockMeta.Object);
            Services.AddSingleton(mockJS.Object);
            Services.AddSingleton(new HttpClient());

            // Act
            var cut = RenderComponent<Pages.BlogPostPage>(parameters => 
                parameters.Add(p => p.Slug, "test-slug")
            );

            // Assert
            Assert.NotNull(cut);
            Assert.NotNull(cut.Instance);
            Assert.Equal("test-slug", cut.Instance.Slug);
        }
    }
}
