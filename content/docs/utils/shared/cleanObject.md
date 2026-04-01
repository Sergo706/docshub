---
title: cleanObject
description: Recursively removes undefined values and empty objects from a given target.
icon: i-lucide-eraser
---

The `cleanObject` utility is a recursive cleanup helper designed to prune "meaningless" fields from an object tree. It is particularly useful before sending data to an API or database, ensuring that unused fields (like `undefined` or empty objects) don't clutter your payloads.

## Key Behaviors

- **Deep Cleaning**: Recursively traverses nested objects.
- **Pruning**: Removes properties with `undefined` values.
- **Empty Object Removal**: If a nested object becomes empty after its own cleanup, it is removed from the parent.
- **Preservation**: Keeps `null`, booleans, numbers, and arrays (even if empty).
- **Circular Safety**: Uses a `WeakSet` to track visited objects and prevent infinite recursion.

::callout{icon="i-lucide-alert-circle" color="error"}
**Warning**: Avoid directly passing untrusted data or a payload that you have **not** strictly defined.
::

## Definition

```ts [cleanObject.ts]
/**
 * Recursively removes 'undefined' values and empty objects from a given object.
 *
 * @param target - The object to clean.
 * @param visited - internal set to prevent circular references.
 * @returns A new object containing only the meaningful fields.
 */
export function cleanObject<T extends object>(
    target: T,
    visited: WeakSet<object> = new WeakSet<object>()
): Partial<T>
```

## Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `object` | - | The source object you want to clean. |
| `visited` | `WeakSet` | `new WeakSet()` | Internal tracker for circular references. You typically don't need to pass this. |

## Example Usage

```typescript [example.ts]
import { cleanObject } from '@riavzon/utils'

const rawData = {
  id: 1,
  meta: {
    title: "Document",
    tags: undefined, // Will be removed
    settings: {}    // Will be removed if it becomes empty
  },
  status: undefined, // Will be removed
  active: false      // Preserved
};

const cleaned = cleanObject(rawData);

console.log(cleaned);
/*
Output:
{
  id: 1,
  meta: {
    title: "Document"
  },
  active: false
}
*/
```

::callout{icon="i-lucide-alert-circle" color="warning"}
This utility identifies circular references and returns an empty object `{}` for those nodes to prevent stack overflows, while preserving the integrity of the rest of the object.
::
