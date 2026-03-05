---
title: isObjectHasValues
description: Checks if an object has at least one meaningful value, searching recursively.
icon: i-lucide-check-check
---

The `isObjectHasValues` utility is a recursive helper designed to determine if an object contains any "meaningful" content. This is particularly useful for validation logic or for deciding whether to display specific UI sections based on complex data structures.

## Definition

```ts [isObjectHasValues.ts]
/**
 * Checks if an object has at least one meaningful value, searching recursively.
 *
 * @param {Record<string, unknown>} target - The object to inspect.
 * @returns {boolean} - True if any meaningful value is found.
 */
export function isObjectHasValues(target: Record<string, unknown>): boolean
```

## Behavior

A value is considered **meaningful** if it meets any of the following conditions:
- It is **not** `undefined`.
- It is **not** `null`.
- It is **not** an empty string (`''`).
- It is a **non-empty array**.
- It is a **nested object** that itself contains meaningful values.

## Example Usage

```typescript [example.ts]
import { isObjectHasValues } from '@sergo/utils'

const empty = {
  name: '',
  meta: {
    tags: [],
    note: undefined
  }
};

const filled = {
  name: 'Nuxt',
  meta: {
    tags: ['framework']
  }
};

console.log(isObjectHasValues(empty));  // false
console.log(isObjectHasValues(filled)); // true
```

::callout{icon="i-lucide-info" color="info"}
Note that `0`, `false`, and other falsy values (except empty strings, null, and undefined) are considered **meaningful** by this utility.
::
