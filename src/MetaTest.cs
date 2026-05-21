using Xunit;
using Bunit;
using VVG.Web.Shared;
using VVG.Web.Services;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Threading.Tasks;
using VVG.Web.Models;
using System.Collections.Generic;
using Microsoft.JSInterop;

namespace VVG.Web.Tests
{
    public class MetaTagsTest
    {
        [Fact]
        public async Task MetaTags_Component_Renders_And_Updates_Meta_Tags()
        {
            // Arrange
            using var ctx = new TestContext();
            var mockMetadataService = new Mock<MetadataService>();
            var mockJsRuntime = new Mock<IJSRuntime>();

            ctx.Services.AddSingleton(mockMetadataService.Object);
            ctx.Services.AddSingleton(mockJsRuntime.Object);

            var metadata = new Models.Metadata { DefaultTitle = "Test Title", DefaultDescription = "Test Description", Keywords = "test,keywords" };
            var twitterCard = new TwitterCard { Card = "summary_large_image", Site = "@testsite", Creator = "@testcreator", Title = "Twitter Title", Description = "Twitter Description", Image = "twitter.jpg" };
            var openGraph = new OpenGraph { Type = "website", Title = "OG Title", Description = "OG Description", Image = "og.jpg", Url = "http://test.com" };

            mockMetadataService.Setup(s => s.GetMetadataAsync()).ReturnsAsync(metadata);
            mockMetadataService.Setup(s => s.GetTwitterCardAsync()).ReturnsAsync(twitterCard);
            mockMetadataService.Setup(s => s.GetOpenGraphAsync()).ReturnsAsync(openGraph);
            
            var pageMetadata = new PageMetadata
            {
                Title = "Page Title",
                Description = "Page Description",
                Keywords = "page,keywords",
                Image = "page.jpg",
                OgType = "article",
                OgTitle = "Page OG Title",
                OgDescription = "Page OG Description",
                OgImage = "page_og.jpg",
                OgUrl = "http://page.com",
                TwitterCard = "summary",
                TwitterSite = "@pagesite",
                TwitterCreator = "@pagecreator",
                TwitterTitle = "Page Twitter Title",
                TwitterDescription = "Page Twitter Description",
                TwitterImage = "page_twitter.jpg"
            };
            mockMetadataService.Object.SetPageMetadata(pageMetadata);
            
            var component = ctx.RenderComponent<MetaTags>();
            
            await component.Instance.UpdateMeta();
            
            mockJsRuntime.Verify(js => js.InvokeVoidAsync("vvg.updateMeta", It.Is<object[]>(o => 
                (string)((IDictionary<string, object>)o[0])["title"] == pageMetadata.Title &&
                (string)((IDictionary<string, object>)o[0])["description"] == pageMetadata.Description &&
                (string)((IDictionary<string, object>)o[0])["keywords"] == pageMetadata.Keywords &&
                (string)((IDictionary<string, object>)o[0])["image"] == pageMetadata.Image &&
                (string)((IDictionary<string, object>)o[0])["ogType"] == pageMetadata.OgType &&
                (string)((IDictionary<string, object>)o[0])["ogTitle"] == pageMetadata.OgTitle &&
                (string)((IDictionary<string, object>)o[0])["ogDescription"] == pageMetadata.OgDescription &&
                (string)((IDictionary<string, object>)o[0])["ogImage"] == pageMetadata.OgImage &&
                (string)((IDictionary<string, object>)o[0])["ogUrl"] == pageMetadata.OgUrl &&
                (string)((IDictionary<string, object>)o[0])["twitterCard"] == pageMetadata.TwitterCard &&
                (string)((IDictionary<string, object>)o[0])["twitterSite"] == pageMetadata.TwitterSite &&
                (string)((IDictionary<string, object>)o[0])["twitterCreator"] == pageMetadata.TwitterCreator &&
                (string)((IDictionary<string, object>)o[0])["twitterTitle"] == pageMetadata.TwitterTitle &&
                (string)((IDictionary<string, object>)o[0])["twitterDescription"] == pageMetadata.TwitterDescription &&
                (string)((IDictionary<string, object>)o[0])["twitterImage"] == pageMetadata.TwitterImage
            )), Times.Once);
        }
    }
}
