using Microsoft.JSInterop;

namespace VVG.Web.Services
{
    // ==========================================================================
    // ThemeService — manages dark/light theme state
    //
    // Stores the user's theme preference in the browser's localStorage so it
    // persists across page reloads. Provides methods to get, set, and toggle
    // the theme. Works with theme.js (vvg.theme) to apply the theme to the DOM.
    // ==========================================================================
    public class ThemeService
    {
        private readonly IJSRuntime _jsRuntime;

        // Key used in localStorage to persist the theme preference
        private const string LocalStorageKey = "theme";

        // CSS class names applied to <body> to trigger light/dark styles
        private const string LightThemeClass = "light-theme";
        private const string DarkThemeClass = "dark-theme";

        // Fired when the theme changes — components can subscribe to update their UI
        public event Action? OnThemeChanged;

        public ThemeService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        // Reads the current theme from localStorage (defaults to light)
        public async Task<string> GetCurrentThemeAsync()
        {
            string? theme = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", LocalStorageKey);
            return string.IsNullOrEmpty(theme) ? LightThemeClass : theme;
        }

        // Sets the theme, saves to localStorage, and applies it to the DOM
        public async Task SetThemeAsync(string themeClass)
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.setItem", LocalStorageKey, themeClass);
            ApplyTheme(themeClass);
            OnThemeChanged?.Invoke();
        }

        // Switches between light and dark theme
        public async Task ToggleThemeAsync()
        {
            string currentTheme = await GetCurrentThemeAsync();
            if (currentTheme == LightThemeClass)
                await SetThemeAsync(DarkThemeClass);
            else
                await SetThemeAsync(LightThemeClass);
        }

        // Called once on app startup to apply the saved theme
        public async Task InitializeThemeAsync()
        {
            string currentTheme = await GetCurrentThemeAsync();
            ApplyTheme(currentTheme);
        }

        // Applies the theme CSS class to the <body> element via JavaScript
        private void ApplyTheme(string themeClass)
        {
            _jsRuntime.InvokeVoidAsync("eval", $"document.body.className = '{themeClass}';");
        }
    }
}
