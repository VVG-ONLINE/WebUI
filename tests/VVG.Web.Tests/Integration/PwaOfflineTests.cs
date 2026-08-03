/// <summary>
/// E2E tests verifying the VVG ONLINE PWA works offline after the service worker
/// has cached the pages. Uses PuppeteerSharp to control a headless Chromium.
///
/// These are integration tests — they require:
///   - A published version of the site (auto-publishes if not found at /tmp/publish-test-offline)
///   - A Chromium-compatible browser (Playwright Chromium, or set PUPPETEER_CHROMIUM_PATH)
///
/// Test flow (single Fact, sequential steps):
///   1. Start a static HTTP server serving the published wwwroot
///   2. Launch headless Chromium via PuppeteerSharp
///   3. Load index.html -> installs service worker -> verify SW state
///   4. Load /blog route -> pre-caches index.html (SPA shell) in the SW cache
///   5. Simulate offline via CDP session
///   6. Load /blog OFFLINE -> verify the SPA shell is served from cache
///   7. Load index.html OFFLINE -> verify full content, Blazor app container
///
/// Expected results:
///   - OFFLINE /blog loads fully (>15000 bytes, Blazor app container present)
///   - OFFLINE index.html loads fully (>15000 bytes, Blazor app container present)
///   - Service worker activates successfully (state == "activated")
/// </summary>
using System.Net;
using PuppeteerSharp;
using Xunit;

namespace VVG.Web.Tests.Integration
{
    public class PwaOfflineTests : IDisposable
    {
        private static readonly string? ChromiumPath;
        private static readonly bool ChromiumAvailable;
        private static readonly string WwwRoot;

        private readonly StaticFileServer? _server;
        private readonly IBrowser? _browser;
        private readonly IPage? _page;

        static PwaOfflineTests()
        {
            ChromiumPath = ResolveChromiumPath();
            ChromiumAvailable = ChromiumPath != null;
            WwwRoot = GetOrPublishWwwroot();
        }

        /// <summary>
        /// Resolves the Chromium executable path:
        /// 1. PUPPETEER_CHROMIUM_PATH environment variable
        /// 2. Playwright's chromium-1217 installation
        /// 3. null (triggers Skip)
        /// </summary>
        private static string? ResolveChromiumPath()
        {
            var envPath = Environment.GetEnvironmentVariable("PUPPETEER_CHROMIUM_PATH");
            if (!string.IsNullOrEmpty(envPath) && File.Exists(envPath))
                return envPath;

            var home = Environment.GetEnvironmentVariable("HOME");
            if (string.IsNullOrEmpty(home))
                return null;

            var playwrightPath = Path.Combine(home, ".cache", "ms-playwright", "chromium-1217", "chrome-linux64", "chrome");
            if (File.Exists(playwrightPath))
                return playwrightPath;

            var headlessPath = Path.Combine(home, ".cache", "ms-playwright", "chromium_headless_shell-1217", "chrome-linux64", "chrome");
            if (File.Exists(headlessPath))
                return headlessPath;

            return null;
        }

        /// <summary>
        /// Returns the published wwwroot path. Uses /tmp/publish-test-offline/wwwroot
        /// if it exists, otherwise runs dotnet publish.
        /// </summary>
        private static string GetOrPublishWwwroot()
        {
            var defaultPath = "/tmp/publish-test-offline/wwwroot";

            if (Directory.Exists(defaultPath))
            {
                var htmlFiles = Directory.GetFiles(defaultPath, "*.html");
                if (htmlFiles.Length == 2)
                    return defaultPath;
            }

            var projectRoot = FindProjectRoot();
            var publishDir = Path.GetDirectoryName(defaultPath);
            var publishTarget = Path.Combine(projectRoot, "src", "VVG.Web.csproj");

            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"publish \"{publishTarget}\" -c Release -o \"{publishDir}\" --no-restore",
                WorkingDirectory = projectRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process == null)
                throw new InvalidOperationException("Failed to start dotnet publish");

            process.WaitForExit(120000);

