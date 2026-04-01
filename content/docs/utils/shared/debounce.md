---
title: debounce
description: Delays a function's execution until a specified amount of time has passed since the last call.
icon: i-lucide-clock
---

The `debounce` utility ensures that a function is only executed after a specified delay has passed since the last time it was invoked.

Each call to `debounce` returns a new debounced instance with its own isolated timer.

## Definition

```ts [debounce.ts]
/**
 * Debounces a function, ensuring it only executes after a specified delay since the last call.
 *
 * @param action - The function to be debounced.
 * @param debounceMs - The delay in milliseconds (default: 300ms).
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => any>(
    action: T,
    debounceMs: number = 300
): (...args: Parameters<T>) => void
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | `Function` | Yes | The function you want to debounce. |
| `debounceMs` | `number` | No | The delay in milliseconds. Defaults to `300`. |

## Example Usage

A common use case is debouncing a search input to avoid making an API call on every single keystroke.

```typescript [example.ts]
import { debounce } from '@riavzon/utils'

const handleSearch = (query: string) => {
  console.log(`Searching for: ${query}`);
  // Perform API call here...
};

const debouncedSearch = debounce(handleSearch, 500);

// User types quickly:
debouncedSearch('th'); // Timer starts
debouncedSearch('this'); // Timer resets
debouncedSearch('this is'); // Timer resets
debouncedSearch('this is fun!'); // Timer resets

// 500ms after the last call:
// Output: "Searching for: this is fun!"
```

### Isolated Timers

Every time you call the `debounce`, it creates a unique closure with its own `timeoutId`.

```typescript
const debouncedA = debounce(() => console.log('A'), 1000);
const debouncedB = debounce(() => console.log('B'), 1000);

debouncedA();
debouncedB();
// Both will execute independently after 1000ms.
```
