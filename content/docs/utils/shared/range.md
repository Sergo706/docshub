---
title: range
description: An iterable generator for creating numeric sequences.
icon: i-lucide-list-ordered
---

The `range` utility creates a lightweight iterable object that generates a sequence of numbers. Because it uses the [`Symbol.iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator) protocol, it is extremely memory-efficient and can be used directly in `for...of` loops or spread into arrays.

## Definition

```ts [range.ts]
/**
 * Creates an iterable range generator.
 *
 * @param start - The baseline number.
 * @param end - The target end number (inclusive).
 * @param step - The increment step (default: 1).
 * @param inclusiveStart - If true, starts at `start`. If false (default), starts at `start + step`.
 * @returns An iterable object that yields the sequence.
 */
export function range(
    start: number,
    end: number,
    step = 1,
    inclusiveStart = false
): IterableIterator<number>
```

## Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `start` | `number` | - | The starting point of the sequence. |
| `end` | `number` | - | The target end value (inclusive). |
| `step` | `number` | `1` | The amount to increment by in each step. |
| `inclusiveStart` | `boolean` | `false` | Whether to include the `start` value as the first element. |



## Behavior
- **Incremental**: Generates numbers from `start` to `end`.
- **Custom Steps**: You can define the gap between numbers using the `step` parameter.
- **Inclusive Options**: By default, it starts at `start + step`. Use `inclusiveStart: true` to begin exactly at the `start` value.

## Example Usage

```typescript [example.ts]
import { range } from '@riavzon/utils'

// 1. Basic usage (1 to 5)
const basic = [...range(0, 5)];
// [1, 2, 3, 4, 5]

// 2. Inclusive start (0 to 5)
const inclusive = [...range(0, 5, 1, true)];
// [0, 1, 2, 3, 4, 5]

// 3. Custom steps (0 to 10 by 2s)
const stepping = [...range(0, 10, 2, true)];
// [0, 2, 4, 6, 8, 10]

// 4. looping
for (const n of range(0, 1000000)) {
  // Loop through a million numbers without creating a massive array in memory
  if (n === 5) break;
}
```

::callout{icon="i-lucide-alert-circle" color="warning"}
The `step` parameter must be greater than `0`, otherwise the utility will throw an error to prevent infinite loops.
::
