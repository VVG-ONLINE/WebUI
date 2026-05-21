import type { BlogIndexEntry } from '../types';

class InsightsGrid extends HTMLElement {
  async connectedCallback(): Promise<void> {
    const grid = document.getElementById('insights-grid') || document.getElementById('blog-archive');
    if (!grid) return;

    try {
      const res = await fetch('data/blog-index.json');
      const posts: BlogIndexEntry[] = await res.json();
      const publishedPosts = posts.filter((p) => !p.draft)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 3);

      grid.innerHTML = publishedPosts
        .map(
          (p) => {
            const dateStr = new Date(p.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return `
              <div class="col-md-6 col-lg-4">
                <article class="blog-card ${p.featured ? 'featured' : ''}">
                  <div class="blog-card-category">${p.category}</div>
                  <h4 class="serif mb-3"><a href="/blog-post.html?slug=${p.slug}">${p.title}</a></h4>
                  <p class="small opacity-75 mb-4">${p.excerpt}</p>
                  <div class="blog-card-tags mb-3">
                    ${p.tags.slice(0, 2).map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                  </div>
                  <div class="mt-auto border-top pt-3 d-flex justify-content-between align-items-center">
                    <span class="mono small opacity-75">${dateStr} · ${p.timeToRead} min</span>
                    <a href="/blog-post.html?slug=${p.slug}" class="blog-card-read-more">Read</a>
                  </div>
                </article>
              </div>
            `;
          }
        )
        .join('');
    } catch (error) {
      console.error('Failed to load insights:', error);
      grid.innerHTML = '<p class="text-center">Failed to load articles.</p>';
    }
  }
}

customElements.define('insights-grid', InsightsGrid);
