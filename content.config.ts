import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { NavigationCollectionSchema } from './shared/types/Navigation'

export default defineContentConfig({
  collections: {

    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**',
        exclude: ['blog/**', 'index.md']
      },
      schema: z.object({
        icon: z.string().optional(),
        module: z.string().optional(),
        rawbody: z.string().optional()
      }),
    }),

    landing: defineCollection({
      type: 'page',
      source: 'index.md',
    }),
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/**',
        exclude: ['docs/**', 'index.md']
      },
      schema: z.object({
        tags: z.array(z.string()),
        image: z.string(),
        author: z.string(),
        authorImg: z.string(),
        date: z.date(),
        readingTime: z.string(),
        rawbody: z.string().optional()
      })
    }),

    navigationMenu: defineCollection({
      type: 'data',
      source: 'navigation.json',
      schema: NavigationCollectionSchema
    })
  },
})

