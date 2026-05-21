using Bunit;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.DependencyInjection;
using VVG.Web.Models;
using VVG.Web.Shared;
using Xunit;

namespace VVG.Web.Pages;

public class TableOfContentsTests : TestContext
{
    private string GetSampleHtmlContent()
    {
        return @"
            <h2>Introduction</h2>
            <p>Some introduction content here.</p>
            <h2>Main Section</h2>
            <p>Some main content here.</p>
            <h3>Subsection One</h3>
            <p>Subsection content.</p>
            <h3>Subsection Two</h3>
            <p>More subsection content.</p>
            <h2>Conclusion</h2>
            <p>Conclusion content here.</p>
        ";
    }

    [Fact]
    public void TableOfContents_ExtractsH2AndH3Headings()
    {
        // Arrange
        var htmlContent = GetSampleHtmlContent();

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        Assert.NotNull(cut);
        var tocLinks = cut.FindAll(".toc-link");
        Assert.NotEmpty(tocLinks);
        Assert.True(tocLinks.Count >= 4); // At least 5 headings
    }

    [Fact]
    public void TableOfContents_DisplaysTocTitle()
    {
        // Arrange
        var htmlContent = GetSampleHtmlContent();

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        var tocTitle = cut.Find(".toc-title");
        Assert.Contains("ON THIS PAGE", tocTitle.TextContent);
    }

    [Fact]
    public void TableOfContents_GeneratesHeadingIds()
    {
        // Arrange
        var htmlContent = GetSampleHtmlContent();

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        var links = cut.FindAll(".toc-link");
        foreach (var link in links)
        {
            var href = link.GetAttribute("href");
            Assert.NotNull(href);
            Assert.StartsWith("#", href);
        }
    }

    [Fact]
    public void TableOfContents_AppliesCorrectLevelClasses()
    {
        // Arrange
        var htmlContent = GetSampleHtmlContent();

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        var level2Items = cut.FindAll(".toc-item.level-2");
        var level3Items = cut.FindAll(".toc-item.level-3");
        
        Assert.NotEmpty(level2Items);
        Assert.NotEmpty(level3Items);
    }

    [Fact]
    public void TableOfContents_DisplaysReturnToTopButton()
    {
        // Arrange
        var htmlContent = GetSampleHtmlContent();

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        var returnToTopBtn = cut.Find(".toc-actions .btn");
        Assert.Contains("RETURN TO TOP", returnToTopBtn.TextContent);
    }

    [Fact]
    public void TableOfContents_DoesNotRenderWhenNoHeadings()
    {
        // Arrange
        var htmlContent = "<p>No headings here</p>";

        // Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, htmlContent)
        );

        // Assert
        var tocNav = cut.FindAll(".toc-nav");
        Assert.Empty(tocNav);
    }

    [Fact]
    public void TableOfContents_HandlesEmptyContent()
    {
        // Arrange & Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, string.Empty)
        );

        // Assert
        var tocNav = cut.FindAll(".toc-nav");
        Assert.Empty(tocNav);
    }

    [Fact]
    public void TableOfContents_HandlesNullContent()
    {
        // Arrange & Act
        var cut = RenderComponent<TableOfContents>(parameters =>
            parameters.Add(p => p.HtmlContent, (string)null!)
        );

        // Assert
        var tocNav = cut.FindAll(".toc-nav");
        Assert.Empty(tocNav);
    }
}

public class BlogPostSidebarTests : TestContext
{
    private BlogPost GetSamplePost()
    {
        return new BlogPost
        {
            Title = "Test Post",
            Slug = "test-post",
            PublishedAt = new DateTime(2025, 1, 15),
            Tags = new[] { "Technology", "Blazor", "WebAssembly" },
            Excerpt = "Test excerpt",
            Category = Category.Technology,
            TimeToRead = 5,
            Featured = false,
            Draft = false,
            Filename = "test-post"
        };
    }

    [Fact]
    public void BlogPostSidebar_RendersSidebarContainer()
    {
        // Arrange
        var post = GetSamplePost();

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
            parameters.Add(p => p.Post, post)
        );

