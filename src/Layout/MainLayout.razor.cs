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
    /// <summary>
    /// Code-behind for MainLayout — the shell that wraps every page.
    /// Handles the AI chat pipeline, knowledge base loading, and
    /// communication between Blazor (C#) and JavaScript (ONNX model).
    /// 
    /// The hero terminal is rendered in HeroBanner.razor and uses
    /// CascadingValue to access this layout's state.
    /// </summary>
    public partial class MainLayout : LayoutComponentBase, IAsyncDisposable
    {
        // ── Injected services (provided by Program.cs DI container) ──
        [Inject] private IJSRuntime JS { get; set; } = null!;
        [Inject] private Services.ThemeService ThemeService { get; set; } = null!;
        [Inject] private HttpClient Http { get; set; } = null!;

        // ── Fields ──

        // A .NET object reference sent to JavaScript so JS can call C# methods
        private DotNetObjectReference<MainLayout>? _dotNetHelper;

        // Whether the AI chat is online (model loaded)
        public bool IsChatOnline { get; private set; } = false;

        // Whether the ONNX model is still downloading / warming up
        public bool IsModelLoading { get; private set; } = true;

        // List of all messages in the chat (assistant, user, system)
        private List<ChatMessage> _chatHistory = new();

        // Exposed as read-only for HeroBanner
        public IReadOnlyList<ChatMessage> ChatHistory => _chatHistory;

        // The system-level instruction given to the AI model
        private string _systemPrompt = "";

        // All knowledge base content (blogs, services, docs) concatenated
        private string _knowledgeBaseContext = "";

        // Only send the last 10 messages to keep the context window small
        private const int MaxHistory = 10;

        // ── Lifecycle: runs once when the layout first loads ──
        protected override async Task OnInitializedAsync()
        {
            // Create a reference that JavaScript can use to call back into C#
            _dotNetHelper = DotNetObjectReference.Create(this);

            // Restore the saved theme (light/dark) from browser storage
            await ThemeService.InitializeThemeAsync();

            // Add the very first message the user sees
            _chatHistory.Add(new ChatMessage
            {
                Role = "assistant",
                Content = "// Connecting to VIKAS AI Agent..."
            });

            // Fire both long-running tasks at the same time:
            // 1. Load all knowledge base files (blogs, services, docs)
            // 2. Start downloading and initialising the ONNX model in JavaScript
            var knowledgeBaseTask = LoadKnowledgeBase();
            var initTask = InitializeChat();

            await Task.WhenAll(knowledgeBaseTask, initTask);
        }

        // ── Chat initialisation ──

        /// <summary>
        /// Tells the JavaScript AI engine to start downloading the ONNX model
        /// and set up the chat pipeline. The _dotNetHelper lets JS call back
        /// into C# methods marked with [JSInvokable].
        /// </summary>
        private async Task InitializeChat()
        {
            try
            {
                for (int i = 0; i < 100; i++)
                {
                    var ready = await JS.InvokeAsync<bool>("eval",
                        "typeof transformersChat !== 'undefined' && typeof transformersChat.init === 'function'");
                    if (ready) break;
                    await Task.Delay(100);
                }
                await JS.InvokeVoidAsync("transformersChat.init", _dotNetHelper);
            }
            catch (Exception ex)
            {
                UpdateProgress($"// Error: {ex.Message}");
                OnModelReady();
                OnChatOnline();
            }
        }

        // ── Knowledge base loading ──

        /// <summary>
        /// Reads every knowledge-base file listed in the dataset manifest
        /// and builds one big text blob that is sent to the AI as context.
        /// The manifest lives at wwwroot/assets/data/dataset-manifest.json.
        /// </summary>
        private async Task LoadKnowledgeBase()
        {
            // Base system instruction — the model is told to stick to these facts
            _systemPrompt = "You are Vikas, a helpful AI assistant for VVG Online. " +
                           "Answer questions based ONLY on the provided context. " +
                           "Be concise and helpful.";

            var sb = new StringBuilder();
            sb.AppendLine("=== VVG ONLINE KNOWLEDGE BASE ===\n");

            try
            {
                // Fetch the manifest that lists every knowledge-base file
                var manifestJson = await Http.GetStringAsync(
                    "assets/data/dataset-manifest.json");
                var manifest = JsonSerializer.Deserialize<DatasetManifest>(manifestJson);

                Console.WriteLine($"Loading manifest version {manifest?.Version}");

                if (manifest?.Files != null)
                {
                    // Append each category of file, with a hard limit per file
                    // so the prompt doesn't grow too large for the model

                    sb.AppendLine("--- BLOG POSTS ---");
                    foreach (var path in manifest.Files.Markdown)
                        await LoadFile(sb, path, "markdown", 800);

                    sb.AppendLine("\n--- SERVICES ---");
                    foreach (var path in manifest.Files.Json)
                        await LoadFile(sb, path, "json", 500);

                    sb.AppendLine("\n--- KNOWLEDGE DATA ---");
                    foreach (var path in manifest.Files.Csv)
                        await LoadFile(sb, path, "csv", 500);

                    sb.AppendLine("\n--- DOCUMENTATION ---");
                    foreach (var path in manifest.Files.Txt)
                        await LoadFile(sb, path, "txt", 500);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading knowledge base: {ex.Message}");

                // If the manifest or any file is missing, try the hard-coded fallback
                await LoadKnowledgeBaseFallback(sb);
            }

            sb.AppendLine("\n=== END KNOWLEDGE BASE ===");
            _knowledgeBaseContext = sb.ToString();

            Console.WriteLine(
                $"Knowledge base loaded: {_knowledgeBaseContext.Length} characters");
        }

        /// <summary>
        /// Fetches a single knowledge-base file from the web server and appends
        /// its contents to the StringBuilder. Stops after maxChars to keep the
        /// prompt size under control.
        /// </summary>
        private async Task LoadFile(
            StringBuilder sb, string path, string type, int maxChars = 1000)
        {
            try
            {
                var content = await Http.GetStringAsync(path);
                var fileName = Path.GetFileName(path);

                sb.AppendLine($"\n## {fileName}");

                if (content.Length > maxChars)
                {
                    // For markdown files, stop at a clean line break so we don't
                    // cut a sentence in half
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

        /// <summary>
        /// Fallback knowledge base — used when the dataset-manifest.json is
        /// missing or corrupted. Loads a hard-coded list of blog posts.
        /// </summary>
        private async Task LoadKnowledgeBaseFallback(StringBuilder sb)
        {
            var blogFiles = new[]
            {
                "Communication-Mastery-for-Digital-Business-Success.md",
                "Digital-Assets-The-Real-Estate-of-the-Virtual-World.md",
                "Dont-normalize-common-things-a-philosophy-for-business-excellence.md",
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
                    var content = await Http.GetStringAsync(
                        $"assets/data/blogs/{file}");

                    // Only take the first 500 characters of each blog
                    var summary = content.Length > 500
                        ? content.Substring(0, 500)
                        : content;

                    sb.AppendLine(
                        $"\n## {file.Replace(".md", "").Replace("-", " ")}");
                    sb.AppendLine(summary);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error loading {file}: {ex.Message}");
                }
            }
        }

        // ── Public API for HeroBanner ──

        /// <summary>
        /// Called by HeroBanner when the user submits a message.
        /// Adds the user message to history, sends it to the ONNX model,
        /// and adds the assistant response.
        /// </summary>
        public async Task<string?> SendMessage(string userText)
        {
            if (string.IsNullOrWhiteSpace(userText)) return null;

            // 1. Save the user's message
            _chatHistory.Add(new ChatMessage
            {
                Role = "user",
                Content = userText
            });

            // 2. Build the message list JavaScript needs
            var messagesForJs = new List<JsChatMessage>
            {
                // First message: system prompt + knowledge base = AI context
                new()
                {
                    Role = "system",
                    Content = $"{_systemPrompt}\n{_knowledgeBaseContext}"
                }
            };

            // Then: the last 10 user/assistant messages (skips system duplicates)
            messagesForJs.AddRange(_chatHistory
                .Where(m => m.Role != "system")
                .TakeLast(MaxHistory)
                .Select(m => new JsChatMessage
                {
                    Role = m.Role,
                    Content = m.Content
                }));

            // 3. Send to JavaScript and wait for the model's reply
            var response = await JS.InvokeAsync<string>(
                "transformersChat.generate", messagesForJs);

            // 4. Add the AI's response to the chat log
            _chatHistory.Add(new ChatMessage
            {
                Role = "assistant",
                Content = response ?? ""
            });

            StateHasChanged();

            return response;
        }

        // ── Terminal toggling ──

        /// <summary>
        /// Clean up the .NET object reference when the layout is destroyed,
        /// so JavaScript doesn't try to call a dead C# object.
        /// </summary>
        public async ValueTask DisposeAsync()
        {
            _dotNetHelper?.Dispose();
        }

        // ═══════════════════════════════════════════════════════════════
        //  INNER CLASSES — data structures used by this component
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// A single chat message shown in the terminal UI.
        /// Role can be "user", "assistant", or "system".
        /// </summary>
        public class ChatMessage
        {
            public string Role { get; set; } = "";
            public string Content { get; set; } = "";
        }

        /// <summary>
        /// A lightweight version of ChatMessage used for JSON serialisation
        /// when sending messages to JavaScript. The system message is packed
        /// into a single entry with all knowledge base content.
        /// </summary>
        public class JsChatMessage
        {
            public string Role { get; set; } = "";
            public string Content { get; set; } = "";
        }

        // ── Dataset manifest models ──
        // These mirror the structure of wwwroot/assets/data/dataset-manifest.json

        public class DatasetManifest
        {
            [JsonPropertyName("version")]
            public string Version { get; set; } = "";

            [JsonPropertyName("lastUpdated")]
            public string LastUpdated { get; set; } = "";

            [JsonPropertyName("files")]
            public FileManifest Files { get; set; } = new();
        }

        /// <summary>
        /// Holds four lists of file paths — one for each type of knowledge
        /// base file the AI can read.
        /// </summary>
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

        // ═══════════════════════════════════════════════════════════════
        //  JSInvokable METHODS
        //  Methods JavaScript calls via DotNetObjectReference
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Called by JavaScript to show progress messages while the ONNX model
        /// is downloading or loading. Updates the last assistant message or
        /// adds a new one.
        /// </summary>
        [JSInvokable]
        public void UpdateProgress(string message)
        {
            if (!message.StartsWith("//"))
                message = $"// {message}";

            if (_chatHistory.Count > 0 && _chatHistory.Last().Role == "assistant")
            {
                // Replace the last progress line instead of stacking messages
                _chatHistory.Last().Content = message;
            }
            else
            {
                _chatHistory.Add(new ChatMessage
                {
                    Role = "assistant",
                    Content = message
                });
            }
            StateHasChanged();
        }

        [JSInvokable]
        public void OnChatOnline()
        {
            IsChatOnline = true;
            StateHasChanged();
        }

        /// <summary>
        /// Called by JavaScript once the ONNX model has finished loading.
        /// Clears the "Connecting..." placeholder and shows the ready prompt.
        /// </summary>
        [JSInvokable]
        public void OnModelReady()
        {
            IsModelLoading = false;

            // Remove all loading/connecting placeholder messages
            _chatHistory.RemoveAll(m => m.Content.Contains("Connecting"));

            // Show the ready prompt
            _chatHistory.Add(new ChatMessage
            {
                Role = "assistant",
                Content = "// SECURE CONNECTION ESTABLISHED."
            });
            _chatHistory.Add(new ChatMessage
            {
                Role = "assistant",
                Content = "// AGENT READY. HOW CAN I ASSIST YOU?"
            });
            StateHasChanged();
        }

        /// <summary>
        /// Called by JavaScript when the system prompt has been generated
        /// on the JS side. Overrides the C# default prompt.
        /// </summary>
        [JSInvokable]
        public void OnSystemPromptReady(string prompt)
        {
            _systemPrompt = prompt;
            Console.WriteLine("System prompt received from JavaScript.");
            StateHasChanged();
        }
    }
}
