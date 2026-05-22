using System.Diagnostics;

namespace VVG.Web.Tests.Integration
{
    public class BuildTests
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
            process.WaitForExit();

            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();

            Assert.True(process.ExitCode == 0, "Build failed:" + Environment.NewLine + error + Environment.NewLine + output);
        }

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

        [Fact]
        public void JSONL_Dataset_Accessible_From_Web()
        {
            var jsonlPath = Path.Combine(ProjectRoot, "..", "_WebUI-related-folders-and-files", "scripts", "vikas-dataset-augmented.jsonl");
            Assert.True(File.Exists(jsonlPath), "JSONL dataset not found: " + jsonlPath);

            var lines = File.ReadAllLines(jsonlPath);
            var nonEmptyLines = lines.Where(l => !string.IsNullOrWhiteSpace(l)).ToArray();
            Assert.True(nonEmptyLines.Length >= 700, "Expected 700+ Q&A entries, found " + nonEmptyLines.Length);
        }

        [Fact]
        public void ServiceWorker_Exists()
        {
            var wwwroot = Path.Combine(ProjectRoot, "src", "wwwroot");
            var swPublished = Path.Combine(wwwroot, "service-worker.published.js");
            var swDev = Path.Combine(wwwroot, "service-worker.js");

            Assert.True(File.Exists(swPublished) || File.Exists(swDev),
                "Service worker file not found");
        }

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

        [Fact]
        public void ONNX_Model_Size_Suitable_For_Web_Delivery()
        {
            var modelPath = Path.Combine(ProjectRoot, "src", "wwwroot", "assets", "models", "intent-classifier.onnx");
            var fileInfo = new FileInfo(modelPath);
            var sizeInMB = fileInfo.Length / (1024.0 * 1024.0);

            Assert.True(sizeInMB < 100, "Model too large for web: " + sizeInMB.ToString("F1") + " MB");
            Assert.True(sizeInMB > 10, "Model suspiciously small: " + sizeInMB.ToString("F1") + " MB");
        }

        [Fact]
        public void Solution_Contains_Test_Project()
        {
            var slnPath = Path.Combine(ProjectRoot, "test.vvgonline.net.sln");
            var slnContent = File.ReadAllText(slnPath);
            Assert.Contains("VVG.Web.Tests", slnContent);
        }
    }
}