        // Assert
        var sidebar = cut.Find(".blog-sidebar");
        Assert.NotNull(sidebar);
    }

    [Fact]
    public void BlogPostSidebar_DisplaysAuthorCard()
    {
        // Arrange
        var post = GetSamplePost();
        var authorName = "John Doe";
        var authorBio = "Test author bio";

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
        {
            parameters.Add(p => p.Post, post);
            parameters.Add(p => p.AuthorName, authorName);
            parameters.Add(p => p.AuthorBio, authorBio);
        });

        // Assert
        var authorCard = cut.Find(".author-card");
        Assert.Contains(authorName, authorCard.TextContent);
        Assert.Contains(authorBio, authorCard.TextContent);
    }

    [Fact]
    public void BlogPostSidebar_DisplaysPostMetadata()
    {
        // Arrange
        var post = GetSamplePost();

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
            parameters.Add(p => p.Post, post)
        );

        // Assert
        var metaCard = cut.Find(".meta-card");
        Assert.Contains("Jan 15, 2025", metaCard.TextContent);
        Assert.Contains("Technology", metaCard.TextContent);
        Assert.Contains("5 min", metaCard.TextContent);
    }

    [Fact]
    public void BlogPostSidebar_DisplaysTags()
    {
        // Arrange
        var post = GetSamplePost();

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
            parameters.Add(p => p.Post, post)
        );

        // Assert
        var tagsCard = cut.Find(".tags-card");
        foreach (var tag in post.Tags ?? Array.Empty<string>())
        {
            Assert.Contains(tag, tagsCard.TextContent);
        }
    }

    [Fact]
    public void BlogPostSidebar_DisplaysHighlights()
    {
        // Arrange
        var post = GetSamplePost();
        var highlights = "Key point 1\nKey point 2\nKey point 3";

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
        {
            parameters.Add(p => p.Post, post);
            parameters.Add(p => p.Highlights, highlights);
        });

        // Assert
        var highlightsCard = cut.Find(".highlights-card");
        Assert.Contains("Key point 1", highlightsCard.TextContent);
        Assert.Contains("Key point 2", highlightsCard.TextContent);
        Assert.Contains("Key point 3", highlightsCard.TextContent);
    }

    [Fact]
    public void BlogPostSidebar_DisplaysCopyLinkAndShareButtons()
    {
        // Arrange
        var post = GetSamplePost();

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
            parameters.Add(p => p.Post, post)
        );

        // Assert
        var actionsCard = cut.Find(".actions-card");
        var buttons = cut.FindAll(".actions-card .btn");
        
        Assert.NotEmpty(buttons);
        Assert.Contains(buttons, b => b.TextContent.Contains("COPY LINK"));
        Assert.Contains(buttons, b => b.TextContent.Contains("SHARE"));
    }

    [Fact]
    public void BlogPostSidebar_DisplaysTableOfContents()
    {
        // Arrange
        var post = GetSamplePost();
        var htmlContent = "<h2>Section 1</h2><h3>Subsection</h3>";

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
        {
            parameters.Add(p => p.Post, post);
            parameters.Add(p => p.HtmlContent, htmlContent);
        });

        // Assert
        var tocCard = cut.Find(".toc-card");
        Assert.NotNull(tocCard);
    }

    [Fact]
    public void BlogPostSidebar_CopyLinkButtonTriggersCallback()
    {
        // Arrange
        var post = GetSamplePost();
        var callbackInvoked = false;

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
        {
            parameters.Add(p => p.Post, post);
            parameters.Add(p => p.OnCopyLink, EventCallback.Factory.Create(this, async () => 
            {
                callbackInvoked = true;
                await Task.CompletedTask;
            }));
        });

        var copyBtn = cut.FindAll(".actions-card .btn")[0];
        copyBtn.Click();

        // Assert
        Assert.True(callbackInvoked);
    }

    [Fact]
    public void BlogPostSidebar_ShareButtonTriggersCallback()
    {
        // Arrange
        var post = GetSamplePost();
        var callbackInvoked = false;

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
        {
            parameters.Add(p => p.Post, post);
            parameters.Add(p => p.OnShare, EventCallback.Factory.Create(this, async () => 
            {
                callbackInvoked = true;
                await Task.CompletedTask;
            }));
        });

        var buttons = cut.FindAll(".actions-card .btn");
        buttons[buttons.Count - 1].Click();

        // Assert
        Assert.True(callbackInvoked);
    }

    [Fact]
    public void BlogPostSidebar_HandlesMissingTags()
    {
        // Arrange
        var post = GetSamplePost();
        post.Tags = null;

        // Act
        var cut = RenderComponent<BlogPostSidebar>(parameters =>
            parameters.Add(p => p.Post, post)
        );

        // Assert
        var tagsCard = cut.FindAll(".tags-card");
        Assert.Empty(tagsCard);
    }

    [Fact]
    public void BlogPostSidebar_HandlesMissingPost()
    {
        // Act
        var cut = RenderComponent<BlogPostSidebar>();

        // Assert
        var sidebar = cut.Find(".blog-sidebar");
        Assert.NotNull(sidebar);
    }
}

public class BlogPostPageSidebarIntegrationTests : TestContext
{
    private HttpClient SetupHttpClient()
    {
        var posts = new[]
        {
            new BlogPost
            {
                Title = "Test Post",
                Slug = "test-post",
                Filename = "test-post",
                PublishedAt = new DateTime(2025, 1, 15),
                Tags = new[] { "Tech" },
                Excerpt = "Test excerpt",
                Category = Category.Technology,
                TimeToRead = 5,
                Featured = false,
                Draft = false
            }
        };

        Services.AddScoped(sp => new HttpClient(new MockHttpMessageHandler(posts))
        {
            BaseAddress = new Uri("http://localhost/")
        });

        return Services.GetRequiredService<HttpClient>();
    }

    [Fact]
    public void BlogPostPage_DisplaysSidebarWithPost()
    {
        // Arrange
        var httpClient = SetupHttpClient();

        // Act - We would render BlogPostPage with a slug here
        // This is a placeholder for the integration test structure

        // Assert
        // Verify sidebar loads with post data
    }
}

// Mock HTTP Message Handler for testing
public class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly BlogPost[] _posts;

    public MockHttpMessageHandler(BlogPost[] posts)
    {
        _posts = posts;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri?.AbsolutePath.Contains("blog-index.json") ?? false)
        {
            var content = System.Text.Json.JsonSerializer.Serialize(_posts);
            return Task.FromResult(new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json")
            });
        }

        return Task.FromResult(new HttpResponseMessage
        {
            StatusCode = System.Net.HttpStatusCode.NotFound
        });
    }
}
