# Milestone 3: Blog and Search Foundations

## Objectives

- Stand up the basic blog listing.
- Implement initial search and tag filtering.

## Tasks

### 3. Blog Content Model and Storage

- [x] Scrape existing blog posts from `https://vvgonline.net` into markdown.
- [x] Normalize filenames and front-matter fields (title, slug, date, tags, excerpt, draft).
- [x] Store markdown files under `wwwroot/data/blogs`.
- [x] Define a markdown content model for blog posts, including front-matter keys (`title`, `slug`, `publishedAt`, `tags`, `excerpt`, `draft`, `category`, `featured`).
- [x] Create a build-time script to generate `blog-index.json` from the markdown front-matter.

### 3.1 Blog Index JSON

- [x] Implement a build-time script or tool to generate a single `wwwroot/data/blog-index.json` from markdown front-matter for every markdown file in `wwwroot/data/blogs`.
- [x] Include `title`, `slug`, `publishedAt`, `tags`, `excerpt`, `draft`, `category`, and `featured` fields in the index entries.
- [x] Add this step to CI/CD so `blog-index.json` is always up-to-date.

### 3.2 Blog Listing with Search and Tag Filter

- [x] Implement basic `Blog.razor`. This page should handle the listing, search, years and tag filtering. Tags (e.g. '#Digital', '#Blockchain') should be clickable to filter posts.
- [x] Load `blog-index.json` and render a list of posts with title, date, tags, and excerpt.
- [x] Add client-side search by title and excerpt.
- [x] Add a tag filter (single or multi-select) above the list. Tags should be displayed like #Digital, #Blockchain, etc. Filtering should update the post list dynamically.
- [x] Add a year filter dropdown to filter posts by publication year.
- [x] Display posts in reverse chronological order by default.
- [x] Highlight active filters and search query.
- [x] Show a message when no posts match the current filters/search.
- [x] Implement sorting options (e.g., by date ascending/descending, by title A-Z/Z-A, by time to read).
- [x] Include a featured posts section at the top if any posts are marked as `featured` in the front-matter. First 3 featured posts should be displayed prominently.
- [x] Ensure each post item links to its individual blog post page using the slug.
- [x] Tags in the post listing should be clickable to apply the tag filter. They should displayed like [#Digital](#), [#Blockchain](#), etc. Here (#) represents number of posts with that tag. First 3 tag filters should be `Must`, `Recommended`, `Top`.
- [x] Implement responsive design for the blog listing page.
- [ ] Implement SEO-friendly URLs for blog listing and filtered views.
- [ ] Add unit and integration tests for filtering, searching, and rendering logic.
- [x] Add a visually distinct loading indicator while fetching and rendering the blog list, similar to the website's preloader.
- [ ] Style the blog listing to match the overall site design and ensure readability.
- [ ] Optimize performance for loading and rendering the blog list.
- [ ] Implement lazy loading for images within the blog excerpts.
- [ ] Test filtering and search functionality thoroughly.
- [ ] Ensure the blog listing is responsive across different devices including mobile, tablet, and desktop.
- [x] Implement pagination if the post count exceeds a certain threshold (10 posts per page).
- [ ] Ensure proper SEO metadata (title, description) is set for the blog listing page.
- [ ] Add social sharing buttons for popular platforms like Twitter, Facebook, LinkedIn.
- [x] Include a clear call-to-action at the end of the blog listing (e.g., “Subscribe to Newsletter” or “Contact VVG ONLINE”).
- [ ] Update `wwwroot/data/blog-index.json` generation script to include a summary of tags with post counts for display in the tag filter section. Also, ensure the tags are sorted by post count in descending order. And, update the script to include a list of years with post counts for the year filter dropdown. `wwwroot/data/blog-index.json` should now have a `tagsSummary` and `yearsSummary` section. `wwwroot/data/blogs` markdown files should updated accordingly if needed.
- [ ] Each blog listing should display blog category first (e.g., 'Tech', 'Business') before the title. Just like in `Home.razor`.
- [ ]`Home.razor` shoud have 3 most recent blog posts from `Blog.razor` under 'Latest Insights' section. Each post should display category, title, date, time to read, and link to blog post.
- [x] `Home.razor` Should maintain current design and layout while adding the blog posts. And, the link to `BlogArchives.razor`
- [ ] Update the blog listing page to include a "Time to Read" estimate for each post based on word count (e.g., 200 words = 1 minute).
- [ ] Ensure that the time to read estimate is calculated accurately and displayed correctly in the blog listing.
- [ ] Image urls in markdown should be converted to img tags with proper alt text for accessibility.

### 3.3 Individual Blog Post Page

- [ ] Implement `BlogPost.razor` to render individual blog posts based on slug.
- [ ] Load the corresponding markdown file from `wwwroot/data/blogs/{slug}.md` and render it as HTML.
- [ ] Include navigation links to previous/next posts based on publish date.
- [ ] Ensure proper SEO metadata (title, description) is set for each blog post page.
- [ ] Style the blog post page to match the overall site design and ensure readability.
- [ ] Implement responsive design for the blog post page.
- [ ] Add unit and integration tests for blog post rendering logic.

### 3.4 Archives, Filters, and Search

- [x] Provide a dedicated archives view with year/tag filters and search. Search box should be at the top. Followed by Years filter and then Tags filter.
- [x] Implement the `BlogArchives.razor` page with a search box at the top that filters posts by title and content.
- [x] Add year filter functionality.
- [x] Add tag filter functionality (single or multi-select).
- [x] Display posts grouped by year, respecting active filters and search query.

### 3.5 Sidebar and Table of Contents (TOC)

- [x] Provide a contextual sidebar with an optional collapsible TOC.
- [x] Include about/profile card, highlights, tags, and optional TOC on single post pages.
- [x] Generate the TOC from the post's heading structure (H2/H3).
- [x] Implement scrollspy functionality to highlight the currently visible section.
- [x] Ensure the sidebar is responsive and works well on mobile devices (e.g., collapsible or hidden by default).
- [x] Style the sidebar to match the overall site design and ensure readability.
- [x] Add a button for `Return to Top` functionality in the sidebar.

### 3.6 Interaction and Sharing

- [ ] Keep interaction minimal and focused on navigation and sharing.
- [ ] Add a “Copy link” action on single posts (copies canonical URL to clipboard).
- [ ] Implement a light-weight share button that triggers the browser’s native share dialog where supported.
- [ ] Include a clear call-to-action at the end of posts (e.g., “Contact VVG ONLINE” or “Explore services”).

## Additional Notes

- Ensure all changes are thoroughly tested and documented.
- Review and update any relevant documentation or user guides.
