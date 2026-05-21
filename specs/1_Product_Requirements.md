# 1_Product_Requirements.md

## Functional Requirements and Missing Implementations

This document outlines the specific product requirements and details the implementation steps needed to fulfill the project goals for `test.vvgonline.net`.

### 1. SEO Configuration Files

* **Requirement:** Create and populate the following JSON files within `src/wwwroot/data/` to provide default SEO metadata:
    * `metadata.json`: For general site-wide metadata.
    * `twitter-card.json`: For Twitter Card specific metadata.
    * `open-graph.json`: For Open Graph protocol metadata.
* **Purpose:** These files are critical for the `MetadataService.cs` to dynamically set meta tags for pages, ensuring proper social sharing and search engine visibility, as described in the README.
* **Example Structure (`metadata.json`):**

    ```json
    {
      "title": "VVG ONLINE - Digital Business Consulting",
      "description": "Leading digital business consulting services to transform your enterprise.",
      "keywords": "digital strategy, consulting, AI, transformation, business growth"
    }
    ```

* **Example Structure (`twitter-card.json`):**

    ```json
    {
      "card": "summary_large_image",
      "site": "@YourTwitterHandle",
      "creator": "@YourTwitterHandle"
    }
    ```

* **Example Structure (`open-graph.json`):**
    ```json
    {
      "type": "website",
      "url": "https://vvgonline.github.io/test.vvgonline.net/",
      "site_name": "VVG ONLINE"
    }
    ```
* **Example Structure (`json-ld.json`):**

    ```json
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": "https://vvgonline.github.io/test.vvgonline.net/",
      "name": "VVG ONLINE - Digital Business Consulting",
      "description": "Leading digital business consulting services to transform your enterprise.",
      "publisher": {
        "@type": "Organization",
        "name": "VVG ONLINE",
        "url": "https://vvgonline.net"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://vvgonline.github.io/test.vvgonline.net/archives?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    ```

* **Requirement:** Add a `json-ld.json` file under `src/wwwroot/data/` and ensure `MetadataService.cs` injects a `<script type="application/ld+json">` tag on pages where structured data is needed (site‑wide on Home, and optionally enriched on blog post pages).

### 2. Blog Search and Filtering

* **Requirement:** Implement search and filtering capabilities on the `Blog.razor` page.
* **Functionality:**
    * **Search:** Allow users to search blog posts by title, author, or excerpt content.
    * **Filtering:** Enable filtering of blog posts by tags.
    * **Dynamic Updates:** The displayed list of blog posts should update in real-time as the user types in the search bar or selects filters.
