import type { WorkflowNode } from '../types';

class WorkflowAnimator {
  private nodes: HTMLElement[] = [];
  private connectors: HTMLElement[] = [];
  private nodeData: WorkflowNode[] = [];
  private shadowContainer: HTMLElement | null = null;

  private config = {
    drawDuration: 520,
    perCharSpeed: 28,
    afterCodeDelay: 120,
    afterH5Delay: 140,
    afterPDelay: 180,
    connectorDelay: 220,
    nodeFadeDuration: 480,
    betweenNodesGap: 120,
    endOfLoopPause: 1000,
  };

  async init(host: HTMLElement): Promise<void> {
    const res = await fetch('data/workflow.json');
    this.nodeData = await res.json();

    this.shadowContainer = document.createElement('div');
    this.shadowContainer.className = 'workflow-container';
    host.appendChild(this.shadowContainer);

    this.render(this.shadowContainer);
    this.cacheElements(this.shadowContainer);
    this.startLoop();
  }

  private render(container: HTMLElement): void {
    container.innerHTML = this.nodeData
      .map(
        (n, i) => `
          <div class="workflow-node" data-index="${i}">
            <code class="d-block mb-2 text-warning bg-dark w-75 p-1">${n.hex}</code>
            <h5 class="serif">${n.title}</h5>
            <p class="small mb-0">${n.description}</p>
          </div>
          ${i < this.nodeData.length - 1 ? '<div class="workflow-connector" aria-hidden="true"></div>' : ''}
        `
      )
      .join('');
  }

  private cacheElements(container: HTMLElement): void {
    this.nodes = Array.from(container.querySelectorAll('.workflow-node')) as HTMLElement[];
    this.connectors = Array.from(container.querySelectorAll('.workflow-connector')) as HTMLElement[];
  }

  async startLoop(): Promise<void> {
    await this.delay(600);
    while (true) {
      for (let i = 0; i < this.nodes.length; i++) {
        await this.animateNode(i);
      }
      await this.delay(this.config.endOfLoopPause);
      await this.fadeAll();
      await this.resetAll();
    }
  }

  private async animateNode(index: number): Promise<void> {
    const n = this.nodes[index];

    n.classList.add('draw-rect', 'visible', 'active');
    await this.delay(this.config.drawDuration);

    const codeEl = n.querySelector('code') as HTMLElement;
    const h5El = n.querySelector('h5') as HTMLElement;
    const pEl = n.querySelector('p') as HTMLElement;

    if (codeEl) {
      codeEl.classList.add('flow-el', 'visible', 'code-blink');
      await this.typeElement(codeEl);
      codeEl.classList.remove('code-blink');
      await this.delay(this.config.afterCodeDelay);
    }

    if (h5El) {
      h5El.classList.add('flow-el', 'visible');
      await this.typeElement(h5El);
      await this.delay(this.config.afterH5Delay);
    }

    if (pEl) {
      pEl.classList.add('flow-el', 'visible');
      await this.typeElement(pEl);
      await this.delay(this.config.afterPDelay);
    }

    const connector = this.connectors[index];
    if (connector) {
      connector.classList.add('connector-active');
      await this.delay(this.config.connectorDelay);
    }

    await this.delay(this.config.betweenNodesGap);
  }

  private async fadeAll(): Promise<void> {
    this.nodes.forEach((n) => n.classList.add('loop-fade'));
    this.connectors.forEach((c) => c.classList.remove('connector-active'));
    await this.delay(this.config.nodeFadeDuration);
  }

  private async resetAll(): Promise<void> {
    this.nodes.forEach((n) => {
      n.classList.remove('draw-rect', 'visible', 'active', 'loop-fade');
      n.querySelectorAll('code, h5, p').forEach((el) => {
        el.textContent = '';
        el.classList.remove('visible', 'flow-el', 'code-blink');
      });
    });
    await this.delay(this.config.endOfLoopPause);
  }

  private async typeElement(el: HTMLElement): Promise<void> {
    if (!el.dataset.orig) el.dataset.orig = el.textContent?.trim() || '';
    const text = el.dataset.orig;
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      el.textContent += text.charAt(i);
      await this.delay(this.config.perCharSpeed);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

class WorkflowSection extends HTMLElement {
  connectedCallback(): void {
    const animator = new WorkflowAnimator();
    animator.init(this);
  }
}

customElements.define('workflow-section', WorkflowSection);
