import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const base = isGitHubPages ? '/WebUI/' : '/';

export default defineConfig({
  base,
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        blog: 'blog.html',
        'blog-post': 'blog-post.html',
        contact: 'contact.html',
        services: 'services.html',
        about: 'about.html',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'VVG ONLINE - Digital Business Consulting',
        short_name: 'VVG ONLINE',
        description: 'Driving you beyond growth through unique, innovative, and result-oriented digital consulting.',
        start_url: '/index.html',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#ffdd33',
        categories: ['business', 'consulting', 'digital transformation'],
        lang: 'en-US',
        dir: 'ltr',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Services',
            short_name: 'Services',
            description: 'View our digital consulting services',
            url: '/services.html',
            icons: [{ src: '/pwa/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Insights',
            short_name: 'Blog',
            description: 'Read our latest insights and articles',
            url: '/blog.html',
            icons: [{ src: '/pwa/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Contact',
            short_name: 'Contact',
            description: 'Get in touch with us',
            url: '/contact.html',
            icons: [{ src: '/pwa/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff,woff2,ttf,eot,md}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/data\//, /^\/content\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-jsdelivr-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdnjs-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/content/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'blog-content-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ]
});
