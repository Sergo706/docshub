---
title: "Mastering Nuxt UI v4: A Comprehensive Guide"
description: "Explore the latest features, breaking changes, and best practices in Nuxt UI v4 for building stunning modern web applications."
tags:
  - Nuxt
  - Nuxt UI
  - Frontend
image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1200&q=80"
author: "Sergio"
authorImg: "https://github.com/Sergo706.png"
authorGithub: "https://github.com/Sergo706"
authorGithubUserName: "Sergo706"
featured: false
date: 2026-03-05
readingTime: "15 min read"
---

Nuxt UI v4 marks a significant milestone in the evolution of the Nuxt ecosystem. With a revitalized focus on performance, developer experience, and design flexibility, this version brings a plethora of improvements that every Nuxt developer should know.

## What's New in v4?

The core shift in v4 revolves around the move from a pure Tailwind CSS approach to a more structured and extensible theming system.

### Core Technologies

Nuxt UI v4 is built upon three pillars:
- **Reka UI**: Provides the accessible primitives for complex components (replaces Headless UI).
- **Tailwind CSS v4**: Leverages the latest CSS-first engine.
- **Tailwind Variants**: Manages component states and variations with a clean API.

::note
By combining these technologies, Nuxt UI v4 offers a highly flexible design system that remains performant at any scale.
::

## Key Features

1. **Ecosystem Integration**: Seamlessly works with `@nuxt/content`, `@nuxt/image`, and more.
2. **TypeScript First**: Every component is written with strict types, ensuring a robust development flow.
3. **Advanced Theming**: Define your theme once and apply it globally or per-component with ease.

## Installation and Setup

Getting started with Nuxt UI v4 is straightforward. Add the module to your project:

```bash
npx nuxi@latest module add ui
```

Then, configure it in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui'
  ],
  ui: {
    // Global options here
  }
})
```

## Mastering the Component System

Nuxt UI v4 components are designed to be "unstyled" at their core but come with a beautiful default theme.

### Customize Components

You can easily customize any component using the `ui` prop. For example, to adjust the layout of a `UBlogPost`:

```vue
<UBlogPost
  title="My Awesome Post"
  :ui="{ header: 'aspect-square' }"
/>
```

### Theming System

Define your colors and variants in `app.config.ts`:

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      neutral: 'slate'
    },
    button: {
      defaultVariants: {
        color: 'primary',
        size: 'md'
      }
    }
  }
})
```

## Working with Content

When using `@nuxt/content`, remember that you need to register `@nuxt/content` *after* `@nuxt/ui` in your `modules` array to ensure prose components are available.

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',     // 1st
    '@nuxt/content' // 2nd
  ]
})
```

## Migration from v3

Migrating to v4 involves several renames and structural changes. Some key renames include:
- `ButtonGroup` -> `FieldGroup`
- `PageMarquee` -> `Marquee`
- `PageAccordion` -> `Accordion`

::callout{icon="i-lucide-alert-circle" color="warning"}
Always check the official migration guide for the full list of breaking changes and deprecated utilities.
::

## Best Practices

- **Use Slots for Complex Content**: Don't be afraid to use slots when props aren't enough.
- **Leverage Color Mode**: Nuxt UI handles dark mode out of the box. Use semantic colors like `text-highlighted` or `bg-default`.
- **Optimize Icons**: Use the `@iconify-json` packages or local SVG collections for the best performance.

---

### Conclusion

Nuxt UI v4 is a powerhouse for modern web development. Whether you're building a simple blog or a complex dashboard, it provides the tools you need to succeed quickly and efficiently.

::tip
Check out the [Nuxt UI MCP Server](https://ui.nuxt.com/docs/getting-started/mcp-server) for AI-powered assistance during your development flow.
::
