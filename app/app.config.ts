export default defineAppConfig({
  ui: {
    colors: {
      primary: 'accent',
      neutral: 'riavzon',
    },
    prose: {
      pre: {
        base: 'bg-transparent border-transparent' 
      },
      codeGroup: {
        slots: {
          indicator: 'bg-cream-200/70 dark:bg-riavzon-800',
          trigger: 'hover:bg-cream-200/70 dark:hover:bg-riavzon-800'
        }
      }
    }
  },
  appName: 'DocsHub',
  seo: {
    title: 'Riavzon | Ecosystem',
    description: 'Centralized documentation for the Riavzon ecosystem',
    url: 'https://docs.riavzon.com',
  },
  profile: {
    name: 'Riavzon',
  },
});
