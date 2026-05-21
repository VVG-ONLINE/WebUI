# Milestones

This document outlines the key milestones for the `test.vvgonline.net` project.
```

We can also create specific milestone files such as:

**milestones/milestone-1.md:**

```markdown
# Milestone 1: Blazor WASM Application Setup

## Objectives
- Establish a Blazor WebAssembly (WASM) application.
- Set up the basic project structure and components.

## Key Tasks
- [ ] Create initial project structure using Blazor template.
- [ ] Implement basic pages like `Home.razor`, `Services.razor`, etc.
- [ ] Ensure basic styling is in place.
```

**milestones/milestone-2.md:**

```markdown
# Milestone 2: SEO Configuration

## Objectives
- Implement comprehensive SEO features.
- Set up PWA and ensure offline capabilities.

## Key Tasks
- [ ] Create `metadata.json`, `twitter-card.json`, and `open-graph.json` in `src/wwwroot/data/`.
- [ ] Integrate `MetadataService.cs` to dynamically set meta tags based on JSON files.
- [ ] Configure `service-worker.js` for PWA functionality.
```

**milestones/milestone-3.md:**

```markdown
# Milestone 3: Blog and Search

## Objectives
- Implement search and filtering capabilities.
- Populate blog posts from existing content.

## Key Tasks
- [ ] Create `Blog.razor` page with search and filter functionality.
- [ ] Extract existing blog posts to populate the new blog structure.
```

**milestones/milestone-4.md:**

```markdown
# Milestone 4: Themes and Animations

## Objectives
- Implement theme toggle.
- Enhance hero banners with animations.

## Key Tasks
- [ ] Create `ThemeToggle.razor` component.
- [ ] Update `HeroBanner.razor` for smooth scroll animations.
```

**milestones/milestone-5.md:**

```markdown
# Milestone 5: Data Visualization

## Objectives
- Integrate chart components for statistics.

## Key Tasks
- [ ] Create `Chart.razor` component.
- [ ] Populate charts with data from `facts-figures.json`.
```

**milestones/milestone-6.md:**

```markdown
# Milestone 6: PWA Features

## Objectives
- Ensure complete PWA functionality.

## Key Tasks
- [ ] Verify offline capabilities.
- [ ] Test the install prompt for PWAs.
```

**milestones/milestone-7.md:**

```markdown
# Milestone 7: Sitemap and Robots.txt

## Objectives
- Generate sitemap.xml dynamically.
- Ensure proper configuration of `robots.txt`.

## Key Tasks
- [ ] Implement dynamic sitemap generation.
- [ ] Configure `robots.txt` for search engine optimization.
```

**milestones/milestone-8.md:**

```markdown
# Milestone 8: SEO Metadata Verification

## Objectives
- Verify and enhance individual pages with SEO metadata.

## Key Tasks
- [ ] Ensure `MetadataService.cs` is used to set unique SEO metadata for each page.
```

### Quality.toml File

Now, let's create the `quality.toml` file inside the `/specs` folder:

**/specs/quality.toml:**

```toml
[style]
max_line_length = 80
indent_style = "space"
indent_size = 2

[naming]
function_prefixes = ["fn_"]
variable_prefixes = ["var_"]

[formatting]
insert_space_after_keywords_in_control_flow_statements = true
insert_space_between_parentheses_in_calls = false
```

### Tasks Files

We can create a `tasks` directory and add individual task files. For example:

**/specs/tasks/088-task-blog-content-blog-names.md:**

```markdown
# 088-Task-Blog-Content-Blog-Names

## Objective
Extract blog post names from existing content to populate the new blog structure.

## Steps
1. Access the existing blog section of the [site](https://vvgonline.net/#insights).
2. Extract the titles of all blog posts.
3. Create individual `blog-posts.md` files in `src/wwwroot/data/blogs/` with the extracted blog names.

## Resources
- [Existing Blog Section](https://vvgonline.net/#insights)