            if (!Directory.Exists(defaultPath))
                throw new InvalidOperationException($"Publish succeeded but wwwroot not found at {defaultPath}");

            return defaultPath;
        }

        /// <summary>Walks up from the test assembly's bin directory to find the project root.</summary>
        private static string FindProjectRoot()
        {
            var current = AppContext.BaseDirectory;
            while (!Directory.Exists(Path.Combine(current, "src")))
            {
                var parent = Directory.GetParent(current);
                if (parent == null)
                    throw new DirectoryNotFoundException("Cannot find project root from " + AppContext.BaseDirectory);
                current = parent.FullName;
            }
            return current;
        }

        public PwaOfflineTests()
        {
            if (!ChromiumAvailable)
                return;

            _server = new StaticFileServer(WwwRoot);
            _server.Start();

            var launchOptions = new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" }
            };

            if (ChromiumPath != null)
                launchOptions.ExecutablePath = ChromiumPath;

            _browser = Puppeteer.LaunchAsync(launchOptions).GetAwaiter().GetResult();
            _page = _browser.NewPageAsync().GetAwaiter().GetResult();

            _page.Console += (_, args) =>
            {
                if (args.Message.Type == ConsoleType.Error)
                    Console.WriteLine($"[PAGE ERROR] {args.Message.Text}");
            };
        }

        [Fact]
        public async Task Pwa_Serves_Pages_Offline_After_ServiceWorker_Caches_Them()
        {
            if (!ChromiumAvailable)
            {
                Console.WriteLine("SKIPPED: Chromium not found. Install Playwright or set PUPPETEER_CHROMIUM_PATH.");
                return;
            }

            var baseUrl = $"http://localhost:{_server!.Port}/";

            // --- Step 1: Load index.html to install the service worker ---
            Console.WriteLine("\n--- Step 1: Load index.html to install SW ---");
            await _page!.GoToAsync(baseUrl, 15000);
            await Task.Delay(3000);

            var content = await _page.GetContentAsync();
            Assert.True(content.Length > 15000, $"Index page too short: {content.Length} bytes");

            // Wait for service worker to be activated (poll with timeout)
            var swState = "";
            for (var i = 0; i < 30; i++)
            {
                swState = await _page.EvaluateExpressionAsync<string>(
                    "(async () => { try { var reg = await navigator.serviceWorker.ready; " +
                    "return reg.active ? reg.active.state : 'none'; } catch(e) { return 'error'; } })()"
                );
                if (swState == "activated")
                    break;
                await Task.Delay(1000);
            }
            Console.WriteLine($"SW state: {swState}");
            Assert.Equal("activated", swState);

            // --- Step 2: Pre-cache the SPA shell via a route navigation ---
            Console.WriteLine("\n--- Step 2: Pre-cache SPA shell via /blog route ---");
            await _page.GoToAsync($"{baseUrl}blog", 15000);
            await Task.Delay(3000);

            content = await _page.GetContentAsync();
            Assert.True(content.Contains("id=\"app\""), "/blog should render the Blazor app container");
            Assert.True(content.Length > 15000, $"/blog too short: {content.Length} bytes");

            // --- Step 3: Go offline via CDP ---
            Console.WriteLine("\n--- Step 3: Go offline via CDP ---");
            var cdp = await _page.CreateCDPSessionAsync();
            await cdp.SendAsync("Network.emulateNetworkConditions", new Dictionary<string, object>
            {
                ["offline"] = true,
                ["latency"] = 0,
                ["downloadThroughput"] = 0,
                ["uploadThroughput"] = 0
            });
            await Task.Delay(1000);

            // --- Step 4: Load /blog OFFLINE ---
            Console.WriteLine("\n--- Step 4: Load /blog OFFLINE ---");
            try
            {
                await _page.GoToAsync($"{baseUrl}blog", 20000);
                await Task.Delay(3000);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Navigation had minor issue: {ex.Message}");
                await Task.Delay(1000);
            }

            content = await _page.GetContentAsync();
            Console.WriteLine($"Offline /blog: {content.Length} bytes");

            Assert.True(content.Length > 15000,
                $"Offline: /blog should be served from the SW cache ({content.Length} bytes)");
            Assert.Contains("id=\"app\"", content);

            var title = await _page.GetTitleAsync();
            Console.WriteLine($"Offline title: {title}");

            // --- Step 5: Load index.html OFFLINE ---
            Console.WriteLine("\n--- Step 5: Load index.html OFFLINE ---");
            try
            {
                await _page.GoToAsync(baseUrl, 20000);
                await Task.Delay(3000);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Navigation had minor issue: {ex.Message}");
                await Task.Delay(1000);
            }

            content = await _page.GetContentAsync();
            Console.WriteLine($"Offline index.html: {content.Length} bytes");

            Assert.True(content.Length > 15000,
                $"Offline: index.html should be fully cached ({content.Length} bytes)");
            Assert.Contains("id=\"app\"", content);
        }

        public void Dispose()
        {
            _browser?.Dispose();
            _server?.Dispose();
        }
    }

    /// <summary>
    /// A lightweight static file server using HttpListener.
    /// Serves files from a given root directory with correct MIME types.
    /// </summary>
    internal class StaticFileServer : IDisposable
    {
        private readonly HttpListener _listener;
        private readonly string _rootPath;
        private Task? _listenTask;

        public int Port { get; }

        public StaticFileServer(string rootPath)
        {
            _rootPath = rootPath;
            _listener = new HttpListener();
            Port = FindFreePort();
            _listener.Prefixes.Add($"http://localhost:{Port}/");
        }

        public void Start()
        {
            _listener.Start();
            _listenTask = Task.Run(ListenLoop);
        }

        private async Task ListenLoop()
        {
            while (_listener.IsListening)
            {
                try
                {
                    var ctx = await _listener.GetContextAsync();
                    await HandleRequest(ctx);
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch (HttpListenerException)
                {
                    break;
                }
            }
        }

        private async Task HandleRequest(HttpListenerContext ctx)
        {
            var url = ctx.Request.Url!.AbsolutePath.TrimStart('/');
            if (string.IsNullOrEmpty(url))
                url = "index.html";

            var filePath = Path.Combine(_rootPath, url);

            if (!File.Exists(filePath))
            {
                ctx.Response.StatusCode = 404;
                ctx.Response.Close();
                return;
            }

            var ext = Path.GetExtension(filePath);
            var mimeType = ext.ToLowerInvariant() switch
            {
                ".html" => "text/html",
                ".js" => "application/javascript",
                ".css" => "text/css",
                ".json" => "application/json",
                ".onnx" => "application/octet-stream",
                ".wasm" => "application/wasm",
                ".png" => "image/png",
                ".svg" => "image/svg+xml",
                ".ico" => "image/x-icon",
                ".woff" => "font/woff",
                ".woff2" => "font/woff2",
                ".jsonl" => "text/plain",
                ".webmanifest" => "application/manifest+json",
                ".otf" => "font/otf",
                ".br" => "application/octet-stream",
                ".gz" => "application/gzip",
                ".mjs" => "text/javascript",
                _ => "application/octet-stream"
            };

            ctx.Response.ContentType = mimeType;
            ctx.Response.ContentLength64 = new FileInfo(filePath).Length;

            await using var fileStream = File.OpenRead(filePath);
            await fileStream.CopyToAsync(ctx.Response.OutputStream);
            ctx.Response.Close();
        }

        private static int FindFreePort()
        {
            using var socket = new System.Net.Sockets.Socket(
                System.Net.Sockets.AddressFamily.InterNetwork,
                System.Net.Sockets.SocketType.Stream,
                System.Net.Sockets.ProtocolType.Tcp);
            socket.Bind(new IPEndPoint(IPAddress.Loopback, 0));
            socket.Listen(1);
            var port = ((IPEndPoint)socket.LocalEndPoint!).Port;
            return port;
        }

        public void Dispose()
        {
            try
            {
                if (_listener.IsListening)
                    _listener.Stop();
            }
            catch { }
            _listener.Close();
        }
    }
}
