---
title: PromiseType
description: Extracts the resolved type of a Promise.
icon: i-lucide-arrow-right-circle
---

The `PromiseType<T>` utility type is designed to extract the inner resolved type from a `Promise`.

If the provided type `T` is a `Promise`, it will unwrap it and return the type it resolves to. If `T` is not a `Promise`, it simply returns `T` as-is.

## Definition

```ts [PromiseType.ts]
/**
 * Extracts the resolved type of a Promise.
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;
```

## Example Usage

This utility is particularly helpful when you need to specifically type the return value of an asynchronous function without manually unwrapping the `Promise` using Awaited, or when dealing with higher-order functions that wrap existing asynchronous operations.

```typescript [example.ts]
import type { PromiseType } from '@sergo/utils/types'

// A typical async function returning a string
async function fetchGreeting(): Promise<string> {
  return "Hello, World!";
}

// Extracting the return type of the function
type AsyncGreetingReturn = ReturnType<typeof fetchGreeting>; // Promise<string>

// Unwrapping the Promise to get the actual resolved type
type Greeting = PromiseType<AsyncGreetingReturn>; // string

// Allowed
const message: Greeting = "Hello Nuxt!";

// Error: Type 'number' is not assignable to type 'string'.
const invalidMessage: Greeting = 123;

// If passed a non-Promise type, it returns the type as-is
type RegularString = PromiseType<string>; // string
```
