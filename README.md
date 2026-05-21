# test.vvgonline.net

Repo to test new features of [VVG ONLINE's](www.vvgonline.net) website

Project created: 01-12-2025

Project goals:

- setup a Blazor WASM app with SEO optimization in mind, a dynamic head tag with keywords, description, Open Graph metadata, Twitter card, JSON-LD, and a blog. 
- Design should be elegant, clean, minimal, and modern.
- App will be hosted it on GitHub Pages And, its' [url](test.vvgonline.net)

## Blazor WebAssembly PWA Project Structure

```md
VVG.online.WEB.Test.PWA/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── specs/
│ ├── 0_Project_Vision.md
│ ├── 1_Product_Requirements.md
│ ├── 2_Architecture.md
│ ├── 3_Roadmap.md
│ ├── milestones/
│ └── tasks/
├── quality.toml
└── src/
├── VVG.online.WEB.Test.PWA.csproj
├── Program.cs
├── App.razor
├── appsettings.json
├── wwwroot/
│   ├── index.html
│   ├── css/
│   │   ├── bootstrap.min.css (v5.3)
│   │   └── app.css (custom styles with golden ratio)
│   ├── js/
│   │   ├── interop.js (language translation, scroll, WhatsApp)
│   │   └── service-worker.js (PWA)
│   ├── data/
│   │   ├── services.json (metadata for 10 services)
│   │   ├── blog-posts.json (blog metadata)
│   │   └── facts-figures.json (statistics for charts)
│   ├── manifest.json (PWA manifest)
│   ├── icons/ (SVG icons)
│   └── favicon.ico
├── Pages/
│   ├── Home.razor
│   ├── Services.razor
│   ├── Blog.razor
│   ├── BlogPost.razor
│   ├── Contact.razor
│   ├── Presentations.razor
│   └── NotFound.razor
├── Components/
│   ├── Header.razor
│   ├── Footer.razor
│   ├── HeroBanner.razor (animated, 100vh)
│   ├── ServiceCard.razor
│   ├── BlogCard.razor
│   ├── MetaTags.razor (SEO, OpenGraph, JSON-LD)
│   ├── CookieConsent.razor
│   ├── Preloader.razor
│   ├── ScrollToTop.razor
│   ├── WhatsAppButton.razor
│   ├── LanguageToggle.razor
│   ├── Chart.razor (for data visualization)
│   └── LazyImage.razor
└── Models/
    ├── Service.cs
    ├── BlogPost.cs
    ├── Statistics.cs
    └── SEOData.cs
```

### Key Features

- Responsive Design
  - Mobile-first approach
  - Bootstrap 5.3 for responsive grid
  - CSS media queries for tablet/desktop
  - Responsive images with lazy loading

- Golden Ratio Typography
  - Base font size: 16px (1em)
  - Heading scale: 1.618x multiplier
  - EB Garamond for headings
  - IBM Plex Sans for body text

- Theme Toggle
  - Light theme: #d9d9d9 background
  - Dark theme: #0f172a background
  - Accent color: #ffdd33 (golden)
  - Persisted in localStorage

- Animated 100vh Hero Banners
  - Full-screen hero sections on each page
  - Gradient overlays with accent color
  - Smooth scroll animation
  - SVG background patterns

- Blog with Search & Filter
  - Dynamic meta tags per page
  - OpenGraph tags for social sharing
  - Twitter Card metadata
  - JSON-LD structured data (Organization, Article, WebSite)
  - Canonical URLs

- PWA Features
  - Manifest.json with app details
  - Service Worker for offline capability
  - Install prompt on browsers
  - Add to home screen

- Lazy Loading
  - Images load on-demand
  - Scripts loaded asynchronously
  - Preloader shown during initial load
  - Intersection Observer API for lazy images

- Interactive Components
  - Scroll-to-top button with smooth scroll
  - WhatsApp chat button (+919893261959)
  - Language toggle (Google Translate API integration)
  - Cookie consent dialog
  - Charts/graphs for statistics

- Blazor Components (C# Only)
  - No TypeScript/JavaScript logic
  - Server-side rendering with client-side interop for minimal JS
  - Component composition for modularity
  - Parameters for dynamic content

## Installation & Setup

### Prerequisites

- .NET 8 SDK or higher
- Visual Studio 2022 or VS Code
- Git

### Create Project

```bash
dotnet new blazorwasm -n VVG.online.WEB.Test.PWA --pwa
cd VVG.online.WEB.Test.PWA
```

### Add NuGet Packages

```bash
dotnet add package Microsoft.AspNetCore.Components.WebAssembly
dotnet add package System.Net.Http.Json
```

## GitHub Pages Deployment

### CI/CD Workflow (.github/workflows/deploy.yml)

See separate deploy.yml file for GitHub Actions configuration.

### Deploy Steps

1. Commit and push to main branch
2. GitHub Actions automatically:
   - Builds Blazor WASM app
   - Generates optimized bundle
   - Deploys to gh-pages branch
3. App goes live at: `https://vvgonline.github.io/VVG.online.WEB.Test.PWA/`

### Configure Repository

1. Go to Settings > Pages
2. Source: GitHub Actions
3. Branch: gh-pages
4. Enable GitHub Pages

## Data Structure (JSON)

### services.json

```json
{
  "services": [
    {
      "id": 1,
      "title": "Digital Strategy",
      "description": "...",
      "icon": "strategy.svg",
      "details": "..."
    }
  ]
}
```

### blog-posts.json

```json
{
  "posts": [
    {
      "id": 1,
      "title": "...",
      "slug": "...",
      "author": "...",
      "date": "2025-11-28",
      "readTime": 8,
      "tags": ["ai", "transformation"],
      "excerpt": "...",
      "content": "...",
      "featuredImage": "blog-1.svg"
    }
  ]
}
```

### facts-figures.json

```json
{
  "statistics": [
    {
      "category": "Market Size",
      "value": "268.46",
      "unit": "billion USD",
      "year": 2025,
      "growth": "7.4%"
    }
  ]
}
```

## Styling with Golden Ratio

### Font Sizes

- H1: 2.618rem (42.7px)
- H2: 1.618rem (25.9px)
- H3: 1.414rem (22.6px)
- Body: 1rem (16px)
- Small: 0.618rem (9.9px)

### Spacing Scale

- Base unit: 8px
- Multiples: 8, 16, 24, 32, 52, 84...

### Layout

- Column width: 64px + 16px gutter
- Container max-width: 1200px
- Aspect ratios: 16:9, 4:3, 1:1

## Performance Optimization

- Tree-shaking: enabled
- Trimming: enabled
- GZip compression
- Image optimization with SVGs
- Lazy component loading
- Code splitting

## SEO Checklist

- [x] Meta tags (title, description, keywords)
- [x] OpenGraph tags for social sharing
- [x] Twitter Card metadata
- [x] JSON-LD structured data
- [x] Canonical URLs
- [x] Mobile-responsive design
- [x] Fast page load (critical CSS)
- [x] Sitemap (future)
- [x] Robots.txt (future)
- [x] Alt text for all images
- [x] Semantic HTML

## Components Overview

### MetaTags.razor

Dynamically sets page-specific SEO metadata

### HeroBanner.razor

Full-screen animated hero with gradient overlay

### LazyImage.razor

Progressive image loading with blur-up effect

### CookieConsent.razor

GDPR-compliant cookie notice

### Preloader.razor

Loading animation during initial page load

### Chart.razor

Data visualization using Chart.js or similar

## Testing & Deployment

### Local Testing

```bash
dotnet run --configuration Release
```

### Build for Production

```bash
dotnet publish -c Release
```

### Test PWA

- Open DevTools > Application > Manifest
- Verify manifest.json loads correctly
- Check Service Worker registration
- Test offline functionality

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: iOS 14+, Android 9+

---

**Next Steps:**

1. Review this structure
2. Confirm all requirements are met
3. Proceed with file-by-file implementation

---

### Meta Tags and more

Open https://github.com/login/device in a new tab and paste your one-time code: 1E13-3A4F
The meta tags for the application are handled dynamically. The `MetaTags` component, located in `src/Shared/MetaTags.razor`, is responsible for rendering the meta tags in the `<head>` of the document.

The `MetaTags` component uses the `MetadataService` to fetch the metadata from JSON files located in the `src/wwwroot/assets/data` folder. The `MetadataService` fetches the default metadata from `metadata.json`, `twitter-card.json`, and `open-graph.json`.

To modify the default meta tags, you can edit the JSON files in the `src/wwwroot/assets/data` folder.

To set page-specific meta tags, you can inject the `MetadataService` into your page component and call the `SetPageMetadata` method. For example:

```csharp
@page "/"
@inject VVG.Web.Services.MetadataService MetadataService

<PageTitle>Home</PageTitle>

@code {
    protected override void OnInitialized()
    {
        MetadataService.SetPageMetadata(new PageMetadata
        {
            Title = "VVG ONLINE — Home",
            Description = "VVG ONLINE digital business consulting",
            Keywords = "digital,consulting,ai,transformation"
        });
    }
}
```

The `PageMetadata` object has properties for the title, description, keywords, image, and Open Graph and Twitter Card data.
