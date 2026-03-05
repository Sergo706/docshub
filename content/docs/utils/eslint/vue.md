---
title: Vue Config
description: Strict ESLint configuration for Vue 3 and Nuxt applications.
icon: i-simple-icons-vuedotjs
---

The `defineStrictVueConfig` helper provides a strict ESLint configuration tailored for Vue 3 and Nuxt applications. It seamlessly integrates strict TypeScript type-checking with Vue SFC linting rules.

## Definition

```ts [strict.vue.config.ts]
/**
 * Creates a reusable, strict ESLint configuration for Vue 3 and TypeScript.
 *
 * @param options - Configuration options.
 * @param options.rootDir - The root directory of the project (required for type-checked rules).
 * @param options.ignores - Optional override for the default ignore list.
 * @param options.extraIgnores - Optional additional paths to ignore.
 * @param options.overrides - Optional array of additional ESLint configuration objects.
 * @returns A consolidated ESLint configuration array.
 */
export function defineStrictVueConfig(options: {
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
| `ignores` | `string[]` | No | Overrides the default ignore list (which includes `.nuxt`, `node_modules`, etc). |
| `extraIgnores` | `string[]` | No | Additional paths to ignore alongside the defaults. |
| `overrides` | `any[]` | No | An array of custom ESLint configuration objects to merge at the end. |

## Features & Presets
- **Strict Type-Checking**: Includes `@typescript-eslint/strict-type-checked` and `stylistic-type-checked`.
- **Vue 3 Optimized**: Uses `eslint-plugin-vue/flat/recommended` and configures the Vue parser for TypeScript.
- **Project Service**: Automatically enables TypeScript's project service for better performance and accuracy.
- **Smart Defaults**: Includes a robust `DEFAULT_IGNORES` list covering `.nuxt`, `coverage`, `tests`, and various config files.
- **Balanced Rules**: Disables `no-undef` for `.vue/.ts` files (relying on TS) while enforcing it for plain `.js` files.
::

## Usage

```javascript [eslint.config.ts]
import { defineStrictVueConfig } from '@sergo/utils/eslint'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineStrictVueConfig({
  rootDir,
  extraIgnores: ['temp/**'],
  overrides: [
    {
      files: ['pages/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off'
      }
    }
  ]
})
```

::callout{icon="i-lucide-info" color="info"}
This configuration is fully compatible with ESLint's modern "Flat Config" system.
::
