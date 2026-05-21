# 3_Roadmap.md

## Implementation Plan and Roadmap

This roadmap outlines the phased approach to implementing the required features and addressing missing components for the `test.vvgonline.net` project.

### Phase 1: Foundation and Core SEO Setup

*   **Task 1.1: Directory Setup**
    *   **Description:** Create the `specs/` directory within the `test.vvgonline.net` project structure.
    *   **Status:** Completed.
    *   **Artifacts:** `test.vvgonline.net/specs/`
*   **Task 1.2: Documentation Creation**
    *   **Description:** Create foundational documentation files within the `specs/` directory.
    *   **Status:** In Progress.
    *   **Artifacts:** `0_Project_Vision.md`, `1_Product_Requirements.md`, `2_Architecture.md`, `3_Roadmap.md`.
*   **Task 1.3: Essential SEO JSON Files**
    *   **Description:** Create `metadata.json`, `twitter-card.json`, and `open-graph.json` in `src/wwwroot/data/`.
    *   **Details:** Populate these files with relevant default metadata. Verify `MetadataService.cs` correctly loads these files.
    *   **Status:** Pending.
    *   **Artifacts:** `src/wwwroot/data/metadata.json`, `src/wwwroot/data/twitter-card.json`, `src/wwwroot/data/open-graph.json`.
*   **Task 1.4: Sitemap and Robots.txt**
    *   **Description:** Generate `sitemap.xml` and `robots.txt`.
    *   **Details:** Investigate current deployment process (GitHub Actions) for potential integration of these file generations or create them as static assets.
    *   **Status:** Pending.
    *   **Artifacts:** `sitemap.xml`, `robots.txt`.

### Phase 2: Feature Implementation

*   **Task 2.1: Blog Search and Filtering**
    *   **Description:** Implement client-side search and filtering logic on the `Blog.razor` page.
    *   **Dependencies:** Task 1.2 (Product Requirements). Task 1.3 (SEO files can be done in parallel).
    *   **Status:** Pending.
    *   **Artifacts:** Updates to `Blog.razor`, potentially new helper methods in services.
*   **Task 2.2: Theme Toggle**
    *   **Description:** Implement the UI toggle and persistence logic for theme switching.
    *   **Dependencies:** Core styling in `app.css` (assumed complete based on README).
    *   **Status:** Pending.
    *   **Artifacts:** Theme toggle component/logic, `localStorage` integration.
*   **Task 2.3: Enhance Hero Banners**
    *   **Description:** Refine `HeroBanner.razor` for full-screen (100vh) display and add animations/SVG patterns.
    *   **Dependencies:** Core CSS and asset availability.
    *   **Status:** Pending.
    *   **Artifacts:** Updated `HeroBanner.razor`.
*   **Task 2.4: Implement Charts**
    *   **Description:** Integrate `Chart.razor` component, connecting it to `facts-figures.json` via JavaScript interop.
    *   **Dependencies:** `facts-figures.json` must be populated.
    *   **Status:** Pending.
    *   **Artifacts:** Implemented `Chart.razor`, data binding.
*   **Task 2.5: Blog Content Model and Index**
    *   **Description:** Define the markdown + front‑matter structure for blog posts and implement the build‑time process that generates `blog-index.json` (and optional search index).
    *   **Dependencies:** Existing blog content scraping and markdown export must be available.
    *   **Status:** Pending.
    *   **Artifacts:** `wwwroot/blog/*.md`, `wwwroot/data/blog-index.json`, build script or CI step.
*   **Task 2.6: Blog Layouts**
    *   **Description:** Implement `BlogLayout.razor` separate from `MainLayout.razor`, with a two‑column layout and sidebar used by `/blog`, `/archives`, and `/blog/{slug}`.
    *   **Dependencies:** Core routing and base layout must be stable.
    *   **Status:** Pending.
    *   **Artifacts:** `BlogLayout.razor`, updates to routing and layout assignment.
*   **Task 2.7: Blog Index and Archives Pages**
    *   **Description:** Implement:
        * `Blog.razor` as the index page, reading from `blog-index.json` and showing a list of posts with basic tag filter.
        * `Archives.razor` with year/tag filters and search box.
    *   **Dependencies:** Task 2.5 (content model and index).
    *   **Status:** Pending.
    *   **Artifacts:** `Blog.razor`, `Archives.razor`, filter/search logic.
*   **Task 2.8: TOC and Sidebar Components**
    *   **Description:** Implement sidebar modules and a collapsible, scroll‑aware TOC for long posts.
    *   **Dependencies:** Single post view (`ViewPost.razor` or `/blog/{slug}` component) and heading structure must be defined.
    *   **Status:** Pending.
    *   **Artifacts:** `BlogToc.razor`, `BlogSidebarAbout.razor`, `BlogSidebarHighlights.razor`, `BlogSidebarTags.razor`, supporting JS interop for scrollspy.
*   **Task 2.9: Sharing and CTA**
    *   **Description:** Add simple “copy link” and optional share button on single posts and define an end‑of‑post CTA pattern.
    *   **Dependencies:** Single post layout and routing.
    *   **Status:** Pending.
    *   **Artifacts:** CTA component, copy/share UI in post template.


### Phase 3: Verification and Polish

*   **Task 3.1: PWA Functionality Verification**
    *   **Description:** Test offline capabilities and the PWA install prompt.
    *   **Dependencies:** Task 2.1 (general app stability).
    *   **Status:** Pending.
    *   **Artifacts:** Test report, potential fixes to `service-worker.js`.
*   **Task 3.2: Page-Specific SEO Verification**
    *   **Description:** Review key pages (Home, Services, Blog) to ensure dynamic meta tags are correctly set.
    *   **Dependencies:** Task 1.3 (SEO JSON files).
    *   **Status:** Pending.
    *   **Artifacts:** Verification report, code adjustments if needed.
*   **Task 3.3: Final Review and Testing**
    *   **Description:** Conduct a comprehensive review of all implemented features, code quality, and performance.
    *   **Dependencies:** All previous tasks.
    *   **Status:** Pending.
    *   **Artifacts:** Finalized code, updated documentation.
*   **Task 3.4: Blog UX and Navigation Review**
    *   **Description:** Validate usability of the blog index, archives filters, search box, sidebar, and TOC on desktop and mobile.
    *   **Dependencies:** Tasks 2.5–2.8.
    *   **Status:** Pending.
    *   **Artifacts:** UX review notes, backlog of refinements
*   **Task 3.5: Performance and Accessibility Audit (Blog)**
    *   **Description:** Measure load and interaction performance of blog views in Blazor WASM and verify accessibility (focus order, keyboard navigation, ARIA attributes for TOC and filters).
    *   **Dependencies:** All blog features implemented.
    *   **Status:** Pending.
    *   **Artifacts:** Performance profile, accessibility checklist, fixes.


This roadmap will be updated as implementation progresses and new information becomes available.
