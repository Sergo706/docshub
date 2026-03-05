---
title: ensureArray
description: Converts a string or an array of strings into a clean array of strings.
icon: i-lucide-list-plus
---

The `ensureArray` utility is a normalization helper that ensures you always work with a clean array of strings, regardless of whether the input was a single string, a nullish value, or an array containing nulls.

## Definition

```ts [ensureArray.ts]
/**
 * Converts a string or an array of strings into a clean array of strings.
 *
 * @param val - The input value to process.
 * @returns A clean array of strings.
 */
export default function ensureArray(
  val: string | null | undefined | (string | null)[]
): string[]
```

## Behavior
- Returns an **empty array** (`[]`) if the input is `null`, `undefined`, or an empty string.
- **Filters out `null` values** if the input is an array.
- **Wraps** a single string into an array.

## Example Usage

This utility is extremely useful when dealing with API responses or form data where a field might be a single string or multiple strings, and you want to use `.map()` or other array methods safely. 

```typescript [example.ts]
import { ensureArray } from '@sergo/utils'

ensureArray(null)               // []
ensureArray(undefined)          // []
ensureArray("")                 // []
ensureArray("hello")            // ["hello"]
ensureArray(["a", null, "b"])   // ["a", "b"]
ensureArray(["x", "y", "z"])    // ["x", "y", "z"]
```
