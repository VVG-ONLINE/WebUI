window.vvg = window.vvg || {};
window.vvg.updateMeta = function (meta) {
    try {
        if (meta.title) document.title = meta.title;
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

        // Open Graph
        set('og:type', meta.ogType, 'property');
        set('og:title', meta.ogTitle || meta.title, 'property');
        set('og:description', meta.ogDescription || meta.description, 'property');
        set('og:image', meta.ogImage || meta.image, 'property');
        set('og:url', meta.ogUrl, 'property');

        // Twitter Card
        set('twitter:card', meta.twitterCard || 'summary_large_image');
        set('twitter:site', meta.twitterSite);
        set('twitter:creator', meta.twitterCreator);
        set('twitter:title', meta.twitterTitle || meta.ogTitle || meta.title);
        set('twitter:description', meta.twitterDescription || meta.ogDescription || meta.description);
        set('twitter:image', meta.twitterImage || meta.ogImage || meta.image);

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
