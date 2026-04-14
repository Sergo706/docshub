---
title: findStringsInObject
description: Recursively searches an object tree for strings matching specific key and value criteria.
icon: i-lucide-search-code
---

The `findStringsInObject` utility is designed to traverse complex object trees to find the first string value that matches specific key and value criteria. It includes built-in safeguards such as circular reference detection and depth limiting to ensure safe execution on massive or deeply nested objects.

## Definition

```ts [findObjectValues.ts]
/**
 * Recursively searches an object tree for a string matching specific key and value criteria.
 *
 * @param input - The object tree to search.
 * @param visited - Internal set for tracking visited objects (prevents circularity).
 * @param searchTerms - The matching criteria.
 * @param searchTerms.keyToSearch - The substring to look for in object keys (case-insensitive).
 * @param searchTerms.value - The RegExp to test against string values.
 * @param depth - Current recursion depth (internal).
 * @param maxDepth - Maximum recursion depth (default: 6).
 */
export function findStringsInObject(
  input: object,
  visited = new Set<object>(),
  searchTerms: {keyToSearch: string, value: RegExp},
  depth = 0,
  maxDepth = 6
): string | null
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `input` | `object` | Yes | The object tree to traverse. |
| `searchTerms` | `object` | Yes | Contains the matching criteria. |
| `searchTerms.keyToSearch` | `string` | Yes | The substring to look for in object keys (case-insensitive). |
| `searchTerms.value` | `RegExp` | Yes | The regular expression to test against string values. |
| `maxDepth` | `number` | No | Maximum recursion depth (default: `6`). |

## Rules for Matching

A matching string is returned (and trimmed) if:
1. The property key (case-insensitive) contains the provided `keyToSearch` **AND** the string value matches the `searchTerms.value` regex.
2. **OR** if the string value simply matches the `searchTerms.value` regex regardless of the key name.

## Example Usage

This utility is particularly effective for extracting specific data points like emails or IDs from deeply nested configuration or payload objects.

```typescript [example.ts]
import { findStringsInObject } from '@riavzon/utils'

const payload = {
  user: {
    meta: {
      contact_email: " user@example.com ",
      secondary: "not-an-email"
    }
  }
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = findStringsInObject(payload, new Set(), {
  keyToSearch: 'email',
  value: emailRegex
});

console.log(email); // "user@example.com"
```
