import { marked } from 'marked';
import type { BlogIndexEntry } from '../types';

class BlogPostReader {
  private post: BlogIndexEntry | null = null;

  async load(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) {
      this.showError('Post not found');
      return;
    }

    try {
      const res = await fetch('data/blog-index.json');
      const posts: BlogIndexEntry[] = await res.json();
      this.post = posts.find((p) => p.slug === slug) || null;

      if (!this.post) {
        this.showError('Post not found');
        return;
      }

      this.updateMeta();
      await this.renderContent();
      this.initReadingProgressBar();
      this.initTOC();
    } catch (error) {
      console.error('Failed to load blog post:', error);
      this.showError('Failed to load post');
    }
  }

  private showError(message: string): void {
    const titleEl = document.getElementById('post-title');
    if (titleEl) titleEl.textContent = message;
  }

  private updateMeta(): void {
    if (!this.post) return;

    document.title = `${this.post.title} | VVG ONLINE`;

    const titleEl = document.getElementById('post-title');
    if (titleEl) titleEl.textContent = this.post.title;

    const metaEl = document.getElementById('post-meta');
    if (metaEl) {
      const dateStr = new Date(this.post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      metaEl.innerHTML = `
        <div class="blog-post-meta">
          <time datetime="${this.post.publishedAt}">${dateStr}</time>
          <span>${this.post.timeToRead} min read</span>
          <div class="blog-post-tags">
            ${this.post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', this.post.excerpt);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', this.post.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', this.post.excerpt);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', this.post.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', this.post.excerpt);
  }

  private async renderContent(): Promise<void> {
    if (!this.post) return;

    const contentEl = document.getElementById('post-content');
    if (!contentEl) return;

    try {
      const mdRes = await fetch(`content/blog/${this.post.filename}`);
      if (!mdRes.ok) throw new Error('Markdown file not found');

      const md = await mdRes.text();
      const contentWithoutFrontmatter = this.removeFrontmatter(md);

      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      contentEl.innerHTML = marked.parse(contentWithoutFrontmatter) as string;
      contentEl.classList.add('article-content');
    } catch (error) {
      console.error('Failed to render markdown:', error);
      contentEl.innerHTML = '<p class="text-danger">Failed to load article content.</p>';
    }
  }

  private removeFrontmatter(md: string): string {
    if (md.startsWith('---')) {
      const endIndex = md.indexOf('---', 3);
      if (endIndex !== -1) {
        return md.slice(endIndex + 3).trim();
      }
    }
    return md;
  }

  private initReadingProgressBar(): void {
    const progressBar = document.getElementById('reading-progress');
    if (!progressBar) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      (progressBar as HTMLElement).style.width = `${progress}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  private initTOC(): void {
    const contentEl = document.getElementById('post-content');
    const tocListEl = document.getElementById('toc-list');
    if (!contentEl || !tocListEl) return;

    const headings = contentEl.querySelectorAll('h2, h3, h4');
    if (headings.length === 0) {
      const tocSidebar = document.getElementById('toc-sidebar');
      if (tocSidebar) tocSidebar.style.display = 'none';
      return;
    }

    const tocItems: string[] = [];
    const headingIds: string[] = [];

    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      (heading as HTMLElement).id = id;
      headingIds.push(id);

      const level = heading.tagName.toLowerCase();
      const text = heading.textContent || '';
      tocItems.push(`<li><a href="#${id}" class="toc-${level}" data-target="${id}">${text}</a></li>`);
    });

    tocListEl.innerHTML = tocItems.join('');

    tocListEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const targetId = target.getAttribute('data-target');
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = tocListEl.querySelector(`a[data-target="${entry.target.id}"]`);
          if (link) {
            if (entry.isIntersecting) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }
}

export { BlogPostReader };
