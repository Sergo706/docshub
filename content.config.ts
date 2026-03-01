import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {

    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**',
        exclude: ['blog/**', 'index.md']
      },
      schema: z.object({
        icon: z.string(),
        module: z.string().optional(),
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
        image: z.string(),
        date: z.date(),
        readingTime: z.string()
      })
    }),

    navigationMenu: defineCollection({
      type: 'data',
      source: 'navigation.json',
      schema: z.discriminatedUnion("nested", [
        z.object({
          nested: z.literal(false), 
          label: z.string(),
          icon: z.string().optional(),
          url: z.string()
        }),
        z.object({
          nested: z.literal(true),
          label: z.string(),
          icon: z.string().optional(),
          children: z.array( 
            z.object({
              label: z.string(),
              icon: z.string().optional(),
              url: z.string()
            })
          )
        })
      ])
    })
  },
})
