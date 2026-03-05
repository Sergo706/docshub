---
title: ValueOf
description: Extracts the value types from an object (similar to `keyof` but for values).
icon: i-lucide-braces
---

The `ValueOf<T>` utility type extracts the union of all value types from a given object type `T`.

It functions similarly to the built-in `keyof` operator, but instead of retrieving the keys, it retrieves the distinct types of the values assigned to those keys.

## Definition

```ts [ValueOf.ts]
/**
 * Extracts the value types from an object (similar to `keyof` but for values).
 */
export type ValueOf<T> = T[keyof T];
```

## Example Usage

This is particularly useful when working with configuration constants or enums represented as constant objects (`as const`), where you need to restrict a variable to only the values defined in the object.

```typescript [example.ts]
import type { ValueOf } from '@sergo/utils/types'

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404
} as const;

// Extracts: 200 | 201 | 400 | 401 | 404
type StatusCode = ValueOf<typeof STATUS_CODES>;

// Allowed
const validStatus: StatusCode = 200;

// Error: Type '500' is not assignable to type 'StatusCode'.
const invalidStatus: StatusCode = 500; 

function sendResponse(status: StatusCode) {
  // ...
}
```
