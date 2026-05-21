import type { SiteConfig, Theme } from '../types';

const template = document.createElement('template');
template.innerHTML = `
  <nav class="system-panel" role="navigation" aria-label="Main navigation">
    <a href="/" class="logo-link" aria-label="Go to homepage">
      <img src="https://raw.githubusercontent.com/vvgonline/vvgonline/d6ce91fa38831bf3009b2070a2c9a0f323faa8f8/public/logo-2025.svg"
           alt="VVG ONLINE Logo" class="vvg-logo-nav me-2" width="100" height="40">
      <span class="text-accent">VVG_ONLINE</span>
    </a>
    <div id="nav-links"></div>
    <div class="status-right d-flex align-items-center">
      <button id="btn-theme-toggle" class="btn btn-sm py-0 px-1 me-1 btn-theme" title="Toggle theme" aria-label="Toggle theme">
        <i class="bi bi-brightness-high-fill"></i>
      </button>
      <button id="nav-terminal-toggle" class="btn btn-sm py-0 px-1 btn-terminal" title="Toggle terminal" aria-label="Toggle AI terminal">
        <i class="bi bi-terminal-fill"></i>
      </button>
      <span class="d-none d-md-inline">
        <span id="clock" class="text-center text-light bg-dark w-75 p-1">[ 00:00:00 ]</span>
      </span>
    </div>
  </nav>
`;

class SystemPanel extends HTMLElement {
  private config: SiteConfig | null = null;
  private theme: Theme = 'light';

  connectedCallback(): void {
    this.append(template.content.cloneNode(true));
    this.loadConfig();
    this.initClock();
    this.initTheme();
    this.initEventListeners();
  }

  async loadConfig(): Promise<void> {
    const res = await fetch('data/site.json');
    this.config = await res.json();
    this.renderNavLinks();
  }

  renderNavLinks(): void {
    const container = this.querySelector('#nav-links');
    if (!container || !this.config) return;
    container.innerHTML = this.config.navItems
      .map((item) => `
        <a href="${item.href}" class="no-cursor" aria-label="Navigate to ${item.label}">
          <i class="bi ${item.icon} me-2"></i><span class="text-light">${item.label}</span>
        </a>
      `).join('');
  }

  initClock(): void {
    const clock = this.querySelector('#clock') as HTMLElement;
    function update(): void {
      const now = new Date();
      clock.textContent = `[ ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} ]`;
    }
    update();
    setInterval(update, 1000);
  }

  initTheme(): void {
    this.theme = (sessionStorage.getItem('vvg-theme') as Theme) || 'light';
    document.documentElement.dataset.theme = this.theme;
    this.updateThemeIcon();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = this.theme;
    sessionStorage.setItem('vvg-theme', this.theme);
    this.updateThemeIcon();
    this.updateGridColor();
  }

  updateThemeIcon(): void {
    const icon = this.querySelector('#btn-theme-toggle i');
    if (icon) {
      icon.className = this.theme === 'dark' ? 'bi bi-brightness-high-fill' : 'bi bi-moon-fill';
    }
  }

  updateGridColor(): void {
    if ((window as any).gridHelper) {
      (window as any).gridHelper.material.color.setHex(this.theme === 'dark' ? 0xffdd33 : 0xcccccc);
    }
  }

  toggleTerminal(): void {
    const term = document.querySelector('ai-terminal');
    if (term) term.classList.toggle('terminal-closed');
  }

  initEventListeners(): void {
    this.querySelector('#btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    this.querySelector('#nav-terminal-toggle')?.addEventListener('click', () => this.toggleTerminal());
  }
}

customElements.define('system-panel', SystemPanel);
