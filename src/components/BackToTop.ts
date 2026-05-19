const backToTopTemplate = document.createElement('template');
backToTopTemplate.innerHTML = `
  <button class="back-to-top" aria-label="Back to top" title="Back to top">
    <span>TOP</span>
  </button>
`;

class BackToTop extends HTMLElement {
  private button: HTMLButtonElement | null = null;
  private scrollThreshold = 400;

  connectedCallback(): void {
    this.append(backToTopTemplate.content.cloneNode(true));
    this.button = this.querySelector('.back-to-top');

    if (this.button) {
      this.button.addEventListener('click', () => this.scrollToTop());
      window.addEventListener('scroll', () => this.updateVisibility(), { passive: true });
      this.updateVisibility();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateVisibility(): void {
    if (!this.button) return;
    if (window.scrollY > this.scrollThreshold) {
      this.button.classList.add('visible');
    } else {
      this.button.classList.remove('visible');
    }
  }
}

customElements.define('back-to-top', BackToTop);
