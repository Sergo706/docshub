
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxt/image', '@nuxt/fonts', '@nuxt/hints', '@nuxtjs/seo'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  css: [
    './app/assets/css/main.css'
  ],

  routeRules: {
    '/': { prerender: true, cache: { maxAge: 60 * 60 * 24 * 30 } },
  },

  mdc: {
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      }
    }
  }
})