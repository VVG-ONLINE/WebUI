window.vvg = window.vvg || {};
window.vvg.theme = (function () {
    function current() {
        return localStorage.getItem('theme') || 'light';
    }
    function apply(t) {
        try { document.documentElement.setAttribute('data-theme', t); localStorage.setItem('theme', t); } catch (e) { }
    }
    function toggle() {
        const t = current() === 'dark' ? 'light' : 'dark';
        apply(t);
        return t;
    }
    return { current, apply, toggle };
})();
