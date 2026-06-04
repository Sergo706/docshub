const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
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
  routeRules: isDev
    ? {}
    : {
        '/docs/**': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 } },
        '/blog/**': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 } },
        '/': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 } }
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
    indexable: true,
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
    componentDirs: ['app/components/OgImage']
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
            description: 'A standard library of highly optimized helpers, advanced concurrency locks, atomic file operators, tiered rate limiters, and background task schedulers.',
            href: '/llms/utils.md'
          },
          {
            title: 'Shield Base Introduction',
            description: 'A curated threat intelligence and disposable email database powering security and anti-abuse features across the Riavzon ecosystem. Used by the bot detector and the IAM service',
            href: '/llms/shield-base.md'
          },
          {
            title: 'Shield Base Repo',
            description: 'The repository containing the source code and data for Shield Base.',
            href: 'https://github.com/Sergo706/shield-base-cli'
          },
          {
            title: 'Identity and Access Management (IAM) Repo',
            description: 'The repository containing the source code of the IAM component',
            href: 'https://github.com/Sergo706/auth'
          },
          {
            title: 'Auth H3 Client Repo',
            description: 'The repository containing the source code of the Auth H3 Client component',
            href: 'https://github.com/Sergo706/auth-h3client'
          },
          {
            title: 'Bot Detection Repo',
            description: 'The repository containing the source code of the Bot Detection component',
            href: 'https://github.com/Sergo706/bot-detector'
          },
          {
            title: 'Utils Repo',
            description: 'The repository containing the source code of the Utils component',
            href: 'https://github.com/Sergo706/utils'
          },
          {
            title: 'The Author of this ecosystem',
            description: 'The Author of this docs site and the ecosystem can be found and reached from this site.',
            href: 'https://riavzon.com'
          },
          {
            title: 'More From the Author',
            description: 'Solana bots - A powerful desktop application and CLI for managing multiple wallets, executing mass token swaps, and running volume bots — all with your keys & data staying on your device. on the solana block chain',
            href: 'https://solana.riavzon.com/'
          },
        ]
      },
      {
        title: 'Fast Navigation Guide for LLMs',
        description: 'To provide fast answers, avoid hitting the massive `/llms-full.txt` file right away. Every single page on this site has a raw markdown equivalent served under the `/raw/` directory. For example, to read the raw markdown for `/docs/bot-detection/api`, you can fetch `/raw/docs/bot-detection/api.md`. Use these direct raw markdown files for specific lookups, and only fall back to downloading `/llms-full.txt` if you absolutely cannot find a specific page.',
        links: [
          {
            title: 'Example 1',
            description: 'Here is an example to get the rateLimiters util module im markdown, original path for humans: https://docs.riavzon.com/docs/utils/shared/ratelimiters',
            href: 'https://docs.riavzon.com/raw/docs/utils/shared/ratelimiters.md' 
          },
          {
            title: 'Example 2',
            description: 'Here is an example to get the data sources overview of the shield-base module im markdown, original path for humans: https://docs.riavzon.com/docs/shield-base/data-sources',
            href: 'https://docs.riavzon.com/raw/docs/shield-base/data-sources.md' 
          }
        ]
      }
    ],
    notes: [
      'For the latest announcements, updates, and deep dives into the ecosystem, please check out our Blog: https://docs.riavzon.com/blog',
      'For announcements, updates, and deep dives into the technical concepts, please check the blog of the author: https://riavzon.com/writing',
      
    ],
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
          langs: ["mjs", "docker", "bash", "dockerfile", "yaml", "yml", "json", "http"]
        },
        
      }
    }
  }
})