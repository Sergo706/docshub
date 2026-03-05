---
title: filterEmptyValues
description: Filters out `null` and `undefined` values from an array, with optional deep cleaning.
icon: i-lucide-filter
---

The `filterEmptyValues` utility is designed to clean arrays by removing `null` and `undefined` values. It supports both shallow filtering (the default) and recursive deep cleaning of nested arrays and objects.

## Definition

```ts [filterEmptyValues.ts]
type DeepArray<T> = (T | DeepArray<T> | Record<string, any> | null | undefined | false | "" | 0)[];

/**
 * Filters out `null` and `undefined` values from an array.
 * Optionally performs a deep cleanup on nested arrays and objects.
 *
 * @template T - The type of elements in the array.
 * @param array - The array to filter.
 * @param deep - If true, recursively cleans nested arrays and arrays found inside objects.
 * @returns A new array with `null` and `undefined` removed.
 */
export function filterEmptyValues<T>(array: DeepArray<T>, deep: boolean = false): T[]
```

::callout{icon="i-lucide-alert-circle" color="error"}
Avoid passing directly untrusted data or a payload you not strictly defined.
Malicious users can paste huge payloads that would crash your server.
::

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `array` | `DeepArray<T>` | Yes | The input array containing potential empty values. |
| `deep` | `boolean` | No | If `true`, the utility will recursively filter nested arrays and objects. Defaults to `false`. |

## Example Usage

### Shallow Filter
By default, the utility only removes `null` and `undefined` from the top-level array.

```typescript [example-shallow.ts]
import { filterEmptyValues } from '@sergo/utils'

const input = [1, null, undefined, 0, false, ""];
const result = filterEmptyValues(input);

// Result: [1, 0, false, ""]
```

### Deep Filter
When `deep` is set to `true`, the utility recursively cleans nested structures.

```typescript [example-deep.ts]
import { filterEmptyValues } from '@sergo/utils'

const input = [
  1,
  null,
  {
    val: [2, null],
    meta: { status: undefined, code: 200 }
  },
  [3, undefined]
];

const result = filterEmptyValues(input, true);

/*
Result:
[
  1,
  {
    val: [2],
    meta: { code: 200 }
  },
  [3]
]
*/
```
