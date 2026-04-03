---
title: Utilities 
description: Collection of generic TypeScript utilities, reusable ESLint configurations, and robust Server helpers.
icon: i-lucide-wrench
---

# Shared Utilities

The Utilities package (`@riavzon/utils`) is a tree-shakeable library containing cross-platform helper functions for data manipulation, strict typings, ESLint setups, and server operations.

## Installation

If you are using this outside the monorepo, install via your preferred package manager:

::code-group

```bash [pnpm]
pnpm add @riavzon/utils
```

```bash [yarn]
yarn add @riavzon/utils
```

```bash [npm]
npm install @riavzon/utils
```

```bash [bun]
bun add @riavzon/utils
```
::

## Core Features

The utilities are split into four main modules:

::UPageGrid{class="lg:grid-cols-2"}
::UPageCard
---
title: Generic Utilities
description: Core helper functions for array, object, promise, and string manipulation. Available for both client and server.
icon: i-lucide-code
to: /docs/utils/shared/capitalize
---
::

::UPageCard
---
title: Server Utilities
description: Node.js-only helpers for path resolution, shell command execution, and CSV bulk uploads to MySQL and PostgreSQL.
icon: i-lucide-server
to: /docs/utils/server/run
---
:: 

::UPageCard
---
title: ESLint Configs
description: Pre-configured, ultra-strict ESLint setups for pure TypeScript and Vue projects to maintain a clean codebase.
icon: i-lucide-check-circle
to: /docs/utils/eslint/vue
---
::

::UPageCard
---
title: Utility Types
description: Advanced TypeScript utility types for better safety, nominal grouping, and IDE tooltip refinement.
icon: i-lucide-braces
to: /docs/utils/types
---
:: 
::

## Quick Example

Here is a brief look at how you can interact with the different modules available in the package:

::code-group

```typescript [Generic]
import { ensureArray, cleanObject } from '@riavzon/utils'

// Ensures the provided value is an array
const items = ensureArray(undefined) // []

// Removes null/undefined values from objects
const filtered = cleanObject({ name: 'Example', empty: null }) // { name: 'Example' }
```

```typescript [Server]
import { run, resolvePath } from '@riavzon/utils/server'

// Resolve a data file path relative to the project root
const dbPath = resolvePath('geo.mmdb', ['_data-sources', 'dist/_data-sources'])

// Execute a shell command and capture its output
const { stdout } = await run('node --version')
console.log(stdout) // "v22.0.0"
```

```typescript [ESLint]
// eslint.config.mjs
import { defineStrictTSConfig } from '@riavzon/utils/eslint/strict'

export default defineStrictTSConfig({
  rootDir: import.meta.dirname,
  extraIgnores: ['coverage/**']
})
```

```typescript [Types]
import type { Brand, Results } from '@riavzon/utils'

// Use Branding for nominal typing
type UserID = Brand<string, 'UserID'>

// Define consistent API results
async function getUser(): Promise<Results<{ name: string }>> {
  return { ok: true, date: new Date().toISOString(), data: { name: 'Sergo' } }
}
```

:: 