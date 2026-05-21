using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using VVG.Web;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection; // Added for Configure
using Microsoft.AspNetCore.Builder; // Added for StaticFileOptions

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<VVG.Web.Services.MetadataService>();
builder.Services.AddScoped<VVG.Web.Services.ThemeService>();

// --- FIX STARTS HERE ---
// Configure static files for WASM via services, not app.UseStaticFiles()
builder.Services.Configure<StaticFileOptions>(options =>
{
    var provider = new FileExtensionContentTypeProvider();
    // Add custom mappings
    provider.Mappings[".onnx"] = "application/octet-stream";
    provider.Mappings[".json"] = "application/json";
    options.ContentTypeProvider = provider;
});
// --- FIX ENDS HERE ---

Console.WriteLine("Starting Blazor WebAssembly App");

await builder.Build().RunAsync();
