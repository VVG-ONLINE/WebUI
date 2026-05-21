# Milestone 2: SEO and JSON-LD Setup

## Objectives
- Implement core SEO configuration files.
- Enable dynamic metadata and JSON-LD.

## Tasks

### 2.1 SEO JSON Files
- [ ] Create `src/wwwroot/data/metadata.json`.
- [ ] Create `src/wwwroot/data/twitter-card.json`.
- [ ] Create `src/wwwroot/data/open-graph.json`.
- [ ] Create `src/wwwroot/data/json-ld.json` for site-level structured data.

### 2.2 MetadataService Integration
- [ ] Update/implement `MetadataService.cs` to load all SEO JSON files.
- [ ] Ensure pages can specify page-specific metadata overrides.
- [ ] Inject `<meta>` tags and Open Graph/Twitter tags via `MetaTags.razor`.

### 2.3 JSON-LD Injection
- [ ] Extend `MetaTags.razor` (or a dedicated component) to emit a `<script type="application/ld+json">` block using `json-ld.json`.
- [ ] For blog posts (future), design shape for `BlogPosting` JSON-LD from post metadata.
- [ ] Validate JSON-LD with Google Rich Results test.