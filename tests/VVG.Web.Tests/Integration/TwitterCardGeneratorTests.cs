/// <summary>
/// Integration/smoke tests for the Twitter Card Generator tool.
/// Verifies that generated PNG files exist, are non-empty, and the mapping is consistent.
/// </summary>
using System.Text.Json;

namespace VVG.Web.Tests.Integration
{
    public class TwitterCardGeneratorTests
    {
        private static readonly string ProjectRoot = GetProjectRoot();
        private static readonly string CardDir = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "images", "twitter-cards");
        private static readonly string MappingPath = Path.Combine(CardDir, "card-mapping.json");
        private static readonly string SvgTemplatePath = Path.Combine(CardDir, "vvg-online-home-twitter-card.svg");

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

        // ========================================================================
        // A. SVG TEMPLATE INTEGRITY
        // ========================================================================

        [Fact]
        public void SvgTemplate_Exists()
        {
            Assert.True(File.Exists(SvgTemplatePath), $"SVG template not found at {SvgTemplatePath}");
        }

        [Fact]
        public void SvgTemplate_HasRequiredLabels()
        {
            var svg = File.ReadAllText(SvgTemplatePath);

            Assert.Contains("inkscape:label=\"_punchline\"", svg);
            Assert.Contains("inkscape:label=\"_title\"", svg);
            Assert.Contains("inkscape:label=\"_description\"", svg);
        }

        [Fact]
        public void SvgTemplate_HasCorrectDimensions()
        {
            var svg = File.ReadAllText(SvgTemplatePath);

            Assert.Contains("width=\"800\"", svg);
            Assert.Contains("height=\"418\"", svg);
        }

        // ========================================================================
        // B. CARD MAPPING JSON
        // ========================================================================

        [Fact]
        public void CardMappingJson_Exists()
        {
            Assert.True(File.Exists(MappingPath), $"card-mapping.json not found at {MappingPath}");
        }

        [Fact]
        public void CardMappingJson_IsValidJson()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            Assert.NotEmpty(mapping);
        }

        [Fact]
        public void CardMappingJson_ContainsRequiredPages()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            var requiredPages = new[] { "home", "contact", "services", "private-ai", "about", "blog", "blog-archives" };

            foreach (var page in requiredPages)
            {
                Assert.True(mapping.ContainsKey(page), $"Missing required page: {page}");
            }
        }

        [Fact]
        public void CardMappingJson_AllValuesEndWithPng()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            foreach (var kvp in mapping)
            {
                Assert.EndsWith("-twitter-card.png", kvp.Value);
            }
        }

        // ========================================================================
        // C. GENERATED PNG FILES
        // ========================================================================

        [Fact]
        public void GeneratedPngFiles_AllExist()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            foreach (var kvp in mapping)
            {
                var pngPath = Path.Combine(CardDir, kvp.Value);
                Assert.True(File.Exists(pngPath), $"PNG file not found for '{kvp.Key}': {kvp.Value}");
            }
        }

        [Fact]
        public void GeneratedPngFiles_AreNonEmpty()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            foreach (var kvp in mapping)
            {
                var pngPath = Path.Combine(CardDir, kvp.Value);
                var fileInfo = new FileInfo(pngPath);
                Assert.True(fileInfo.Length > 1024, $"PNG file for '{kvp.Key}' is too small ({fileInfo.Length} bytes): {kvp.Value}");
            }
        }

        [Fact]
        public void GeneratedPngFiles_HaveValidPngHeader()
        {
            var json = File.ReadAllText(MappingPath);
            var mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);

            Assert.NotNull(mapping);
            var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

            foreach (var kvp in mapping)
            {
                var pngPath = Path.Combine(CardDir, kvp.Value);
                var bytes = File.ReadAllBytes(pngPath);
                Assert.True(bytes.Length >= 8, $"PNG file for '{kvp.Key}' is too short");

                for (var i = 0; i < 8; i++)
                {
                    Assert.Equal(pngHeader[i], bytes[i]);
                }
            }
        }

        [Fact]
        public void CardGenerator_DoesNotLeaveTemporarySvgs()
        {
            var temporaryFiles = Directory.EnumerateFiles(CardDir, ".tmp-*", SearchOption.TopDirectoryOnly);

            Assert.Empty(temporaryFiles);
        }

        // ========================================================================
        // D. GENERATOR TOOL BUILD
        // ========================================================================

        [Fact]
        public void TwitterCardGenerator_ProjectExists()
        {
            var projectPath = Path.Combine(ProjectRoot, "tools", "TwitterCardGenerator", "TwitterCardGenerator.csproj");
            Assert.True(File.Exists(projectPath), "TwitterCardGenerator.csproj not found");
        }

        [Fact]
        public void TwitterCardGenerator_ProgramExists()
        {
            var programPath = Path.Combine(ProjectRoot, "tools", "TwitterCardGenerator", "Program.cs");
            Assert.True(File.Exists(programPath), "Program.cs not found");
        }
    }
}
