# VVG ONLINE WebUI

A modern, high-performance static website for VVG ONLINE digital consulting services. Built with **TypeScript**, **Vite**, **SCSS**, and **Web Components**.

## Features

- ⚡ **Fast Build** — Vite-powered builds in <1 second
- 🔧 **Type-Safe** — Full TypeScript with strict mode
- 🎨 **Custom Components** — Web Components architecture
- 📱 **PWA Ready** — Progressive Web App with offline support
- 🎯 **Multi-page** — 6 optimized HTML pages with code-splitting
- 📊 **Blog System** — Markdown-based blog with metadata
- 🔍 **SEO Optimized** — Proper meta tags, OG tags, structured data
- 📦 **Tiny Bundle** — 21.59 kB JS + 5.06 kB CSS (gzipped)

## Tech Stack

- **Build Tool**: Vite 5.4
- **Language**: TypeScript 5.4
- **Styling**: SCSS with Bootstrap 5
- **Components**: Custom Web Components
- **Markdown**: marked.js for blog rendering
- **PWA**: Workbox-based service worker
- **Graphics**: THREE.js (optional 3D effects)

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/vvgonline/WebUI.git
cd WebUI

# Install dependencies
npm install
```

### Development

```bash
# Start dev server with hot reload
npm run dev

# The server opens at http://localhost:3000
```

### Build for Production

```bash
# Build the project
npm run build

# Build output is in the `dist/` directory
```

### Preview Production Build

```bash
# Preview the production build locally
npm run preview

# Opens at http://localhost:4173
```

## Project Structure

```
WebUI/
├── src/
│   ├── main.ts              # Entry point
│   ├── types.ts             # TypeScript type definitions
│   ├── styles/              # SCSS stylesheets
│   │   ├── main.scss        # Main stylesheet
│   │   ├── _variables.scss
│   │   ├── _base.scss
│   │   ├── _components.scss
│   │   ├── _responsive.scss
│   │   └── ...
│   └── components/          # Web Components
│       ├── PageHeader.ts
│       ├── Hero.ts
│       ├── Services.ts
│       ├── BlogList.ts
│       ├── Workflow.ts
│       ├── AITerminal.ts
│       ├── Footer.ts
│       └── ...
├── public/
│   ├── data/                # JSON data files
│   │   ├── site.json        # Site configuration
│   │   ├── services.json    # Services data
│   │   ├── blog-index.json  # Blog metadata
│   │   ├── workflow.json    # Workflow stages
│   │   └── ...
│   ├── content/blog/        # Markdown blog posts
│   ├── pwa/                 # PWA icons
│   └── manifest.json        # PWA manifest
├── dist/                    # Build output (generated)
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
├── index.html               # Home page
├── blog.html                # Blog listing
├── blog-post.html           # Blog post template
├── services.html            # Services page
├── about.html               # About page
├── contact.html             # Contact page
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Page Routes

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Main landing page with hero, services, insights, workflow |
| Services | `/services.html` | Detailed services and offerings |
| About | `/about.html` | Company information |
| Blog | `/blog.html` | Blog listing with filtering and search |
| Blog Post | `/blog-post.html?slug={slug}` | Individual blog post reader |
| Contact | `/contact.html` | Contact form |

## Data Files

### `site.json`

Global site configuration including navigation, social links, and branding.

### `services.json`

Service offerings with descriptions, icons, and sub-services.

### `blog-index.json`

Blog post metadata (title, slug, date, tags, excerpt, featured flag).

### `blog-images.json`

Hero images for blog posts (SVG or URL-based).

### `workflow.json`

Operational workflow stages with hex codes, titles, and descriptions.

## Web Components

### Custom Elements

- `<page-header>` — Reusable page header
- `<insights-grid>` — Blog insights display
- `<services-grid>` — Services grid layout
- `<workflow-section>` — Animated workflow visualization
- `<system-panel>` — Navigation panel with theme toggle
- `<ai-terminal>` — AI chatbot interface
- `<app-footer>` — Footer component
- `<blog-list>` — Blog listing with filters
- `<blog-post-reader>` — Blog post renderer
- `<back-to-top>` — Scroll-to-top button

