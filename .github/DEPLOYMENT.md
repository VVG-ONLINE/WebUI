# GitHub Pages Deployment Guide

This guide covers setting up and deploying the VVG ONLINE WebUI to GitHub Pages.

## Quick Start

### 1. Ensure GitHub Actions is Enabled

- Go to your repository on GitHub
- Navigate to **Settings** → **Actions** → **General**
- Under "Actions permissions", select **Allow all actions and reusable workflows**
- Click **Save**

### 2. Configure GitHub Pages

- Go to **Settings** → **Pages**
- Under "Build and deployment":
  - **Source**: Select **Deploy from a branch**
  - **Branch**: Select **gh-pages**
  - **Folder**: Select **/ (root)**
- Click **Save**

The `gh-pages` branch will be created automatically by the workflow on your first push.

### 3. Push to Deploy

Simply push to `main` or `master` branch:

```bash
git add .
git commit -m "Update content"
git push origin main
```

The GitHub Actions workflow will:
1. Install dependencies
2. Run TypeScript checks
3. Build the project
4. Deploy to GitHub Pages

### 4. View Your Site

After deployment completes (check the **Actions** tab):

**For project repository (e.g., `vvgonline/WebUI`):**
```
https://vvgonline.github.io/WebUI/
```

**For user/organization pages (e.g., `vvgonline/vvgonline.github.io`):**
```
https://vvgonline.github.io/
```

## Workflow Details

The CI/CD pipeline (`.github/workflows/deploy.yml`) runs on:
- ✅ Push to `main` or `master`
- ✅ Pull requests to `main` or `master` (build only, no deploy)

### Build Steps

1. **Checkout code** — Uses `actions/checkout@v4`
2. **Setup Node.js** — Uses `actions/setup-node@v4` with Node 20
3. **Install dependencies** — Runs `npm ci` (clean install)
4. **Type check** — Runs `npx tsc --noEmit` (TypeScript validation)
5. **Build** — Runs `npm run build` with `GITHUB_PAGES=true`
6. **Upload artifact** — Stores `dist/` folder
7. **Deploy** — Deploys to GitHub Pages (only on main/master push)

### Environment

The build system automatically sets:
- `GITHUB_PAGES=true` — Triggers GitHub Pages base path (`/WebUI/`)

## Configuration

### Repository Name

If your repository name is **not** `WebUI`, update `vite.config.ts`:

```typescript
const base = isGitHubPages ? '/YOUR-REPO-NAME/' : '/';
```

Example:
```typescript
const base = isGitHubPages ? '/my-website/' : '/';
```

### Custom Domain

To use a custom domain (e.g., `vvgonline.net`):

1. Go to **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Click **Save**
4. Add a `CNAME` record at your DNS provider:
   ```
   CNAME: vvgonline.net -> vvgonline.github.io
   ```

Wait 24-48 hours for DNS propagation.

## Monitoring Deployments

### View Workflow Status

1. Go to **Actions** tab in your repository
2. Click on a workflow run
3. Check "Build" and "Deploy" job logs

### Troubleshooting

#### Build Fails: "npm ERR! code ENOENT"
- Ensure `package-lock.json` is committed
- Verify `package.json` exists in root

#### Build Fails: "TypeScript errors"
- Check error message in Actions log
- Run locally: `npx tsc --noEmit`
- Fix issues in `src/` directory

#### Site Shows 404 After Deployment
- Wait 2-3 minutes for GitHub Pages to update
- Check repository name in `vite.config.ts`
- Verify `gh-pages` branch exists
- Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Del)

#### Styles/Assets Not Loading
- Verify base path is correct in `vite.config.ts`
- Check that all assets exist in `public/`
- Rebuild locally: `npm run build`

#### "gh-pages" Branch Doesn't Exist
- Check **Settings** → **Pages** configuration
- Ensure workflow has **write** permissions
- Manually trigger: Push a small change to `main`

## Rollback

To rollback to a previous deployment:

1. Go to **Settings** → **Pages**
2. Under "GitHub Pages is currently enabled", click the **dropdown**
3. Select a previous `gh-pages` deployment
4. Pages will update to that version

## Permissions

The workflow requires these GitHub permissions:
- `contents: read` — Read repository contents
- `pages: write` — Write to GitHub Pages
- `id-token: write` — OIDC token authentication

These are configured in `.github/workflows/deploy.yml`.

## Performance Tips

### Reduce Build Time
- Ensure `node_modules/` is cached (already configured)
- Use `npm ci` instead of `npm install` (already configured)

### Reduce Artifact Size
- Keep `dist/` output small
- Current: 0.25 MB (excellent)
- Blog images use data URIs (efficient)

### Deployment Performance
- GitHub Pages serves globally with CDN
- All assets cached aggressively (long expiry headers)

## Scheduled Deployments

To deploy on a schedule instead of on push:

Edit `.github/workflows/deploy.yml` and change the `on` trigger:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
```

## Advanced: Manual Deployment

To deploy without pushing to Git:

```bash
npm run build
# Manual upload to GitHub Pages
```

This is not recommended; using the CI/CD pipeline is better.

## Further Reading

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite GitHub Pages Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)

## Need Help?

Check the **Actions** tab logs for detailed error messages, or consult:
- README.md — General project documentation
- GitHub Issues — Report bugs or request features
