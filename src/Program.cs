// ==============================================================================
// Program.cs — ENTRY POINT for the Blazor WebAssembly application
//
// This is the first code that runs when the app starts in the browser.
// It sets up the dependency injection container, registers services,
// configures static file MIME types, and launches the Blazor app.
// ==============================================================================

using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using VVG.Web;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.StaticFiles;

// Create the host builder — this is the standard way to bootstrap a Blazor WASM app
var builder = WebAssemblyHostBuilder.CreateDefault(args);

// Tell Blazor which component is the root (App.razor) and where to place it in index.html
builder.RootComponents.Add<App>("#app");

// HeadOutlet manages <head> content like <title> and <meta> tags from Blazor components
builder.RootComponents.Add<HeadOutlet>("head::after");

// Register HttpClient — every page/service gets the same instance during a request
// BaseAddress points to the hosted location (e.g., GitHub Pages or localhost)
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// Register our custom services — these handle SEO metadata, dark/light theme, and Twitter card images
builder.Services.AddScoped<VVG.Web.Services.MetadataService>();
builder.Services.AddScoped<VVG.Web.Services.ThemeService>();
builder.Services.AddScoped<VVG.Web.Services.CardImageService>();

// Tell the server which MIME types to use for serving .onnx (AI model) and .json files
// Without this, the browser may reject these files as unknown types
builder.Services.Configure<StaticFileOptions>(options =>
{
    var provider = new FileExtensionContentTypeProvider();
    provider.Mappings[".onnx"] = "application/octet-stream";
    provider.Mappings[".json"] = "application/json";
    options.ContentTypeProvider = provider;
});

// Build the host and start the Blazor app — this blocks until the app closes
await builder.Build().RunAsync();
