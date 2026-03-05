---
title: React Config
description: Strict ESLint configuration for React and Next.js projects.
icon: i-simple-icons-react
---

The `defineStrictReactConfig` helper provides a configuration specifically for React and Next.js applications. It seamlessly integrates strict TypeScript standards with the latest [Next.js Core Web Vitals](https://nextjs.org/docs/app/building-your-application/optimizing/eslint) recommendations.

## Definition

```ts [strict.react.config.ts]
/**
 * Creates a reusable, strict ESLint configuration for React/Next.js and TypeScript.
 *
 * @param options - Configuration options.
 * @param options.rootDir - The root directory of the project (required for type-checked rules).
 * @param options.ignores - Optional override for the default ignore list.
 * @param options.extraIgnores - Optional additional paths to ignore.
 * @param options.overrides - Optional array of additional ESLint configuration objects.
 * @returns A consolidated ESLint configuration array.
 */
export function defineStrictReactConfig(options: {
  rootDir: string;
  ignores?: string[];
  extraIgnores?: string[];
  overrides?: any[];
}): any[]
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `rootDir` | `string` | **Yes** | The root directory of the project, used to resolve `tsconfig.json` for type-checked rules. |
| `ignores` | `string[]` | No | Overrides the default ignore list. |
| `extraIgnores` | `string[]` | No | Additional paths to ignore alongside the defaults. |
| `overrides` | `any[]` | No | An array of custom ESLint configuration objects to merge at the end. |

## Features & Safety
- **Next.js Optimized**: Automatically includes and configures the Next.js ESLint plugin for App Router and Core Web Vitals.
- **Strict Logic**: Extends `@typescript-eslint/strict-type-checked` to catch bugs in React components and hooks logic.
- **Safe Server Actions**: Enforces security best practices for Next.js Server Actions, preventing unintended data leaks.
- **Nominal Directives**: Monitors and optimizes the placement of `'use client'` and `'use server'` directives.
::

## Key Safety Rule: Server Directive Placement

To prevent accidentally exposing private helper functions to the client, this configuration includes a custom rule that encourages placing the `'use server'` directive inside individual exported functions rather than at the top of a file.

## Usage

```javascript [eslint.config.ts]
import { defineStrictReactConfig } from '@sergo/utils/eslint'

export default defineStrictReactConfig({
  rootDir: import.meta.dirname,
  extraIgnores: ['public/**'],
  overrides: [
    {
      files: ['components/**/*.tsx'],
      rules: {
        'no-console': 'warn'
      }
    }
  ]
})
```