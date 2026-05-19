const headerTemplate = document.createElement('template');
headerTemplate.innerHTML = `
  <header class="page-header container py-5 mt-4" role="banner">
    <div class="terminal-tag-group">
      <div class="tag-segment tag-user" id="user-tag"></div>
      <div class="tag-segment tag-path" id="path-tag"></div>
    </div>
    <h1 class="display-3 hero-title" id="page-title"></h1>
    <p class="lead fs-4 opacity-75 serif" id="page-subtitle"></p>
  </header>
`;

class PageHeader extends HTMLElement {
  connectedCallback(): void {
    this.append(headerTemplate.content.cloneNode(true));

    const userTag = this.getAttribute('user-tag') || 'SYSTEM';
    const pathTag = this.getAttribute('path-tag') || 'DEFAULT';
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';

    const userTagEl = this.querySelector('#user-tag');
    const pathTagEl = this.querySelector('#path-tag');
    const titleEl = this.querySelector('#page-title');
    const subtitleEl = this.querySelector('#page-subtitle');

    if (userTagEl) userTagEl.textContent = `// ${userTag}`;
    if (pathTagEl) pathTagEl.textContent = `// ${pathTag}`;
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }
}

customElements.define('page-header', PageHeader);
