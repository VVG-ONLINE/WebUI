using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.IO;

namespace VVG.Web.Layout
{
    public partial class MainLayout : LayoutComponentBase, IAsyncDisposable
    {
        [Inject] private IJSRuntime JS { get; set; } = null!;
        [Inject] private Services.ThemeService ThemeService { get; set; } = null!;
        [Inject] private HttpClient Http { get; set; } = null!;

        private ElementReference mainLayoutDiv;
        private DotNetObjectReference<MainLayout>? _dotNetHelper;

        public bool isTerminalOpen = false;
        private List<ChatMessage> _chatHistory = new();
        private string _userInput = "";
        private bool _isModelLoading = true;
        private string _systemPrompt = "";
        private string _knowledgeBaseContext = "";
        private const int MaxHistory = 10; // Keep the last 10 messages

        protected override async Task OnInitializedAsync()
        {
            _dotNetHelper = DotNetObjectReference.Create(this);
            await ThemeService.InitializeThemeAsync();
            
            // Add only ONE initial message
            _chatHistory.Add(new ChatMessage { Role = "assistant", Content = "// Connecting to VIKAS AI Agent..." });

            // Start both tasks concurrently
            var knowledgeBaseTask = LoadKnowledgeBase();
            var initTask = InitializeChat();

            await Task.WhenAll(knowledgeBaseTask, initTask);

            // REMOVED duplicate messages - they're now added only in OnModelReady()
        }

        private async Task InitializeChat()
        {
            try
            {
                // Pass the DotNetObjectReference to JavaScript
                await JS.InvokeVoidAsync("transformersChat.init", _dotNetHelper);
            }
            catch (Exception ex)
            {
                UpdateProgress($"// Error: {ex.Message}");
            }
        }

