/**
 * meta.js — Dynamic SEO meta tag injection for VVG ONLINE
 *
 * Blazor WASM renders everything client-side, which means standard
 * <meta> tags in index.html are the same for every page. Search engines
 * and social media crawlers need unique tags per page.
 *
 * This script is called from C# (MetadataService → JS interop) every
 * time the user navigates to a new page. It creates or updates:
 *
 *   - Standard SEO: <title>, description, keywords
 *   - Open Graph (og:*):  for Facebook, LinkedIn, Discord embeds
 *   - Twitter Card:       for Twitter/X link previews
 *   - JSON-LD:            structured data for Google rich results
 */

window.vvg = window.vvg || {};

/**
 * Called by C# MetadataService.SetPageMetadata().
 * @param {Object} meta — flattened metadata object
 * @param {string} meta.title — page title (also sets document.title)
 * @param {string} meta.description — meta description
 * @param {string} meta.keywords — meta keywords
 * @param {string} [meta.ogTitle] etc. — Open Graph properties
 * @param {string} [meta.twitterTitle] etc. — Twitter Card properties
 * @param {string} [meta.jsonLd] — JSON-LD structured data string
 */
window.vvg.updateMeta = function (meta) {
    try {
        // Page title (shown in browser tab)
        if (meta.title) document.title = meta.title;

        /**
         * Helper: sets a <meta> tag's content attribute.
         * If no existing tag matches, it creates a new one and appends it to <head>.
         * @param {string} name  — the name/property value (e.g. "description", "og:title")
         * @param {string} value — content to set
         * @param {string} attr  — HTML attribute to match on ("name" for standard, "property" for OG)
         */
        const set = (name, value, attr = 'name') => {
            if (!value) return;
            let el = document.querySelector('meta[' + attr + "='" + name + "']");
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', value);
        };

        // Standard meta tags
        set('description', meta.description);
        set('keywords', meta.keywords);

        // Open Graph (Facebook / LinkedIn / Discord)
        // OG tags use property="og:*" instead of name="description"
        set('og:locale', meta.ogLocale || 'en_IN', 'property');
        set('og:type', meta.ogType, 'property');
        set('og:title', meta.ogTitle || meta.title, 'property');
        set('og:description', meta.ogDescription || meta.description, 'property');
        set('og:image', meta.ogImage || meta.image, 'property');
        set('og:url', meta.ogUrl, 'property');

        // Twitter Card
        // Falls back through the chain: twitter → og → standard meta
        set('twitter:card', meta.twitterCard || 'summary_large_image');
        set('twitter:site', meta.twitterSite);
        set('twitter:creator', meta.twitterCreator);
        set('twitter:title', meta.twitterTitle || meta.ogTitle || meta.title);
        set('twitter:description', meta.twitterDescription || meta.ogDescription || meta.description);
        set('twitter:image', meta.twitterImage || meta.ogImage || meta.image);

        // Canonical URL (prevents duplicate content issues between /page and /page/)
        if (meta.canonicalUrl) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'canonical';
                document.head.appendChild(link);
            }
            link.href = meta.canonicalUrl;
        }

        // JSON-LD structured data (Google rich snippets)
        // Injected as a <script type="application/ld+json"> tag
        if (meta.jsonLd) {
            let ld = document.getElementById('vvg-jsonld');
            if (!ld) {
                ld = document.createElement('script');
                ld.type = 'application/ld+json';
                ld.id = 'vvg-jsonld';
                document.head.appendChild(ld);
            }
            ld.textContent = meta.jsonLd;
        }
    } catch (e) { console.warn(e); }
};
