# VVG ONLINE - Digital Business Consulting & Innovation

> Blazor WebAssembly PWA with AI-powered chatbot, hosted on GitHub Pages

**Live Demo**: [test.vvgonline.net](https://test.vvgonline.net)

## Features

- **AI Chatbot** - Client-side intent classification using ONNX Runtime Web (~64MB DistilBERT model)
- **SEO Optimized** - Dynamic meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- **PWA Ready** - Service worker, offline support, installable on mobile
- **Responsive Design** - Mobile-first with golden ratio typography (EB Garamond + IBM Plex Sans)
- **Blog System** - Markdown-based blog with search, filtering, and table of contents
- **Dark/Light Theme** - Persisted user preference with smooth transitions

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | .NET 10, Blazor WebAssembly |
| AI/ML | ONNX Runtime Web, DistilBERT (quantized INT8) |
| Styling | Bootstrap 5.3, Custom CSS with golden ratio |
| Fonts | EB Garamond, IBM Plex Sans, IBM Plex Mono |
| Hosting | GitHub Pages (static) |
| Testing | xUnit, bunit |

## Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Git

### Run Locally

```bash
git clone https://github.com/vvgonline/test.vvgonline.net.git
cd test.vvgonline.net/src
dotnet run
```

App opens at `http://localhost:5152`

### Build & Publish

```bash
dotnet publish -c Release -o ../docs
```

## AI Chatbot

The chatbot runs entirely in the browser using a quantized ONNX intent classifier:

1. **Intent Classification** - DistilBERT model classifies user queries into 7 intent categories
2. **Q&A Retrieval** - Matches against JSONL dataset (710+ pairs) for relevant answers
3. **Fallback Responses** - Rule-based templates when no match found

### Retraining the Model

Complete instructions for converting JSONL datasets to ONNX models are in [`_jsonl-to-ONNX/`](_jsonl-to-ONNX/):

```bash
cd _jsonl-to-ONNX
./setup_and_convert.sh    # or setup_and_convert.bat on Windows
python convert_jsonl_to_onnx.py
```

## Project Structure

```
WebUI/
├── src/                    # Blazor WASM application
│   ├── wwwroot/            # Static assets (models, data, JS, CSS)
│   ├── Pages/              # Razor page components
│   ├── Components/         # Reusable UI components
│   └── Services/           # Business logic services
├── tests/                  # Test projects
│   └── VVG.Web.Tests/      # Unit & integration tests (35 tests)
├── docs/                   # Published output for GitHub Pages
├── scripts/                # Training scripts & datasets
└── _jsonl-to-ONNX/         # Model conversion tools
```

## Testing

```bash
# Run all tests
dotnet test

# Run with verbosity
dotnet test -v normal
```

All 35 tests must pass before deployment:
- **Asset Validation** (7) - Model, labels, data files
- **Component Tests** (9) - Blazor rendering & state
- **JS Interop Tests** (12) - JavaScript integration
- **Build/Integration** (7) - Publish & deployment

## Deployment

### GitHub Pages

1. Push `docs/` folder to repository
2. Configure: Settings > Pages > Source: Deploy from branch > `main` > `/docs`
3. Site live at `https://vvgonline.github.io/test.vvgonline.net/`

### CI/CD (Optional)

GitHub Actions workflow in `.github/workflows/deploy.yml` automates:
- Build on push to `main`
- Publish to `docs/` folder
- Deploy to GitHub Pages

## Performance

| Metric | Value |
|--------|-------|
| Initial Load | ~2-3s (model download) |
| Inference | <100ms per query |
| Model Size | 64.3MB (INT8 quantized) |
| Memory | ~150MB peak |
| Lighthouse | 90+ (Performance, Accessibility, SEO) |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS 14+, Android 9+

## License

MIT - See [LICENSE](LICENSE) for details.

---

Built with .NET 10 and Blazor WebAssembly. AI model powered by DistilBERT + ONNX Runtime.
