---
title: Utilities 
description: Collection of generic TypeScript utilities, reusable ESLint configurations, and robust Server helpers.
icon: i-lucide-wrench
---

# Shared Utilities

The Utilities package (`@sergo/utils`) is a tree-shakeable library containing cross-platform helper functions for data manipulation, strict typings, ESLint setups, and server operations.

## Installation

If you are using this outside the monorepo, install via your preferred package manager:

::code-group

```bash [pnpm]
pnpm add @sergo/utils
```

```bash [yarn]
yarn add @sergo/utils
```

```bash [npm]
npm install @sergo/utils
```

```bash [bun]
bun add @sergo/utils
```
::

## Core Features

The utilities are split into four main modules:

::UPageGrid
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
description: Helper functions tailored for server environments. Includes configuration definers and backend routines.
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
import { ensureArray, cleanObject } from '@sergo/utils'

// Ensures the provided value is an array
const items = ensureArray(undefined) // []

// Removes null/undefined values from objects
const filtered = cleanObject({ name: 'Example', empty: null }) // { name: 'Example' }
```

```typescript [Server]
import { defineServerConfig } from '@sergo/utils/server'

export default defineServerConfig({
  port: 3000,
  host: 'localhost'
})
```

```typescript [ESLint]
// eslint.config.mjs
import { defineStrictTSConfig } from '@sergo/utils/eslint/strict'

export default defineStrictTSConfig({
  rootDir: import.meta.dirname,
  extraIgnores: ['coverage/**']
})
```

```typescript [Types]
import type { Brand, Results } from '@sergo/utils/types'

// Use Branding for nominal typing
type UserID = Brand<string, 'UserID'>

// Define consistent API results
async function getUser(): Promise<Results<{ name: string }>> {
  return { ok: true, date: new Date().toISOString(), data: { name: 'Sergo' } }
}
```

::

::callout{icon="i-lucide-info" color="info"}
All utilities are **strictly typed** and include JSDoc comments for editor intellisense integration.
::
