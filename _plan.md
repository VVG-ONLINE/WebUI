# VVG ONLINE WebUI - Implementation Plan

**Based on:** Code Review by Qwen 3.6 Plus (2026-05-21)
**Project:** `test.vvgonline.net` — Blazor WebAssembly PWA

---

## Phase 1: Critical Fixes (Immediate)

### 1.1 Remove Duplicate Script Tags
**File:** `src/wwwroot/index.html`
**Action:** Remove duplicate lines 176-180 (Transformers.js and chat.js loaded twice)
**Estimated effort:** 5 min

### 1.2 Remove Test Packages from Main Project
**File:** `src/VVG.Web.csproj`
**Action:** Move `bunit`, `xunit`, `Moq` package references to `tests/VVG.Web.Tests/VVG.Web.Tests.csproj` only
**Estimated effort:** 10 min

### 1.3 Replace `eval()` Calls with Proper JS Interop
**Files:**
- `src/Services/ThemeService.cs:54`
- `src/Layout/MainLayout.razor.cs:232`
- `src/wwwroot/assets/js/theme.js` (add `setBodyClass` function)
- `src/wwwroot/assets/js/chat.js` (add `scrollToBottom` function)

**Action:** Create dedicated JS functions and call via `JS.InvokeVoidAsync`
**Estimated effort:** 30 min

### 1.4 Enable Blazor Compression
**File:** `src/VVG.Web.csproj`
**Action:** Change `<BlazorEnableCompression>false</BlazorEnableCompression>` to `true`
**Estimated effort:** 2 min

### 1.5 Add ErrorBoundary to App.razor
**File:** `src/App.razor`
**Action:** Wrap `<RouteView>` with `<ErrorBoundary>` and create `Shared/ErrorBoundaryFallback.razor`
**Estimated effort:** 20 min

---

## Phase 2: High Priority Fixes

### 2.1 Extract AI Terminal from MainLayout
**New Files:**
- `src/Shared/VikasAiTerminal.razor`
- `src/Shared/VikasAiTerminal.razor.cs`
- `src/Services/KnowledgeBaseService.cs`

**Action:** Move all AI chat logic, knowledge base loading, and related models from `MainLayout.razor.cs` into dedicated component and service
**Estimated effort:** 2-3 hours

### 2.2 Consolidate Duplicate tagCounts in Blog.razor
**File:** `src/Pages/Blog.razor`
**Action:** Remove `_tagCounts` dictionary (line 656) and `GetTagCount()` method. Use only `tagCounts` populated by `CalculateTagCounts()`
**Estimated effort:** 15 min

### 2.3 Add FeaturedImage to BlogPost Model
**Files:**
- `src/Models/BlogPost.cs` - add `public string? FeaturedImage { get; set; }`
- `src/Pages/Blog.razor` - update `GetPostImage()` to use `post.FeaturedImage`
- `tools/Indexer/Program.cs` - extract featured image from front-matter if present
**Estimated effort:** 45 min

### 2.4 Filter Draft Posts in Blog Listing
**File:** `src/Pages/Blog.razor`
**Action:** Add `.Where(p => !p.Draft)` in `OnInitializedAsync` after loading posts
**Estimated effort:** 5 min

### 2.5 Cache MarkdownPipeline
**File:** `src/Pages/BlogPostPage.razor`
**Action:** Make pipeline a static readonly field or inject as singleton service
**Estimated effort:** 10 min

### 2.6 Fix Contact Form Submission
**File:** `src/Pages/Contact.razor`
**Action:** Replace `mailto:` with Formspree/Netlify Forms integration or simple API endpoint. Add success/error states.
**Estimated effort:** 1-2 hours

---

## Phase 3: Medium Priority Fixes

### 3.1 Create CI/CD Pipeline
**New File:** `.github/workflows/deploy.yml`
**Action:** Create GitHub Actions workflow with:
- Build on push to `main`
- Run tests
- Publish to GitHub Pages
- Cache NuGet packages
**Estimated effort:** 1-2 hours

### 3.2 Add .editorconfig
**New File:** `.editorconfig`
**Action:** Generate from `specs/quality.toml` standards
**Estimated effort:** 30 min

### 3.3 Fix CSS Duplication
**File:** `src/wwwroot/assets/css/app.css`
**Action:** Remove duplicate `body` and `.insight-tag` definitions. Merge into single declarations.
**Estimated effort:** 15 min

