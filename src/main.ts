import './styles/main.scss';
import './components/SystemPanel';
import './components/PageHeader';
import './components/Hero';
import './components/Services';
import './components/Workflow';
import './components/Insights';
import './components/AITerminal';
import './components/Footer';
import './components/BlogList';
import './components/BackToTop';
import { BlogPostReader } from './components/BlogPostReader';
import type { SiteConfig, Theme } from './types';

let siteConfig: SiteConfig;

async function loadConfig(): Promise<SiteConfig> {
  const res = await fetch('data/site.json');
  return res.json();
}

function initTheme(): void {
  const saved = sessionStorage.getItem('vvg-theme') as Theme | null;
  const theme = saved || 'light';
  document.documentElement.dataset.theme = theme;
}

function initThreeBackground(): void {
  const container = document.getElementById('canvas-container');
  if (!container || !(window as any).THREE) return;

  const THREE = (window as any).THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 0xffdd33 : 0xcccccc;
  const gridHelper = new THREE.GridHelper(100, 40, gridColor, 0x444444);
  gridHelper.position.y = -5;
  scene.add(gridHelper);

  camera.position.set(0, 2, 10);

  function animate(): void {
    requestAnimationFrame(animate);
    gridHelper.position.z += 0.04;
    if (gridHelper.position.z > 2.5) gridHelper.position.z = 0;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function initScrollAnimations(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.card, .workflow-node').forEach((el) => {
    const elem = el as HTMLElement;
    elem.style.opacity = '0';
    elem.style.transform = 'translateY(20px)';
    elem.style.transition = 'all 0.6s ease-out';
    observer.observe(elem);
  });
}

async function init(): Promise<void> {
  siteConfig = await loadConfig();
  initTheme();

  const tagline = document.getElementById('hero-tagline');
  if (tagline) tagline.textContent = siteConfig.tagline;

  if ((window as any).THREE) {
    initThreeBackground();
  } else {
    window.addEventListener('load', initThreeBackground);
  }

  initScrollAnimations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

const path = window.location.pathname;
if (path.includes('blog-post.html') || path.includes('blog-post')) {
  const reader = new BlogPostReader();
  reader.load();
}
