---
title: Utilities
description: Collection of shared helper functions and composables.
---

# Shared Utilities

The Utilities module (`@riavzon/utils`) is a tree-shakeable library containing cross-platform helper functions for string manipulation, date formatting, typed event emitters, and more.

## Installation

If you are using this outside the monorepo, install via your package manager:

```bash [npm]
npm install @riavzon/utils
```

## Available Helpers

### `formatCurrency`

Formats a numeric value into a localized currency string, defaulting to USD.

```typescript [example.ts]
import { formatCurrency } from '@riavzon/utils'

const price = 1250.50
console.log(formatCurrency(price)) // "$1,250.50"
console.log(formatCurrency(price, 'EUR')) // "€1,250.50"
```

### `sleep`

A promise-based delay utility for asynchronous sleep operations.

```typescript [example.ts]
import { sleep } from '@riavzon/utils'

async function pollStatus() {
  while (true) {
    const status = await checkStatus()
    if (status === 'READY') break
    await sleep(2000) // wait 2 seconds before retrying
  }
}
```

::callout{icon="i-lucide-info"}
All utilities are strictly typed and include comprehensive JSDoc comments for editor intellisense integration.
::
