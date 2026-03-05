export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxtjs/seo',
    '@vueuse/nuxt',
    'nuxt-feedme',
    'nuxt-llms'
  ],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  css: [
    './app/assets/css/main.css'
  ],
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/feed.xml', '/feed.atom', '/feed.json']
    },
    preset: 'github_pages',
  },
  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    provider: 'iconify',
  },
  routeRules: {
    '/docs/**': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 }  },
    '/blog/**': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 }  },
    '/': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 } },
  },
  
  app: {
    head: {
      title: 'Riavzon | Ecosystem',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'Riavzon Blog RSS', href: '/feed.xml' },
        { rel: 'alternate', type: 'application/atom+xml', title: 'Riavzon Blog Atom', href: '/feed.atom' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'charset', content: 'utf-8' },
        { name: 'color-scheme', content: 'light dark' },
      ]
    }
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        strictNullChecks: true,
        strict: true
      }
    }
  },
  site: {
    url: 'https://docs.riavzon.com',
    name: 'Riavzon Ecosystem',
    description: 'Centralized documentation for the Riavzon ecosystem',
    defaultLocale: 'en',
  },
  
  ogImage: {
    zeroRuntime: true,
  },

  llms: {
    domain: 'https://docs.riavzon.com',
    title: 'Riavzon Ecosystem',
    description: 'Centralized documentation for the Riavzon ecosystem',
  },
  feedme: {
    feeds: {
      common: {
        feed: {
          title: 'Riavzon Blog',
          description: 'Latest articles from the Riavzon ecosystem',
          link: 'https://docs.riavzon.com/blog',
          copyright: `© ${new Date().getFullYear()} Riavzon`,
          author: {
            name: 'Riavzon',
            link: 'https://docs.riavzon.com',
          },
        },
        collections: ['blog'],
        mapping: [
          ['link', 'path'],
        ],
        replace: [[/^(?=\/)/.toString(), 'https://docs.riavzon.com']],
      },
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'light-plus',
            light: 'light-plus',
            dark: 'dracula'
          },
        }
      }
    }
  }
})