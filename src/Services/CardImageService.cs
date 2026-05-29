using System.Text.Json;

namespace VVG.Web.Services;

/// <summary>
/// Maps page/blog slugs to their generated Twitter card PNG filenames.
/// Reads card-mapping.json at runtime and provides image URLs.
/// </summary>
public class CardImageService
{
    private readonly HttpClient _http;
    private Dictionary<string, string>? _mapping;

    public CardImageService(HttpClient http) => _http = http;

    public async Task<string> GetImageUrlAsync(string slug)
    {
        await EnsureMappingLoadedAsync();
        var fileName = _mapping?.GetValueOrDefault(slug) ?? "home-twitter-card.png";
        return $"assets/images/twitter-cards/{fileName}";
    }

    private async Task EnsureMappingLoadedAsync()
    {
        if (_mapping != null) return;

        try
        {
            var json = await _http.GetStringAsync("assets/images/twitter-cards/card-mapping.json");
            _mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
        }
        catch
        {
            _mapping = new Dictionary<string, string>();
        }
    }
}
