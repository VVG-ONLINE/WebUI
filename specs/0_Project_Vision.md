# 0_Project_Vision.md

## Project Goals

The primary goals for the `test.vvgonline.net` project are:

1. **Blazor WASM Application Setup:** Establish a Blazor WebAssembly (WASM) application.
2. **SEO Optimization:** Implement comprehensive SEO features, including:
    * Dynamic head tags.
    * Keywords, descriptions, Open Graph metadata, Twitter card, and JSON-LD.
    * A functional blog.
3. **Design Aesthetics:** Ensure an elegant, clean, minimal, and modern design.
4. **Hosting:** Deploy the application on GitHub Pages.
5. **Progressive Web App (PWA):** Integrate PWA features for enhanced user experience and offline capabilities.
6. **Performance:** Optimize for fast page load times.
7. **User Interaction:** Include interactive components for a richer user experience.
8. **Security:** Implement security measures such as HTTPS, Cross-Origin Resource Sharing (CORS), and Content Security Policy.
9. **Accessibility:** Ensure the application is accessible to all users, including those with disabilities.
10. **Localization:** Support multiple languages and regions.
11. **Analytics:** Integrate analytics tools like Google Analytics
12. **Documentation:** Provide comprehensive documentation for the codebase
13. **Code Quality:** Adhere to Blazor Component best practices (C# only).
14. **Testing:** Implement unit and integration tests to ensure application reliability.
15. **Continuous Integration/Continuous Deployment (CI/CD):** Set up CI/CD pipelines for automated testing and deployment.
16. **Community Engagement:** Foster a community around the project for feedback and contributions.

## Blog Experience Vision

The `test.vvgonline.net` blog should:

1. Serve as the canonical, markdown‑driven archive of VVG ONLINE thought leadership, with Git as the source of truth for all posts.
2. Provide a focused reading experience with:
   - A clean main reading column.
   - A contextual sidebar with about/profile, highlights, and navigation aids.
   - A collapsible “On this page” table of contents (TOC) for long posts.
3. Support efficient discovery of content through:
   - A dedicated archives page with year and tag filters.
   - A prominent search box for full‑text search across titles and content.
4. Support a markdown‑first authoring workflow:
   - Posts authored as markdown files with front‑matter (title, slug, date, tags, draft, excerpt).
   - A build step that generates a JSON index for fast client‑side rendering in Blazor WebAssembly.
5. Keep interaction intentionally minimal:
   - Simple share/copy‑link actions and clear CTAs (e.g., contact, services) instead of heavy commenting systems in the initial release.
6. Maintain performance and accessibility:
   - Static hosting (GitHub Pages) friendly architecture.
   - Sanitary markdown→HTML rendering to avoid XSS while preserving rich formatting.

The project aims to serve as a testbed for new features of VVG ONLINE's website.
