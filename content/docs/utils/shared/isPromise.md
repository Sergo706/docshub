---
title: isAsyncOrPromise
description: Checks if the given input is an asynchronous function or a Promise/Thenable.
icon: i-lucide-zap
---

The `isAsyncOrPromise` utility is a type-checking helper that determines if a provided input is either an asynchronous function, a native `Promise`, or a "Thenable" object (an object with a `.then()` method).

This is useful for implementing higher-order functions or handlers that need to adapt their behavior based on whether a callback is synchronous or asynchronous.

## Definition

```ts [isPromise.ts]
/**
 * Checks if the given input is an asynchronous function or a Promise.
 *
 * @param input - The value to check (Function, Promise, or Thenable).
 * @returns True if the input is an AsyncFunction or a Promise/Thenable, false otherwise.
 */
export function isAsyncOrPromise(
  input: Function | Promise<unknown> | { then?: unknown }
): boolean
```

## Example Usage

```typescript [example.ts]
import { isAsyncOrPromise } from '@riavzon/utils'

const asyncFn = async () => 1;
const promise = Promise.resolve(1);
const syncFn = () => 1;
const thenable = { then: () => {} };

console.log(isAsyncOrPromise(asyncFn));  // true
console.log(isAsyncOrPromise(promise));  // true
console.log(isAsyncOrPromise(thenable)); // true
console.log(isAsyncOrPromise(syncFn));   // false
```

::callout{icon="i-lucide-info" color="info"}
This utility specifically checks the `Object.prototype.toString` of a function to identify `[object AsyncFunction]`, ensuring accurate detection of modern `async` keywords.
::
