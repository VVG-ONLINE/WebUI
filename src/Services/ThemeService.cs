using Microsoft.JSInterop;

namespace VVG.Web.Services
{
    public class ThemeService
    {
        private readonly IJSRuntime _jsRuntime;
        private const string LocalStorageKey = "theme";
        private const string LightThemeClass = "light-theme";
        private const string DarkThemeClass = "dark-theme";

        public event Action? OnThemeChanged;

        public ThemeService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        public async Task<string> GetCurrentThemeAsync()
        {
            string? theme = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", LocalStorageKey);
            return string.IsNullOrEmpty(theme) ? LightThemeClass : theme; // Default to light theme
        }

        public async Task SetThemeAsync(string themeClass)
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.setItem", LocalStorageKey, themeClass);
            ApplyTheme(themeClass);
            OnThemeChanged?.Invoke();
        }

        public async Task ToggleThemeAsync()
        {
            string currentTheme = await GetCurrentThemeAsync();
            if (currentTheme == LightThemeClass)
            {
                await SetThemeAsync(DarkThemeClass);
            }
            else
            {
                await SetThemeAsync(LightThemeClass);
            }
        }

        public async Task InitializeThemeAsync()
        {
            string currentTheme = await GetCurrentThemeAsync();
            ApplyTheme(currentTheme);
        }

        private void ApplyTheme(string themeClass)
        {
            // This part will be handled by JavaScript interop to modify the <body> class
            _jsRuntime.InvokeVoidAsync("eval", $"document.body.className = '{themeClass}';");
        }
    }
}
