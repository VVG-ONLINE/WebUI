import type { ServiceItem, ServiceDoc } from '../types';

class ServicesGrid extends HTMLElement {
  async connectedCallback(): Promise<void> {
    const grid = document.getElementById('services-grid');
    const container = document.getElementById('services-container');

    try {
      const res = await fetch('data/services.json');
      const data: ServiceDoc = await res.json();
      const services = data.services;

      if (grid) {
        this.renderHomepage(grid, services);
      } else if (container) {
        this.renderServicesPage(container, services);
      } else {
        this.renderServicesPage(this, services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      const target = grid || container || this;
      target.innerHTML = '<p class="text-center text-danger py-5">Failed to load services.</p>';
    }
  }

  private renderHomepage(grid: HTMLElement, services: ServiceItem[]): void {
    const topServices = services.slice(0, 3);

    grid.innerHTML = topServices
      .map((s, index) => {
        const number = `0${index + 1}.`;
        return `
          <div class="col-md-4 p-4 border-bottom border-end">
            <span class="mono">${number}</span>
            <h3 class="mt-3">${s.title}</h3>
            <p class="opacity-75 small">${s.description}</p>
          </div>
        `;
      })
      .join('');
  }

  private renderServicesPage(container: HTMLElement, services: ServiceItem[]): void {
    container.innerHTML = `
      <div class="row g-0 border-top border-start">
        ${services.map((s, index) => this.renderServiceCard(s, index)).join('')}
      </div>
    `;
  }

  private renderServiceCard(service: ServiceItem, index: number): string {
    const number = `0${index + 1}.`;
    const subservicesHtml = service.subservices && service.subservices.length > 0
      ? `
        <ul class="list-unstyled mt-3">
          ${service.subservices.map(sub => `
            <li class="mb-2">
              <i class="bi bi-check2 text-accent me-1"></i>
              <strong>${sub.name}</strong>
              <div class="small opacity-75 ms-3">${sub.description}</div>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    return `
      <div class="col-md-6 col-lg-4 p-4 border-bottom border-end">
        <span class="mono">${number}</span>
        <h3 class="mt-3">${service.title}</h3>
        <p class="opacity-75 small">${service.description}</p>
        ${subservicesHtml}
      </div>
    `;
  }
}

customElements.define('services-grid', ServicesGrid);
