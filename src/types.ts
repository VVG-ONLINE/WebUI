interface ServiceItem {
  id: string | number;
  number?: string;
  title: string;
  description: string;
  icon?: string;
  highlighted?: boolean;
  subservices?: Subservice[];
}

interface Subservice {
  name: string;
  description: string;
}

interface ServiceDoc {
  services: ServiceItem[];
}

interface WorkflowNode {
  hex: string;
  title: string;
  description: string;
}

interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  readTime: string;
  date: string;
  excerpt: string;
}

interface BlogIndexEntry {
  title: string;
  slug: string;
  filename: string;
  publishedAt: string;
  tags: string[];
  excerpt: string;
  draft: boolean;
  category: string;
  featured: boolean;
  timeToRead: number;
}

interface BlogImageEntry {
  slug: string;
  featured: string;
  gallery: string[];
}

interface SiteConfig {
  heroText: string;
  tagline: string;
  social: { linkedin: string; github: string; twitter: string };
  navItems: { label: string; href: string; icon: string }[];
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  locale: string;
}

interface TerminalMessage {
  type: 'system' | 'user' | 'ai';
  content: string;
}

type Theme = 'light' | 'dark';

declare global {
  interface Window {
    gridHelper?: any;
    THREE?: any;
  }
}

export type { ServiceItem, Subservice, ServiceDoc, WorkflowNode, BlogPost, BlogIndexEntry, BlogImageEntry, SiteConfig, TerminalMessage, Theme };