### 3.4 Fix MetaTags async void
**File:** `src/Shared/MetaTags.razor`
**Action:** Wrap `HandleMetadataChanged` in try-catch or use `InvokeAsync` with proper error handling
**Estimated effort:** 10 min

### 3.5 Standardize Route Casing
**Files:**
- `src/Pages/About.razor` → `@page "/about"`
- `src/Pages/BlogArchives.razor` → `@page "/blog/archives"`
- Update all internal navigation links
**Estimated effort:** 30 min

### 3.6 Fix TableOfContents Scroll Methods
**File:** `src/Shared/TableOfContents.razor`
**Action:** Implement actual JS interop for `ScrollToHeading` and `ScrollToTop` using `window.scrollTo` or `element.scrollIntoView`
**Estimated effort:** 20 min

### 3.7 Standardize JSON Path Conventions
**Action:** Choose single base path (`data/` or `assets/data/`) and update all references consistently
**Estimated effort:** 30 min

---

## Phase 4: Low Priority / Cleanup

### 4.1 Remove Orphaned MetaTest.cs
**File:** `src/MetaTest.cs`
**Action:** Delete file
**Estimated effort:** 2 min

### 4.2 Move Test Files from Pages Directory
**Files:** `src/Pages/BlogPostTests.cs`, `src/Pages/BlogPostSidebarTests.cs`
**Action:** Move to `tests/VVG.Web.Tests/Components/`
**Estimated effort:** 10 min

### 4.3 Remove or Populate package.json
**File:** `package.json`
**Action:** Either delete or add linting/formatting scripts (e.g., `dotnet format`, `dotnet test`)
**Estimated effort:** 15 min

### 4.4 Add robots.txt and sitemap.xml
**New Files:**
- `src/wwwroot/robots.txt`
- `src/wwwroot/sitemap.xml`
**Action:** Create static files with proper SEO entries
**Estimated effort:** 30 min

### 4.5 Optimize Knowledge Base Loading
**File:** `src/Services/KnowledgeBaseService.cs` (after Phase 2.1)
**Action:** Implement lazy loading or chunked loading instead of loading all content at once
**Estimated effort:** 1-2 hours

### 4.6 Optimize chat.js Dataset Loading
**File:** `src/wwwroot/assets/js/chat.js`
**Action:** Load JSONL dataset asynchronously with progress indicator, or implement indexedDB caching
**Estimated effort:** 1 hour

### 4.7 Fix MockHttpHandler in Tests
**File:** `tests/VVG.Web.Tests/Components/MainLayoutTests.cs`
**Action:** Return proper mock responses instead of 404 for expected endpoints
**Estimated effort:** 30 min

---

## Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Duplicate scripts | 5 min | High |
| P0 | Test packages in main project | 10 min | High |
| P0 | eval() usage | 30 min | High |
| P0 | Enable compression | 2 min | High |
| P0 | ErrorBoundary | 20 min | High |
| P1 | Extract AI Terminal | 2-3 hrs | High |
| P1 | Consolidate tagCounts | 15 min | Medium |
| P1 | FeaturedImage model | 45 min | Medium |
| P1 | Filter draft posts | 5 min | Medium |
| P1 | Cache MarkdownPipeline | 10 min | Medium |
| P1 | Contact form backend | 1-2 hrs | Medium |
| P2 | CI/CD pipeline | 1-2 hrs | High |
| P2 | .editorconfig | 30 min | Medium |
| P2 | CSS duplication | 15 min | Low |
| P2 | async void fix | 10 min | Medium |
| P2 | Route casing | 30 min | Low |
| P2 | TOC scroll fix | 20 min | Medium |
| P2 | JSON paths | 30 min | Low |
| P3 | Cleanup tasks | 1-2 hrs total | Low |

---

## Execution Order

1. Phase 1 (all items) — Quick wins, high impact
2. Phase 2 items 2.2, 2.3, 2.4, 2.5 — Low effort, good impact
3. Phase 2 items 2.1, 2.6 — Higher effort, structural improvements
4. Phase 3 (all items) — Medium priority improvements
5. Phase 4 (all items) — Cleanup and optimization

**Total estimated effort:** 8-12 hours
