/// <summary>
/// Integration/build-level tests that verify the project compiles correctly
/// and that all required static assets are present in the source tree.
///
/// These tests touch the real file system and run dotnet build as a
/// subprocess — they are NOT unit tests and can be slow.
/// </summary>
using System.Diagnostics;

namespace VVG.Web.Tests.Integration
{
    public class BuildTests
    {
        private static readonly string ProjectRoot = GetProjectRoot();

        /// <summary>
        /// Walks up from the test assembly's bin directory to find the
        /// project root (the folder containing src/).
        /// </summary>
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

        /// <summary>Runs dotnet build on the main project and asserts it succeeds.</summary>
        [Fact]
        public void Project_Builds_Successfully()
        {
            var psi = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = "build src/VVG.Web.csproj --no-restore -c Release",
                WorkingDirectory = ProjectRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            Assert.NotNull(process);
            process.WaitForExit();

            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();

            Assert.True(process.ExitCode == 0, "Build failed:" + Environment.NewLine + error + Environment.NewLine + output);
        }

        /// <summary>Verifies that critical static assets exist in wwwroot.</summary>
        [Fact]
        public void StaticAssets_Included_In_Build_Output()
        {
            var wwwroot = Path.Combine(ProjectRoot, "src", "wwwroot");

            var requiredAssets = new[]
            {
                Path.Combine(wwwroot, "assets", "models", "intent-classifier.onnx"),
                Path.Combine(wwwroot, "assets", "models", "intent-labels.json"),
                Path.Combine(wwwroot, "assets", "js", "chat.js"),
            };

            foreach (var asset in requiredAssets)
            {
                Assert.True(File.Exists(asset), "Required asset not found: " + asset);
            }
        }

        /// <summary>The JSONL dataset must have 700+ non-empty lines.</summary>
        [Fact]
        public void JSONL_Dataset_Accessible_From_Web()
        {
            var jsonlPath = Path.Combine(ProjectRoot, "..", "_WebUI-related-folders-and-files", "scripts", "vikas-dataset-augmented.jsonl");
            Assert.True(File.Exists(jsonlPath), "JSONL dataset not found: " + jsonlPath);

            var lines = File.ReadAllLines(jsonlPath);
            var nonEmptyLines = lines.Where(l => !string.IsNullOrWhiteSpace(l)).ToArray();
            Assert.True(nonEmptyLines.Length >= 700, "Expected 700+ Q&A entries, found " + nonEmptyLines.Length);
        }

        /// <summary>At least one service worker file must exist for PWA support.</summary>
        [Fact]
        public void ServiceWorker_Exists()
        {
            var wwwroot = Path.Combine(ProjectRoot, "src", "wwwroot");
            var swPublished = Path.Combine(wwwroot, "service-worker.published.js");
            var swDev = Path.Combine(wwwroot, "service-worker.js");

            Assert.True(File.Exists(swPublished) || File.Exists(swDev),
                "Service worker file not found");
        }

        /// <summary>
        /// Checks that the .csproj references all critical NuGet packages:
        /// Blazor WASM SDK, bUnit, xUnit, Moq, and the TransformersJS bridge.
        /// </summary>
        [Fact]
        public void All_Required_NuGet_Packages_Referenced()
        {
            var csprojPath = Path.Combine(ProjectRoot, "src", "VVG.Web.csproj");
            var csprojContent = File.ReadAllText(csprojPath);

            var requiredPackages = new[]
            {
                "Microsoft.AspNetCore.Components.WebAssembly",
                "bunit",
                "xunit",
                "Moq",
                "SpawnDev.BlazorJS.TransformersJS"
            };

            foreach (var package in requiredPackages)
            {
                Assert.Contains(package, csprojContent);
            }
        }

        /// <summary>
        /// The ONNX model must be between 10 MB and 100 MB for web delivery.
        /// Below 10 MB = probably corrupted; above 100 MB = too slow to download.
        /// </summary>
        [Fact]
        public void ONNX_Model_Size_Suitable_For_Web_Delivery()
        {
            var modelPath = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "models", "intent-classifier.onnx");
            var fileInfo = new FileInfo(modelPath);
            var sizeInMB = fileInfo.Length / (1024.0 * 1024.0);

            Assert.True(sizeInMB < 100, "Model too large for web: " + sizeInMB.ToString("F1") + " MB");
            Assert.True(sizeInMB > 10, "Model suspiciously small: " + sizeInMB.ToString("F1") + " MB");
        }

        /// <summary>The solution file must contain a reference to the test project.</summary>
        [Fact]
        public void Solution_Contains_Test_Project()
        {
            var slnPath = Path.Combine(ProjectRoot, "test.vvgonline.net.sln");
            var slnContent = File.ReadAllText(slnPath);
            Assert.Contains("VVG.Web.Tests", slnContent);
        }
    }
}