* **Data Source:** Utilize individual `blog-posts.md` markdown files as a data source for blog post data and 'metadata.json' for SEO metadata.
    * **UI Elements:** Include a search input field and a tag filter dropdown or checkbox list above the blog post listings.
    * **Performance:** Ensure efficient searching and filtering to maintain a responsive user experience, even with a large number of blog posts.
    * **Styling:** Ensure the search and filter UI elements align with the overall design aesthetics of the site.
    * **Scrap current blog posts from the existing blog section:** Extract existing blog posts from the current blog section of the [site](https://vvgonline.net/#insights) to populate the new blog structure.

### 2.1 Blog Content Model and Storage

* **Requirement:** Use markdown files with front‑matter as the single source of truth for blog posts.
* **Data Structure:**
  * Each post is a `.md` file stored under `wwwroot/blog/` (or `wwwroot/data/blog/`), with front‑matter keys:
    * `title` (string)
    * `slug` (string, URL path segment)
    * `publishedAt` (ISO date string)
    * `tags` (string array)
    * `excerpt` (string, optional)
    * `draft` (boolean)
* **Behavior:**
  * Draft posts are excluded from public listings and routing.
  * Slugs must be unique; navigating to `/blog/{slug}` loads the corresponding post.
* **Index Generation:**
  * A build step generates a `blog-index.json` file containing:
    * `title`, `slug`, `publishedAt`, `tags`, `excerpt`, `draft`, `category`, and `featured` (no full body content).
  * The Blazor WASM app loads `blog-index.json` to power listings, archives, and search.

### 2.2 Blog Layouts and Views

* **Requirement:** Separate general site layout from blog layout.
* **Main Layout (`MainLayout`):**
  * Used for non‑blog pages (home, services, contact).
  * Single‑column or simple top‑nav layout, without blog sidebar or TOC.
* **Blog Layout (`BlogLayout`):**
  * Used for `/blog`, `/archives`, and `/blog/{slug}` routes.
  * Two‑column layout on desktop:
    * Main column: post list or article content (approx. 65–70% width).
    * Sidebar: about/profile card, highlights, tags, and optional TOC.
  * On mobile, columns stack vertically (main content first, then sidebar modules).

* **Blog Index Page (`/blog`):**
  * Displays a vertical list of posts ordered by `publishedAt` (newest first).
  * Each list item includes:
    * Title (links to `/blog/{slug}`).
    * Published date.
    * Tags.
    * Excerpt (from front‑matter, or auto‑generated from content).
    * "Read more" link.
  * A slim filter bar above the list allows filtering by tag (single or multi‑select).

* **Single Post Page (`/blog/{slug}`):**
  * Shows title, date, and tags at the top.
  * Renders the markdown content as sanitized HTML.
  * End‑of‑post “More like this” area:
    * At least 3 related posts matching tags and/or year, if available.
  * End‑of‑post CTA area:
    * A configurable component for newsletter signup or contact/services.

### 2.3 Archives, Filters, and Search

* **Requirement:** Provide a dedicated archives view with year/tag filters and search.

* **Archives Page (`/archives`):**
  * A search box at the top that filters posts by title and content.
  * Year filter:
    * Filter by `publishedAt` year (e.g., 2023, 2024, 2025).
    * Year groupings are collapsible/expandable.
  * Tag filter:
    * Clickable tag chips or checkboxes.
    * Selecting multiple tags constrains results (logical AND).
  * Results area:
    * Shows posts grouped by year, respecting active filters and search query.

* **Search Behavior:**
  * Search is applied client‑side against a pre‑built index:
    * At minimum, `title`, `excerpt`, and lightweight content snippet fields.
  * Search and filters combine:
    * Search text AND year AND tags.
  * Clearing search and filters resets to all posts.

### 2.4 Sidebar and Table of Contents (TOC)

* **Requirement:** Provide a contextual sidebar with an optional collapsible TOC.

* **Sidebar Content:**
  * About/Profile card:
    * Short description and link to “About”/“Services”.
  * Highlights:
    * Configurable list of pinned posts or series.
  * Tag cloud or tag list:
    * Limited to a curated set of top tags for compactness.
  * Back to Top button:
    * Smoothly scrolls to the top of the page when clicked.
    * should be visible after scrolling down a certain distance.

* **TOC Behavior:**
  * The TOC is shown only on single post pages.
  * It is generated from the post’s heading structure (H2/H3).
  * A “Contents” or “On this page” header labels the TOC.
  * Collapsible:
    * Desktop: expanded by default.
    * Mobile: collapsed by default with a chevron or “Show contents” control.
  * Clicking a TOC item scrolls smoothly to the corresponding heading.
  * The currently visible section is highlighted (scrollspy‑style state).

### 2.5 Interaction and Sharing

* **Requirement:** Keep interaction minimal and focused on navigation and sharing.

* **Initial Interaction Features:**
  * A “Copy link” action on single posts (copies canonical URL to clipboard).
  * Optional light‑weight share button that triggers the browser’s native share dialog where supported.
  * Clear call‑to‑action at the end of posts (e.g., “Contact VVG ONLINE” or “Explore services”).

* **Deferred Features (Out of Scope for v1):**
  * Custom comment system.
  * Like counters or visible subscriber counts.
  * In‑browser blog post editing and publishing UI.

### 3. Theme Toggle

* **Requirement:** Implement a user-friendly mechanism to switch between the defined light and dark themes.
* **UI Element:** Integrate a visible toggle control (e.g., a button or switch) in a prominent location (e.g., header).
* **Persistence:** The user's selected theme preference must be saved using `localStorage` so it persists across sessions.
* **Styling:** Ensure theme changes correctly apply the specified color palettes and that the golden ratio typography and spacing scales are respected across both themes.

### 4. Animated Hero Banners

* **Requirement:** Verify and enhance the `HeroBanner.razor` component to ensure it meets the design specifications.
* **Animation:** Implement smooth scroll animations and visually appealing gradient overlays.
* **Dimensions:** Ensure hero banners occupy the full viewport height (100vh) and feature SVG background patterns as described.

### 5. Chart Implementation for Statistics

* **Requirement:** Integrate data visualization components using `Chart.razor`.
* **Data Integration:** Populate charts with statistical data sourced from `facts-figures.json`.
* **Placement:** Display these charts on relevant pages (e.g., Home or a dedicated statistics page if applicable) to visualize key figures.

### 6. PWA Offline Capabilities and Install Prompt

* **Requirement:** Ensure the Progressive Web App (PWA) functionality is fully realized.
* **Offline Capability:** Verify that the `service-worker.js` effectively caches application assets and allows users to access the site offline.
* **Install Prompt:** Confirm that the browser displays a prompt for users to install the PWA to their home screen.

### 7. Sitemap and Robots.txt Generation

* **Requirement:** Generate `sitemap.xml` dynamically using the `SitemapService.cs` and `robots.txt` files.
* **Purpose:** These files are essential for search engine optimization, guiding crawlers and providing a map of the site's structure.
* **Method:** Investigate and implement a mechanism for their generation, potentially through build-time processes or dedicated Blazor components/services.

### 8. Page-Specific SEO Metadata Verification

* **Requirement:** Confirm that individual pages can correctly utilize page-specific SEO metadata.
* **Verification:** Review key pages (e.g., Home, Services, Blog) to ensure the `MetadataService` is correctly injected and `SetPageMetadata` is called with unique and relevant data for title, description, keywords, and social sharing tags.