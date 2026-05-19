import type { SiteConfig } from '../types';

class TypewriterEffect {
  private el: HTMLElement;
  private speed: number;

  constructor(el: HTMLElement, speed = 70) {
    this.el = el;
    this.speed = speed;
  }

  async type(text: string): Promise<void> {
    this.el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      this.el.textContent += text.charAt(i);
      await this.delay(this.speed);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

async function initHero(): Promise<void> {
  const target = document.getElementById('typewriter-target');
  if (!target) return;

  const res = await fetch('data/site.json');
  const config: SiteConfig = await res.json();
  const writer = new TypewriterEffect(target);
  writer.type(config.heroText);

  const tagline = document.getElementById('hero-tagline');
  if (tagline) tagline.textContent = config.tagline;
}

initHero();