        private async Task LoadKnowledgeBase()
        {
            _systemPrompt = "You are Vikas, a helpful AI assistant for VVG Online. Answer questions based ONLY on the provided context. Be concise and helpful.";

            var sb = new StringBuilder();
            sb.AppendLine("=== VVG ONLINE KNOWLEDGE BASE ===\n");
            
            try
            {
                // Load manifest
                var manifestJson = await Http.GetStringAsync("data/dataset-manifest.json");
                var manifest = JsonSerializer.Deserialize<DatasetManifest>(manifestJson);
                
                Console.WriteLine($"Loading manifest version {manifest?.Version}");
                
                if (manifest?.Files != null)
                {
                    // Load all markdown files
                    sb.AppendLine("--- BLOG POSTS ---");
                    foreach (var path in manifest.Files.Markdown)
                    {
                        await LoadFile(sb, path, "markdown", 800);
                    }
                    
                    // Load all JSON files
                    sb.AppendLine("\n--- SERVICES ---");
                    foreach (var path in manifest.Files.Json)
                    {
                        await LoadFile(sb, path, "json", 500);
                    }
                    
                    // Load all CSV files
                    sb.AppendLine("\n--- KNOWLEDGE DATA ---");
                    foreach (var path in manifest.Files.Csv)
                    {
                        await LoadFile(sb, path, "csv", 500);
                    }
                    
                    // Load all TXT files
                    sb.AppendLine("\n--- DOCUMENTATION ---");
                    foreach (var path in manifest.Files.Txt)
                    {
                        await LoadFile(sb, path, "txt", 500);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading knowledge base: {ex.Message}");
                
                // Fallback to old method if manifest not found
                await LoadKnowledgeBaseFallback(sb);
            }
            
            sb.AppendLine("\n=== END KNOWLEDGE BASE ===");
            _knowledgeBaseContext = sb.ToString();
            
            Console.WriteLine($"Knowledge base loaded: {_knowledgeBaseContext.Length} characters");
        }

        private async Task LoadFile(StringBuilder sb, string path, string type, int maxChars = 1000)
        {
            try
            {
                var content = await Http.GetStringAsync(path);
                var fileName = Path.GetFileName(path);
                
                sb.AppendLine($"\n## {fileName}");
                
                // Limit content size for performance
                if (content.Length > maxChars)
                {
                    // For markdown, try to get first complete section
                    if (type == "markdown")
                    {
                        var lines = content.Split('\n');
                        var truncated = new StringBuilder();
                        int chars = 0;
                        
                        foreach (var line in lines)
                        {
                            if (chars + line.Length > maxChars) break;
                            truncated.AppendLine(line);
                            chars += line.Length;
                        }
                        content = truncated.ToString();
                    }
                    else
                    {
                        content = content.Substring(0, maxChars) + "...";
                    }
                }
                
                sb.AppendLine(content);
                Console.WriteLine($"Loaded: {fileName} ({content.Length} chars)");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load {path}: {ex.Message}");
                sb.AppendLine($"[File not found: {Path.GetFileName(path)}]");
            }
        }

        // Fallback if manifest doesn't exist
        private async Task LoadKnowledgeBaseFallback(StringBuilder sb)
        {
            var blogFiles = new[]
            {
                "Communication-Mastery-for-Digital-Business-Success.md",
                "Digital-Assets-The-Real-Estate-of-the-Virtual-World.md",
                "Don-t-Normalize-Common-Things-A-Philosophy-for-Business-Excellence.md",
                "GST-Rate-Deductions-for-E-commerce-A-Complete-Guide-by-VVG-ONLINE.md",
                "Key-Performance-Indicators-KPIs.md",
                "Operating-Model-Design.md",
                "The-Digital-Marketing-Investment-Imperative.md"
            };

            sb.AppendLine("--- BLOG POSTS (FALLBACK) ---");
            
            foreach (var file in blogFiles)
            {
                try
                {
                    var content = await Http.GetStringAsync($"assets/data/blogs/{file}");
                    
                    // Only take first 500 chars
                    var summary = content.Length > 500 ? content.Substring(0, 500) : content;
                    
                    sb.AppendLine($"\n## {file.Replace(".md", "").Replace("-", " ")}");
                    sb.AppendLine(summary);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error loading {file}: {ex.Message}");
                }
            }
        }

        private async Task HandleTerminalInput(KeyboardEventArgs e)
        {
            if (e.Key != "Enter" || string.IsNullOrWhiteSpace(_userInput)) return;

            var userMessageText = _userInput;
            _chatHistory.Add(new ChatMessage { Role = "user", Content = userMessageText });
            _userInput = "";
            StateHasChanged();
            await ScrollToBottom();

            // Construct the message list to send to JS
            var messagesForJs = new List<JsChatMessage>
            {
                new() { Role = "system", Content = $"{_systemPrompt}\n{_knowledgeBaseContext}" }
            };

            // Add recent history
            messagesForJs.AddRange(_chatHistory
                .Where(m => m.Role != "system") // Don't duplicate system prompt
                .TakeLast(MaxHistory)
                .Select(m => new JsChatMessage { Role = m.Role, Content = m.Content }));

            var response = await JS.InvokeAsync<string>("transformersChat.generate", messagesForJs);

            _chatHistory.Add(new ChatMessage { Role = "assistant", Content = response });
            StateHasChanged();
            await ScrollToBottom();
        }

        private async Task ScrollToBottom()
        {
            try
            {
                await JS.InvokeVoidAsync("eval", "document.getElementById('chat-output').scrollTop = document.getElementById('chat-output').scrollHeight");
            }
            catch (JSException) { /* Bury JS exceptions if element is not ready */ }
        }

        public void ToggleTerminal() => isTerminalOpen = !isTerminalOpen;

        public void HandleKeyDown(KeyboardEventArgs e)
        {
            if (e.Key == "F10") ToggleTerminal();
        }

        public async ValueTask DisposeAsync() 
        {
            _dotNetHelper?.Dispose();
        }

        // Used for UI binding
        public class ChatMessage
        {
            public string Role { get; set; } = "";
            public string Content { get; set; } = "";
        }

        // Used for JS interop serialization
        public class JsChatMessage
        {
            public string Role { get; set; } = "";
            public string Content { get; set; } = "";
        }

        // Dataset manifest models
        public class DatasetManifest
        {
            [JsonPropertyName("version")]
            public string Version { get; set; } = "";
            
            [JsonPropertyName("lastUpdated")]
            public string LastUpdated { get; set; } = "";
            
            [JsonPropertyName("files")]
            public FileManifest Files { get; set; } = new();
        }

        public class FileManifest
        {
            [JsonPropertyName("markdown")]
            public List<string> Markdown { get; set; } = new();
            
            [JsonPropertyName("json")]
            public List<string> Json { get; set; } = new();
            
            [JsonPropertyName("csv")]
            public List<string> Csv { get; set; } = new();
            
            [JsonPropertyName("txt")]
            public List<string> Txt { get; set; } = new();
        }

        // JSInvokable methods
        [JSInvokable]
        public void UpdateProgress(string message)
        {
            // Update the last system message or add new one
            if (_chatHistory.Count > 0 && _chatHistory.Last().Role == "assistant")
            {
                _chatHistory.Last().Content = message;
            }
            else
            {
                _chatHistory.Add(new ChatMessage { Role = "assistant", Content = message });
            }
            StateHasChanged();
        }

        [JSInvokable]
        public void OnModelReady()
        {
            _isModelLoading = false;
            
            // Clear loading message
            _chatHistory.RemoveAll(m => m.Content.Contains("Connecting"));
            
            // Add ready messages only once (fixes duplicate issue)
            _chatHistory.Add(new ChatMessage { Role = "assistant", Content = "// SECURE CONNECTION ESTABLISHED." });
            _chatHistory.Add(new ChatMessage { Role = "assistant", Content = "// AGENT READY. HOW CAN I ASSIST YOU?" });
            StateHasChanged();
        }

        [JSInvokable]
        public void OnSystemPromptReady(string prompt)
        {
            _systemPrompt = prompt;
            Console.WriteLine("System prompt received from JavaScript.");
            StateHasChanged();
        }
    }
}
