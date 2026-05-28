/**
 * theme.js — Light / Dark theme toggle for VVG ONLINE
 *
 * How it works:
 * 1. The current theme is stored in localStorage as "light" or "dark"
 * 2. The <html> element gets a data-theme attribute (e.g. data-theme="dark")
 * 3. CSS uses [data-theme="dark"] selectors to switch colour variables
 * 4. C# calls vvg.theme.toggle() via JS interop when the button is clicked
 */
window.vvg = window.vvg || {};
window.vvg.theme = (function () {
    /**
     * Reads the saved theme from browser storage.
     * Defaults to "light" if nothing has been saved yet.
     */
    function current() {
        return localStorage.getItem('theme') || 'light';
    }

    /**
     * Applies a theme immediately:
     * - Sets data-theme on the <html> root element (CSS responds to this)
     * - Saves the choice to localStorage so it persists across page reloads
     */
    function apply(t) {
        try { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); } catch (e) { }
    }

    /**
     * Switches between light ↔ dark and returns the new theme name.
     * Called from SystemPanel.razor when the user clicks the sun/moon icon.
     */
    function toggle() {
        const t = current() === 'dark' ? 'light' : 'dark';
        apply(t);
        return t;
    }

    // Reveal only these three functions to outside code
    return { current, apply, toggle };
})();
