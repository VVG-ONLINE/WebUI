# Milestone 9: Blog Layout, Archives, and TOC

## Objectives

- Implement dedicated blog layouts and sidebar.
- Build archives with filters and search.
- Add TOC for long posts.

## Tasks

### 9.1 Blog Layouts

- [ ] Implement `BlogLayout.razor` distinct from `MainLayout.razor`.
- [ ] Configure routing so `/blog`, `/archives`, and `/blog/{slug}` use `BlogLayout`.
- [ ] Implement responsive 2-column grid (main + sidebar).

### 9.2 Blog Index and Single Post Views

- [ ] Update `Blog.razor` to use `BlogLayout` and `blog-index.json`.
- [ ] Implement single post view (`Post.razor` or route) that:
  - Loads markdown/HTML content for the specified slug.
  - Renders title, date, tags, and end-of-post CTA.
  - Shows related posts section.

### 9.3 Archives with Filters and Search

- [ ] Implement `Archives.razor` reading from `blog-index.json`.
- [ ] Add year filter (group and collapse by year).
- [ ] Add tag filter (chips or checkboxes).
- [ ] Add search box for title and content snippets.
- [ ] Ensure combined filter + search logic works correctly.

### 9.4 Sidebar and TOC

- [ ] Implement `BlogSidebarAbout.razor`, `BlogSidebarHighlights.razor`, `BlogSidebarTags.razor`.
- [ ] Implement `BlogToc.razor` that:
  - Builds a TOC from H2/H3 headings.
  - Supports collapse/expand.
  - Scrolls smoothly to sections.
  - Highlights active section (scrollspy).
- [ ] Integrate sidebar components into `BlogLayout.razor` with sensible ordering.
