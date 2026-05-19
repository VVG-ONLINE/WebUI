import type { SiteConfig } from '../types';

const template = document.createElement('template');
template.innerHTML = `
  <footer class="container" role="contentinfo">
    <div class="row g-4">
      <div class="col-md-4">
        <h3 class="serif h2 mb-3">VVG ONLINE</h3>
        <p class="mono small">// ACCESS THE FUTURE</p>
        <p class="small opacity-75 mt-3">Driving you beyond growth through unique, innovative, and result-oriented digital consulting.</p>
      </div>
      <div class="col-md-4">
        <p class="mono small mb-3">// QUICK NAV</p>
        <ul class="list-unstyled footer-nav" id="footer-nav"></ul>
      </div>
      <div class="col-md-4 text-md-end">
        <p class="mono small mb-3">CONNECT WITH US</p>
        <div class="d-flex gap-1 justify-content-md-start justify-content-md-end" id="social-links"></div>
        <div class="mt-4">
          <code class="opacity-75" id="copyright"></code>
        </div>
      </div>
    </div>
  </footer>
`;

class AppFooter extends HTMLElement {
  connectedCallback(): void {
    this.append(template.content.cloneNode(true));
    this.loadContent();
  }

  private async loadContent(): Promise<void> {

    const res = await fetch('data/site.json');
    const config: SiteConfig = await res.json();

    const navContainer = this.querySelector('#footer-nav');
    if (navContainer) {
      navContainer.innerHTML = config.navItems
        .map(
          (item) => `
            <li class="mb-2">
              <a href="${item.href}" class="text-decoration-none text-dark footer-nav-link">
                <i class="bi ${item.icon} me-2"></i>${item.label}
              </a>
            </li>
          `
        )
        .join('');
    }

    const socialContainer = this.querySelector('#social-links');
    if (socialContainer) {
      socialContainer.innerHTML = Object.entries(config.social)
        .map(
          ([platform, url]) => `
            <a href="${url}" target="_blank" rel="noopener noreferrer"
               class="text-dark bg-dark px-2 fs-4 social-link no-cursor"
               title="${platform}" aria-label="Visit our ${platform} page">
              <i class="bi bi-${platform}"></i>
            </a>
          `
        )
        .join('');
    }

    const copyright = this.querySelector('#copyright');
    if (copyright) {
      copyright.textContent = `© ${new Date().getFullYear()} VVG ONLINE. ALL_RIGHTS_RESERVED.`;
    }
  }
}

customElements.define('app-footer', AppFooter);
