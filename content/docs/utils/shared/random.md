---
title: Random
description: Utility class for generating random integers and picking random elements from arrays.
icon: i-lucide-dice-5
---

The `Random` utility class provides simple methods for generating random numbers and retrieving random elements from data collections.

## Methods

### `getRandomInt`

Returns a random integer between 0 (inclusive) and a specified maximum (exclusive).

**Definition:**
```ts [random.ts]
getRandomInt(max: number = 100): number
```

#### Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `max` | `number` | `100` | The upper bound for the random integer. |

---

### `getRandomArbitrary`

  Returns a random integer between a minimum and maximum range.

  **Definition:**
```ts [random.ts]
getRandomArbitrary(min: number = 1, max: number = 10): number
```

#### Parameters
  | Parameter | Type | Default | Description |
  | --- | --- | --- | --- |
  | `min` | `number` | `1` | The lower bound (inclusive). |
  | `max` | `number` | `10` | The upper bound (exclusive). |

---

### `getRandomElement`

Returns a random element from the provided array. Returns `undefined` if the array is empty.

**Definition:**
```ts [random.ts]
getRandomElement<T>(array: T[]): T | undefined
```

#### Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `array` | `T[]` | - | The array to pick a random element from. |

## Example Usage

```typescript [example.ts]
import { Random } from '@sergo/utils'

const random = new Random();

// 1. Get a random int between 0 and 999
const id = random.getRandomInt(1000);

// 2. Get a random int between 50 and 100
const score = random.getRandomArbitrary(50, 100);

// 3. Pick a random element
const fruits = ['Apple', 'Banana', 'Cherry'];
const pick = random.getRandomElement(fruits);

console.log({ id, score, pick });
```
