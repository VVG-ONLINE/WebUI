# 2_Architecture.md

## Project Architecture Overview

The `test.vvgonline.net` project is built as a Blazor WebAssembly (WASM) Progressive Web Application (PWA) using C#.

### Core Structure

*   **Blazor WASM:** The application runs entirely in the browser, leveraging WebAssembly for near-native performance. It utilizes .NET runtime compiled to WebAssembly.
*   **Project Structure:** Follows the standard Blazor WASM template, organized into:
    *   `src/`: Contains the main application code.
        *   `Pages/`: Razor components for different application pages (Home, Services, Blog, etc.).
        *   `Components/`: Reusable UI components (e.g., `MetaTags.razor`, `HeroBanner.razor`, `Chart.razor`).
        *   `Models/`: C# classes defining data structures (e.g., `Service.cs`, `BlogPost.cs`).
        *   `wwwroot/`: Static assets, including `index.html`, CSS, JS, images, and JSON data files.
            *   `data/`: Contains JSON files for services, statistics, and markdown files blog posts.
            *   `css/`: Stylesheets, including Bootstrap and custom `app.css`.
            *   `js/`: JavaScript files for interop and service workers.
    *   `.github/workflows/deploy.yml`: CI/CD pipeline for deployment to GitHub Pages.
    *   `specs/`: Directory for documentation (this file).
*   **SEO Implementation:** Handled via the `MetadataService.cs` and the `MetaTags.razor` component. Metadata is fetched from JSON files in `wwwroot/data/` and dynamically injected into the `<head>` of the HTML document.
*   **PWA Features:** Integrated via `manifest.json` and `service-worker.js` located in `wwwroot/`.

### Blog Content Storage and Indexing

* **Markdown Storage:**
  * Blog posts are stored as markdown files with front‑matter under `wwwroot/blog/` (or a `wwwroot/data/blog/` directory).
  * Front‑matter is parsed at build time by a script/tool to produce a `blog-index.json` file containing:
    * `title`, `slug`, `publishedAt`, `tags`, `excerpt`, `draft`.

* **Content Delivery in Blazor WASM:**
  * The Blazor WASM app reads `blog-index.json` at startup (or on first blog page load) to populate in‑memory models (`BlogPostSummary`).
  * For individual posts, the app:
    * Either fetches pre‑rendered, sanitized HTML from `wwwroot/blog/{slug}.html`; or
    * Fetches markdown from `wwwroot/blog/{slug}.md` and renders it via a markdown component with HTML sanitization.

* **Layouts:**
  * `MainLayout.razor`:
    * Houses shared shell elements for non‑blog pages (header, footer, basic navigation).
  * `BlogLayout.razor`:
    * Provides a two‑column grid (main + sidebar).
    * Used for routes under `/blog` and `/archives`.
    * Hosts the blog sidebar (about card, highlights, tags, TOC placeholder).

### Blog Search, Archives, and TOC Integration

* **Search and Filtering:**
  * The blog and archives pages consume `blog-index.json` to:
    * Filter posts by tags and year.
    * Perform client‑side search over a lightweight index structure (potentially a separate `blog-search-index.json`).
  * State for filters and search can be held in a scoped service (e.g., `BlogFilterStateService`) to synchronize components without excessive re‑renders.

* **Archives View:**
  * Implemented as `Archives.razor` and uses:
    * `BlogLayout.razor` for its shell.
    * The shared blog index for all filtering and grouping logic.

* **Table of Contents Component:**
  * A reusable `BlogToc.razor` component:
    * Accepts a collection of headings or parses the rendered content via JS interop.
    * Renders a nested list of links to sections (IDs based on slugified headings).
    * Integrates with a scrollspy mechanism (JS interop or a dedicated component) to highlight the active section.

* **Sidebar Composition:**
  * Sidebar is composed of modular components:
    * `BlogSidebarAbout.razor`
    * `BlogSidebarHighlights.razor`
    * `BlogSidebarTags.razor`
    * `BlogToc.razor`
  * Each component receives its data via parameters or shared services, maintaining separation of concerns.

### Integration of New Features

*   **SEO JSON Files:** New JSON files (`metadata.json`, `twitter-card.json`, `open-graph.json`) will be placed in `src/wwwroot/data/` and referenced by `MetadataService.cs`.
*   **Blog Search & Filter:** Logic will be added to `Blog.razor` to filter and search `blog-posts.json` data client-side.
*   **Theme Toggle:** A new component or logic within existing layout components will manage theme state (using `localStorage`) and apply CSS classes accordingly.
*   **Animated Hero Banners:** The existing `HeroBanner.razor` will be enhanced with CSS animations and potentially JavaScript interop for advanced effects.
*   **Charts:** The `Chart.razor` component will be implemented to consume data from `facts-figures.json` and render charts using a JavaScript charting library (e.g., Chart.js) via Blazor interop.
*   **Sitemap & Robots.txt:** These will likely be generated during the build process or managed via static files, integrated into the deployment pipeline.