## Blog System

### Adding a Blog Post

1. **Create markdown file** in `public/content/blog/`

   ```bash
   public/content/blog/my-post.md
   ```

2. **Add metadata entry** in `public/data/blog-index.json`

   ```json
   {
     "title": "My Blog Post",
     "slug": "my-post",
     "filename": "my-post.md",
     "publishedAt": "2026-05-19",
     "tags": ["Business", "Strategy"],
     "excerpt": "Brief excerpt...",
     "draft": false,
     "category": "Business",
     "featured": false,
     "timeToRead": 5
   }
   ```

3. **Optionally add hero image** in `public/data/blog-images.json`

   ```json
   {
     "my-post": {
       "hero": "data:image/svg+xml,%3C...",
       "gallery": []
     }
   }
   ```

## CI/CD & GitHub Pages Deployment

### Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. **Triggers on**: Push to `main`/`master` or pull requests
2. **Runs**:
   - Installs dependencies (`npm ci`)
   - TypeScript type checking (`npx tsc --noEmit`)
   - Builds project (`npm run build`)
3. **Deploys to**: GitHub Pages on successful build

### Manual GitHub Pages Setup

If this is your first deployment, enable GitHub Pages in your repository:

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages**
   - Folder: **/ (root)**
3. Click **Save**

The workflow will create the `gh-pages` branch automatically on first deployment.

### Repository Name Update

If your repository name is NOT `WebUI`, update `vite.config.ts`:

```typescript
// Change this line in vite.config.ts
const base = isGitHubPages ? '/YOUR-REPO-NAME/' : '/';
```

### Deploy Environment

The build sets `GITHUB_PAGES=true` to automatically adjust the base path for GitHub Pages.

### View Deployed Site

After successful deployment:

- **User/Organization Pages**: `https://username.github.io/`
- **Project Pages**: `https://username.github.io/WebUI/`

Check the **Actions** tab to see deployment status.

## Development Commands

```bash
# Development server with HMR
npm run dev

# Type checking without emitting files
npx tsc --noEmit

# Build for production
npm run build

# Preview production build locally
npm run preview

# Install dependencies
npm install

# Audit for security vulnerabilities
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix
```

## Environment Variables

No environment variables are required for development. For GitHub Pages deployment, the build system automatically sets:

```
GITHUB_PAGES=true
```

This adjusts the Vite `base` configuration to `/WebUI/` for proper asset serving.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Performance Targets

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- JavaScript bundle: < 30 kB (gzipped)
- CSS bundle: < 10 kB (gzipped)

Current metrics:

- JS: 21.59 kB (gzipped) ✓
- CSS: 5.06 kB (gzipped) ✓
- Build time: 784ms ✓

## Security

- ✅ No vulnerabilities in production dependencies
- ✅ TypeScript strict mode enabled
- ✅ CSP-friendly (no inline scripts)
- ✅ Secure headers recommended (configure via hosting)

## Troubleshooting

### Build fails with TypeScript errors

```bash
npx tsc --noEmit
```
Check `tsconfig.json` and resolve type issues.

### GitHub Pages shows 404

1. Verify repository name in `vite.config.ts`
2. Check that `gh-pages` branch exists
3. Verify Pages settings point to `gh-pages` branch
4. Wait 2-3 minutes after push for deployment

### Markdown blog posts not loading

1. Ensure `blog-index.json` has matching entries
2. Verify markdown filenames match `filename` field
3. Check slug matches between index and URL parameter

### Styles not applying

1. Rebuild: `npm run build`
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check SCSS compilation in build output

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run build` to verify
4. Commit and push
5. Create a pull request

## License

See [LICENSE](./LICENSE) file for details.

## Contact

- Website: [vvgonline.net](https://vvgonline.net)
- LinkedIn: [@vvgonline](https://www.linkedin.com/in/vvgonline/)
- GitHub: [@vvgonline](https://github.com/VVG-ONLINE)
