/// <summary>
/// Validates the ONNX AI model assets and dataset files that power the
/// Vikas AI chatbot. These tests do NOT run inference — they only check
/// that the required files exist, have sensible sizes, and are well-formed.
///
/// What gets checked:
///   - ONNX model (intent-classifier.onnx) exists, isn't empty, is < 100 MB
///   - Intent labels JSON is valid and contains all expected categories
///   - JSONL Q&A dataset has 700+ valid entries with user/assistant pairs
///   - Backup JSONL file exists and matches the original
///   - chat.js references the correct model and dataset paths
/// </summary>
using System.Text.Json;

namespace VVG.Web.Tests.AssetValidation
{
    public class OnnxModelTests
    {
        // The wwwroot folder under src/ where static assets live
        private static readonly string WebRoot = Path.Combine(GetProjectRoot(), "src", "wwwroot");
        // Scripts directory inside wwwroot
        private static readonly string ScriptsDir = Path.Combine(WebRoot, "scripts");

        /// <summary>
        /// Walks up from the test assembly's output directory to find the
        /// project root (the folder that contains src/).
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

        /// <summary>Ensures the ONNX model file exists at the expected path.</summary>
        [Fact]
        public void ONNX_Model_Exists_At_Expected_Path()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            Assert.True(File.Exists(modelPath), "ONNX model not found at: " + modelPath);
        }

        /// <summary>The model must be between 0 and 100 MB — anything outside
        /// this range indicates a corrupted or missing download.</summary>
        [Fact]
        public void ONNX_Model_Size_Within_Limits()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            var fileInfo = new FileInfo(modelPath);
            var sizeInMB = fileInfo.Length / (1024.0 * 1024.0);
            Assert.True(sizeInMB > 0, "ONNX model file is empty");
            Assert.True(sizeInMB < 100, "ONNX model too large: " + sizeInMB.ToString("F1") + " MB (limit: 100 MB)");
        }

        /// <summary>A valid ONNX model must contain more than 1000 bytes of data.</summary>
        [Fact]
        public void ONNX_Model_Is_Not_Empty()
        {
            var modelPath = Path.Combine(WebRoot, "assets", "models", "intent-classifier.onnx");
            var bytes = File.ReadAllBytes(modelPath);
            Assert.True(bytes.Length > 1000, "ONNX model file is too small to be valid");
        }

        /// <summary>
        /// Validates intent-labels.json: must contain "labels" and "num_labels"
        /// properties that agree with each other, and include all 7 expected
        /// intent categories used by the chatbot.
        /// </summary>
        [Fact]
        public void Intent_Labels_Json_Valid()
        {
            var labelsPath = Path.Combine(WebRoot, "assets", "models", "intent-labels.json");
            Assert.True(File.Exists(labelsPath), "Labels file not found at: " + labelsPath);

            var json = File.ReadAllText(labelsPath);
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Support both flat format {"0": "capability_building", ...}
            // and wrapped format {"labels": {...}, "num_labels": 7}
            var labels = root.TryGetProperty("labels", out var labelsProp) ? labelsProp : root;
            var numLabels = root.TryGetProperty("num_labels", out var numLabelsProp)
                ? numLabelsProp.GetInt32()
                : labels.EnumerateObject().Count();

            var labelCount = labels.EnumerateObject().Count();
            Assert.Equal(numLabels, labelCount);

            // The 7 intent categories the chatbot knows about
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

        /// <summary>
        /// Validates the JSONL Q&A dataset: 700+ entries, each with at least
        /// one user message and one assistant message, no empty content.
        /// This dataset is the fallback when the ONNX model can't download.
        /// </summary>
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

                // Every entry must have a "messages" array with at least 2 items
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

        /// <summary>The backup file must exist and have the same byte count as the original.</summary>
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

        /// <summary>
        /// chat.js must reference the ONNX model, JSONL dataset, and contain
        /// the key functions that C# calls via JS interop.
        /// </summary>
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