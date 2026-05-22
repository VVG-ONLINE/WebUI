namespace VVG.Web.Tests.JSInterop
{
    public class ChatJsInteropTests
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

        private static string GetChatJsContent()
        {
            return File.ReadAllText(Path.Combine(GetProjectRoot(), "src", "wwwroot", "assets", "js", "chat.js"));
        }

        [Fact]
        public void ChatJS_Module_Exists_In_WwwRoot()
        {
            var chatJsPath = Path.Combine(GetProjectRoot(), "src", "wwwroot", "assets", "js", "chat.js");
            Assert.True(File.Exists(chatJsPath));
        }

        [Fact]
        public void ChatJS_Expose_Init_Method()
        {
            var content = GetChatJsContent();
            Assert.Contains("async init(", content);
            Assert.Contains("dotnetHelper", content);
        }

        [Fact]
        public void ChatJS_Expose_Generate_Method()
        {
            var content = GetChatJsContent();
            Assert.Contains("async generate(", content);
            Assert.Contains("messages", content);
        }

        [Fact]
        public void ChatJS_Calls_UpdateProgress_During_Init()
        {
            var content = GetChatJsContent();
            Assert.Contains("UpdateProgress", content);
        }

        [Fact]
        public void ChatJS_Calls_OnModelReady_When_Ready()
        {
            var content = GetChatJsContent();
            Assert.Contains("OnModelReady", content);
        }

        [Fact]
        public void ChatJS_Calls_OnSystemPromptReady_When_Ready()
        {
            var content = GetChatJsContent();
            Assert.Contains("OnSystemPromptReady", content);
        }

        [Fact]
        public void ChatJS_Uses_Intent_Classifier_Model()
        {
            var content = GetChatJsContent();
            Assert.Contains("intent-classifier.onnx", content);
        }

        [Fact]
        public void ChatJS_Implements_ClassifyIntent()
        {
            var content = GetChatJsContent();
            Assert.Contains("classifyIntent", content);
            Assert.Contains("this.session.run", content);
        }

        [Fact]
        public void ChatJS_Implements_FindRelevantQA()
        {
            var content = GetChatJsContent();
            Assert.Contains("findRelevantQA", content);
            Assert.Contains("this.qaData", content);
        }

        [Fact]
        public void ChatJS_Has_Fallback_Response()
        {
            var content = GetChatJsContent();
            Assert.Contains("getFallbackResponse", content);
        }

        [Fact]
        public void ChatJS_Loads_ONNX_Runtime_From_CDN()
        {
            var content = GetChatJsContent();
            Assert.Contains("onnxruntime-web", content);
            Assert.Contains("ort.min.js", content);
        }

        [Fact]
        public void ChatJS_Loads_QA_Data_From_Assets_Data_Path()
        {
            var content = GetChatJsContent();
            Assert.Contains("assets/data/vikas-dataset-augmented.jsonl", content);
        }
    }
}