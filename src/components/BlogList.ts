import type { BlogIndexEntry } from '../types';

class BlogList extends HTMLElement {
  private posts: BlogIndexEntry[] = [];
  private filteredPosts: BlogIndexEntry[] = [];
  private activeCategory: string = 'all';
  private searchQuery: string = '';
  private viewMode: 'grid' | 'archive' = 'grid';

  async connectedCallback(): Promise<void> {
    await this.loadPosts();
    this.render();
    this.bindEvents();
  }

  private async loadPosts(): Promise<void> {
    try {
      const res = await fetch('data/blog-index.json');
      this.posts = (await res.json()).filter((p: BlogIndexEntry) => !p.draft);
      this.posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      this.filteredPosts = [...this.posts];
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    }
  }

  private render(): void {
    const container = this.querySelector('#blog-archive') || this;
    const controlsHtml = this.renderControls();
    const contentHtml = this.viewMode === 'grid' ? this.renderGrid() : this.renderArchive();

    container.innerHTML = `
      ${controlsHtml}
      <div class="blog-results-count">Showing ${this.filteredPosts.length} of ${this.posts.length} articles</div>
      ${contentHtml}
    `;
  }

  private renderControls(): string {
    const categories = ['all', ...new Set(this.posts.map(p => p.category))];

    return `
      <div class="blog-controls">
        <div class="blog-search">
          <i class="bi bi-search search-icon"></i>
          <input type="text" id="blog-search-input" placeholder="Search articles..." value="${this.searchQuery}">
        </div>
        <div class="blog-filters">
          <div class="filter-group" id="category-filters">
            ${categories.map(cat => `
              <button class="filter-btn ${this.activeCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat === 'all' ? 'All' : cat}
              </button>
            `).join('')}
          </div>
          <div class="filter-group ms-auto">
            <button class="filter-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid">
              <i class="bi bi-grid"></i> Grid
            </button>
            <button class="filter-btn ${this.viewMode === 'archive' ? 'active' : ''}" data-view="archive">
              <i class="bi bi-list-ul"></i> Archive
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGrid(): string {
    if (this.filteredPosts.length === 0) {
      return `
        <div class="blog-empty-state">
          <h3>No articles found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
    }

    return `
      <div class="row g-4">
        ${this.filteredPosts.map(post => this.renderCard(post)).join('')}
      </div>
    `;
  }

  private renderCard(post: BlogIndexEntry): string {
    const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="col-md-6 col-lg-4">
        <article class="blog-card ${post.featured ? 'featured' : ''}">
          <div class="blog-card-category">${post.category}</div>
          <h3><a href="/blog-post.html?slug=${post.slug}">${post.title}</a></h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-tags">
            ${post.tags.slice(0, 3).map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
          </div>
          <div class="blog-card-footer">
            <span>${dateStr} · ${post.timeToRead} min</span>
            <a href="/blog-post.html?slug=${post.slug}" class="blog-card-read-more">Read</a>
          </div>
        </article>
      </div>
    `;
  }

  private renderArchive(): string {
    if (this.filteredPosts.length === 0) {
      return `
        <div class="blog-empty-state">
          <h3>No articles found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
    }

    const groupedByYear = this.filteredPosts.reduce((acc, post) => {
      const year = new Date(post.publishedAt).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(post);
      return acc;
    }, {} as Record<number, BlogIndexEntry[]>);

    const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    return sortedYears.map(year => `
      <section class="archive-section">
        <h2 class="archive-year">${year}</h2>
        <ul class="archive-list">
          ${groupedByYear[Number(year)].map(post => {
            const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            return `
              <li class="archive-item">
                <a href="/blog-post.html?slug=${post.slug}">${post.title}</a>
                <time datetime="${post.publishedAt}">${dateStr} · ${post.timeToRead} min</time>
              </li>
            `;
          }).join('')}
        </ul>
      </section>
    `).join('');
  }

  private bindEvents(): void {
    const searchInput = document.getElementById('blog-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
        this.applyFilters();
      });
    }

    const categoryFilters = document.getElementById('category-filters');
    if (categoryFilters) {
      categoryFilters.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('filter-btn')) {
          this.activeCategory = target.getAttribute('data-category') || 'all';
          this.applyFilters();
        }
      });
    }

    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = (btn as HTMLElement).getAttribute('data-view') as 'grid' | 'archive';
        this.render();
        this.bindEvents();
      });
    });
  }

  private applyFilters(): void {
    this.filteredPosts = this.posts.filter(post => {
      const matchesCategory = this.activeCategory === 'all' || post.category === this.activeCategory;
      const matchesSearch = !this.searchQuery ||
        post.title.toLowerCase().includes(this.searchQuery) ||
        post.excerpt.toLowerCase().includes(this.searchQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(this.searchQuery));
      return matchesCategory && matchesSearch;
    });

    const controls = this.querySelector('.blog-controls');
    const resultsCount = this.querySelector('.blog-results-count');
    const content = this.viewMode === 'grid' ? this.renderGrid() : this.renderArchive();

    if (controls && resultsCount) {
      resultsCount.innerHTML = `Showing ${this.filteredPosts.length} of ${this.posts.length} articles`;
      const contentContainer = document.createElement('div');
      contentContainer.innerHTML = content;
      while (resultsCount.nextSibling) {
        this.removeChild(resultsCount.nextSibling);
      }
      this.appendChild(contentContainer);
    }
  }
}

customElements.define('blog-list', BlogList);
