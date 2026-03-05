---
title: TypeScript Config
description: Strict ESLint configuration for pure TypeScript projects.
icon: i-simple-icons-typescript
---

The `defineStrictTSConfig` helper generates a configuration array designed for backend, CLI, or utility-focused TypeScript projects. It enforces high code quality through strict type-aware rules and standardized formatting.

## Definition

```ts [strict.ts.config.ts]
/**
 * Creates a reusable, strict ESLint configuration for TypeScript-only projects.
 * 
 * @param options - Configuration options.
 * @param options.rootDir - The root directory of the project (required for type-checked rules).
 * @param options.ignores - Optional override for the default ignore list.
 * @param options.extraIgnores - Optional additional paths to ignore.
 * @param options.overrides - Optional array of additional ESLint configuration objects.
 * @returns A consolidated ESLint configuration array.
 */
export function defineStrictTSConfig(options: {
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
| `ignores` | `string[]` | No | Overrides the default ignore list (which includes `node_modules`, `dist`, `tests`, etc). |
| `extraIgnores` | `string[]` | No | Additional paths to ignore alongside the defaults. |
| `overrides` | `any[]` | No | An array of custom ESLint configuration objects to merge at the end. |

## Features & Presets
- **Full Type-Awareness**: Leverages `@typescript-eslint/strict-type-checked` and `stylistic-type-checked` for deep code analysis.
- **Project Service**: Uses TypeScript's project service for efficient and accurate type-checking across the workspace.
- **Standardized Formatting**: Enforces consistent array spacing and semicolons via project-specific stylistic rules.
- **Smart Defaults**: Includes `DEFAULT_TS_IGNORES` for common build artifacts (`dist`, `build`), config files, and coverage reports.
- **JS Interop**: Specifically configures `no-undef` for `.js`, `.cjs`, and `.mjs` files while allowing TypeScript to handle globals for `.ts` files.

## Usage

Create an `eslint.config.mjs` file in your project root:

```javascript [eslint.config.ts]
import { defineStrictTSConfig } from '@sergo/utils/eslint'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineStrictTSConfig({
  rootDir,
  extraIgnores: ['vendor/**'],
  overrides: [
    {
      rules: {
        'no-console': 'warn'
      }
    }
  ]
})
```

::callout{icon="i-lucide-shield-check" color="success"}
This configuration is ideal for standalone TypeScript libraries and Node.js services where performance and strictness are priorities.
::
