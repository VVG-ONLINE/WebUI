# Milestone 7: Sitemap and Robots.txt

## Objectives

- Provide crawl-friendly configuration.
- Integrate sitemap generation into the pipeline.

## Tasks

### 7.1 Robots.txt

- [ ] Create a `robots.txt` that allows legitimate crawling of public pages.
- [ ] Host `robots.txt` at the root of the deployed site.

### 7.2 Sitemap Generation

- [ ] Implement `SitemapService` or a build-time generator for `sitemap.xml`.
- [ ] Ensure blog posts, archives, and key static pages are included.
- [ ] Integrate generation into CI/CD so sitemap updates with new posts.

### 7.3 Verification

- [ ] Validate `sitemap.xml` with search engine tools.
- [ ] Confirm `robots.txt` is reachable and correct.
