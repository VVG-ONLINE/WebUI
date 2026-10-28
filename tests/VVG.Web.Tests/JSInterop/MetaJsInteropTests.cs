/// <summary>
/// Validates that meta.js has the structure C# expects for SEO tag injection.
///
/// Like ChatJsInteropTests, these are text-level checks — they verify
/// that meta.js exposes window.vvg.updateMeta and contains all the
/// required meta tag types: standard SEO (description, keywords),
/// Open Graph (og:*), Twitter Card, and JSON-LD structured data.
/// </summary>
namespace VVG.Web.Tests.JSInterop
{
    public class MetaJsInteropTests
    {
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

        /// <summary>Reads the meta.js file from wwwroot as a string.</summary>
        private static string GetMetaJsContent()
        {
            return File.ReadAllText(Path.Combine(GetProjectRoot(), "src", "wwwroot", "assets", "js", "meta.js"));
        }

        [Fact]
        public void MetaJS_File_Exists()
        {
            var metaJsPath = Path.Combine(GetProjectRoot(), "src", "wwwroot", "assets", "js", "meta.js");
            Assert.True(File.Exists(metaJsPath));
        }

        [Fact]
        public void MetaJS_Exposes_UpdateMeta()
        {
            var content = GetMetaJsContent();
            Assert.Contains("window.vvg.updateMeta", content);
        }

        [Fact]
        public void MetaJS_Sets_Document_Title()
        {
            var content = GetMetaJsContent();
            Assert.Contains("document.title", content);
            Assert.Contains("meta.title", content);
        }

        [Fact]
        public void MetaJS_Sets_OG_Tags()
        {
            var content = GetMetaJsContent();
            Assert.Contains("og:type", content);
            Assert.Contains("og:title", content);
            Assert.Contains("og:description", content);
            Assert.Contains("og:image", content);
            Assert.Contains("og:url", content);
        }

        [Fact]
        public void MetaJS_Sets_Twitter_Tags()
        {
            var content = GetMetaJsContent();
            Assert.Contains("twitter:card", content);
            Assert.Contains("twitter:site", content);
            Assert.Contains("twitter:creator", content);
            Assert.Contains("twitter:title", content);
            Assert.Contains("twitter:description", content);
            Assert.Contains("twitter:image", content);
        }

        [Fact]
        public void MetaJS_Handles_JsonLd()
        {
            var content = GetMetaJsContent();
            Assert.Contains("application/ld+json", content);
            Assert.Contains("vvg-jsonld", content);
            Assert.Contains("meta.jsonLd", content);
        }

        [Fact]
        public void MetaJS_Sets_Standard_Meta_Tags()
        {
            var content = GetMetaJsContent();
            Assert.Contains("description", content);
            Assert.Contains("keywords", content);
        }
    }
}
