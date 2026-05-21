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

---

## Future Considerations (Revisit Later)

### Deployment
- **Upgrade .NET version**: Change `10.0.101` to `10.0.x` in `deploy.yml` for automatic patch updates (currently pinned for stability)
- **Verify publish output path**: Confirm whether `dotnet publish -o release` outputs to `release/` or `release/wwwroot/` on CI runner. If files are at `release/`, update all copy/verify/deploy steps accordingly
- **Switch to official GitHub Pages action**: Consider migrating from `JamesIves/github-pages-deploy-action@v4` to `actions/deploy-pages@v4` with `actions/upload-pages-artifact@v3` for native GitHub Pages integration
- **ONNX model size warning**: GitHub flagged 64MB model exceeding 50MB recommendation. Consider Git LFS enforcement or model splitting if issues arise

### Performance
- **Enable Brotli compression**: Verify `.br` files are served with `Content-Encoding: br` on GitHub Pages
- **Service worker optimization**: Review cache strategy for 64MB ONNX model — consider IndexedDB instead of HTTP cache
- **Lazy-load ONNX model**: Only load when user opens chat, not on page load

### Security
- **Content Security Policy**: Add CSP headers via `<meta>` tags in `index.html`
- **Subresource Integrity**: Add `integrity` attributes to CDN script tags (Bootstrap, ONNX Runtime, etc.)

---

## Suggested Future Features

### AI/ML Enhancements
| Feature | Description | Effort |
|---------|-------------|--------|
| Confidence thresholding | Only use Q&A retrieval when intent confidence > 0.7, otherwise fallback | 2 hrs |
| Proper BERT tokenizer | Replace simple whitespace tokenizer with actual DistilBERT tokenizer via ONNX | 4 hrs |
| User feedback loop | Thumbs up/down on responses to collect training data | 3 hrs |
| Multi-intent detection | Support queries that span multiple intent categories | 4 hrs |
| Model fine-tuning pipeline | Automated retraining when new Q&A pairs are added | 8 hrs |
| Smaller model option | Explore MiniLM or TinyBERT for faster loading (<20MB) | 6 hrs |

### UX Improvements
| Feature | Description | Effort |
|---------|-------------|--------|
| Chat typing indicator | Show "thinking..." animation while model processes | 1 hr |
| Reading progress bar | Visual indicator on blog post pages | 1 hr |
| Keyboard shortcuts | Ctrl+K for search, Esc to close chat, etc. | 2 hrs |
| Dark/light auto-detect | Follow OS preference with `prefers-color-scheme` | 30 min |
| Smooth page transitions | Fade/slide animations between pages | 2 hrs |
| Scroll-to-top on navigation | Auto-scroll when navigating between pages | 15 min |

### Content & SEO
| Feature | Description | Effort |
|---------|-------------|--------|
| Dynamic sitemap.xml | Generate from blog posts and pages at build time | 2 hrs |
| RSS/Atom feed | Auto-generated feed for blog subscribers | 2 hrs |
| Open Graph image generation | Dynamic OG images per blog post with title/author | 4 hrs |
| Case studies section | Dedicated page for client success stories | 4 hrs |
| Video presentations embed | Embed YouTube/Vimeo presentations on Services page | 2 hrs |
| Multi-language support | Hindi/English toggle for content | 8 hrs |

### Analytics & Insights
| Feature | Description | Effort |
|---------|-------------|--------|
| Privacy-friendly analytics | Plausible or Fathom for page views (no cookies) | 1 hr |
| Chat interaction tracking | Track intents, fallbacks, satisfaction (anonymous) | 3 hrs |
| Search analytics | Track what users search for in chat | 2 hrs |
| Lighthouse CI | Automated performance audits on every PR | 2 hrs |

### Developer Experience
| Feature | Description | Effort |
|---------|-------------|--------|
| Playwright E2E tests | Browser-level tests for chat flow, navigation | 6 hrs |
| Accessibility testing | axe-core integration in CI pipeline | 2 hrs |
| PR preview deployments | Deploy PRs to temporary URLs for review | 3 hrs |
| Automated dependency updates | Dependabot for NuGet and npm packages | 30 min |
| Code coverage reporting | Coverlet + Codecov integration | 2 hrs |

### Infrastructure
| Feature | Description | Effort |
|---------|-------------|--------|
| Custom domain SSL | Configure CNAME for test.vvgonline.net with HTTPS | 1 hr |
| CDN caching headers | Optimize Cache-Control for static assets | 1 hr |
| Staging environment | Separate branch for pre-production testing | 2 hrs |
| Automated backups | Scheduled backup of JSONL dataset and model | 2 hrs |
