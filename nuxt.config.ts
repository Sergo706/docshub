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
      title: 'Riavzon Ecosystem',
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
        { name: 'theme-color', content: '#FFFDF7', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0A0908', media: '(prefers-color-scheme: dark)' },
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
  sitemap: {
    zeroRuntime: true,
    defaults: {
      lastmod: new Date().toISOString(),
    }
  },
  ogImage: {
    zeroRuntime: true,
  },

  llms: {
    domain: 'https://docs.riavzon.com',
    title: 'Riavzon Ecosystem',
    description: 'Centralized documentation for the Riavzon ecosystem',
    sections: [
      {
        title: 'Core Components',
        description: 'The Riavzon ecosystem is a collection of sophisticated, modular services designed for robust and secure application infrastructure, primarily optimized for Linux environments.',
        links: [
          {
            title: 'Identity and Access Management (IAM) Introduction',
            description: 'A comprehensive enterprise-grade JWT authentication system for Node.js/Express. Features OAuth, MFA, Magic Links, and advanced rate limiting backed by MySQL. Designed for a Centralized Authentication Service pattern.',
            href: '/llms/iam.md'
          },
          {
            title: 'Auth H3 Client Introduction',
            description: 'Seamlessly enforce OAuth 2.0 authentication and session management integrated directly as the client of the IAM module.',
            href: '/llms/auth-h3client.md'
          },
          {
            title: 'Bot Detection Introduction',
            description: 'A multi-layered defense system to identify and classify incoming web requests as humans or bots. Utilizes a pipeline of cheap (UA matching, IP validation) and heavy (MaxMind GeoLite2, DNS lookups) checks to assign penalty scores.',
            href: '/llms/bot-detection.md'
          },
          {
            title: 'Utils Introduction',
            description: 'A standard library of highly optimized helpers for formatting, validation, and core logic components.',
            href: '/llms/utils.md'
          }
        ]
      }
    ],
    notes: ['For the latest announcements, updates, and deep dives into the ecosystem, please check out our Blog: https://docs.riavzon.com/blog'],
    full: {
      title: 'Riavzon Ecosystem Full Documentation',
      description: 'Comprehensive technical overview of the sophisticated, modular services composing the Riavzon ecosystem.'
    }
  },
  feedme: {
    defaults: {
      common: false,
    },
    feeds: {
      common: {
        feed: {
          title: 'Riavzon Blog',
          description: 'Latest articles and updates from the Riavzon ecosystem',
          id: 'https://docs.riavzon.com/',
          link: 'https://docs.riavzon.com/',
          language: 'en',
          favicon: 'https://docs.riavzon.com/favicon.ico',
          copyright: `© ${new Date().getFullYear()} Riavzon`,
          author: {
            name: 'Riavzon',
            link: 'https://docs.riavzon.com',
          },
        },
        revisit: '6h',
        fixDateFields: true,
        templateMapping: ['', 'meta', 'meta.feedme'],
        mapping: [['link', 'path']],
        charset: 'utf-8',
        collections: ['blog'],
      },
      routes: {
        '/feed.atom': { type: 'atom1' },
        '/feed.json': { type: 'json1' },
        '/feed.xml': { type: 'rss2' },
      }
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
          langs: ["mjs", "docker", "bash"]
        },
        
      }
    }
  }
})