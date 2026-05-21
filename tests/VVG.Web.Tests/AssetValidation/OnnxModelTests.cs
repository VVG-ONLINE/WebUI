using System.Text.Json;

namespace VVG.Web.Tests.AssetValidation
{
    public class OnnxModelTests
    {
        private static readonly string WebRoot = Path.Combine(GetProjectRoot(), "src", "wwwroot");
        private static readonly string ScriptsDir = Path.Combine(GetProjectRoot(), "scripts");

        private static string GetProjectRoot()
        {
            var current = AppContext.BaseDirectory;
            while (!Directory.Exists(Path.Combine(current, "src")) ||
                   !Directory.Exists(Path.Combine(current, "scripts")))
            {
                var parent = Directory.GetParent(current);
                if (parent == null) throw new DirectoryNotFoundException("Could not find project root");
                current = parent.FullName;
            }
            return current;
        }

        [Fact]
        public void ONNX_Model_Exists_At_Expected_Path()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            Assert.True(File.Exists(modelPath), "ONNX model not found at: " + modelPath);
        }

        [Fact]
        public void ONNX_Model_Size_Within_Limits()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            var fileInfo = new FileInfo(modelPath);
            var sizeInMB = fileInfo.Length / (1024.0 * 1024.0);
            Assert.True(sizeInMB > 0, "ONNX model file is empty");
            Assert.True(sizeInMB < 100, "ONNX model too large: " + sizeInMB.ToString("F1") + " MB (limit: 100 MB)");
        }

        [Fact]
        public void ONNX_Model_Is_Not_Empty()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            var bytes = File.ReadAllBytes(modelPath);
            Assert.True(bytes.Length > 1000, "ONNX model file is too small to be valid");
        }

        [Fact]
        public void Intent_Labels_Json_Valid()
        {
            var labelsPath = Path.Combine(WebRoot, "assets", "models", "intent-labels.json");
            Assert.True(File.Exists(labelsPath), "Labels file not found at: " + labelsPath);

            var json = File.ReadAllText(labelsPath);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("labels", out var labels));
            Assert.True(root.TryGetProperty("num_labels", out var numLabels));

            var labelCount = labels.EnumerateObject().Count();
            Assert.Equal(numLabels.GetInt32(), labelCount);

            var expectedIntents = new[] {
                "capability_building", "design_thinking", "digital_marketing",
                "digital_transformation", "general", "it_management", "strategy_innovation"
            };

            foreach (var expected in expectedIntents)
            {
                var found = false;
                foreach (var prop in labels.EnumerateObject())
                {
                    if (prop.Value.GetString() == expected)
                    {
                        found = true;
                        break;
                    }
                }
                Assert.True(found, "Expected intent category not found: " + expected);
            }
        }

        [Fact]
        public void JSONL_Dataset_Valid()
        {
            var jsonlPath = Path.Combine(ScriptsDir, "vikas-dataset-augmented.jsonl");
            Assert.True(File.Exists(jsonlPath), "JSONL file not found at: " + jsonlPath);

            var lines = File.ReadAllLines(jsonlPath);
            Assert.True(lines.Length >= 700, "Expected at least 700 entries, found " + lines.Length);

            int validEntries = 0;
            foreach (var line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                var doc = JsonDocument.Parse(line);
                var root = doc.RootElement;

                Assert.True(root.TryGetProperty("messages", out var messages));
                Assert.True(messages.GetArrayLength() >= 2, "Each entry must have at least 2 messages");

                var hasUser = false;
                var hasAssistant = false;
                foreach (var msg in messages.EnumerateArray())
                {
                    var role = msg.GetProperty("role").GetString();
                    var content = msg.GetProperty("content").GetString();
                    Assert.False(string.IsNullOrEmpty(content), "Message content cannot be empty");

                    if (role == "user") hasUser = true;
                    if (role == "assistant") hasAssistant = true;
                }

                Assert.True(hasUser, "Entry must have a user message");
                Assert.True(hasAssistant, "Entry must have an assistant message");
                validEntries++;
            }

            Assert.True(validEntries >= 700, "Expected at least 700 valid entries, found " + validEntries);
        }

        [Fact]
        public void JSONL_Backup_Exists()
        {
            var originalPath = Path.Combine(ScriptsDir, "vikas-dataset-augmented.jsonl");
            var backupPath = Path.Combine(ScriptsDir, "vikas-dataset-augmented.jsonl.bak");

            Assert.True(File.Exists(backupPath), "Backup file not found at: " + backupPath);

            var originalBytes = File.ReadAllBytes(originalPath);
            var backupBytes = File.ReadAllBytes(backupPath);
            Assert.Equal(originalBytes.Length, backupBytes.Length);
        }

        [Fact]
        public void Chat_JS_Exists()
        {
            var chatJsPath = Path.Combine(WebRoot, "assets", "js", "chat.js");
            Assert.True(File.Exists(chatJsPath), "chat.js not found at: " + chatJsPath);

            var content = File.ReadAllText(chatJsPath);
            Assert.Contains("intent-classifier.onnx", content);
            Assert.Contains("vikas-dataset-augmented.jsonl", content);
            Assert.Contains("classifyIntent", content);
            Assert.Contains("findRelevantQA", content);
        }
    }
}