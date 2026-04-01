---
title: NonNullable
description: Removes `null` and `undefined` from a type.
icon: i-lucide-filter
---

The `NonNullable<T>` utility type provides a specialized implementation for removing both `null` and `undefined` from a given union type `T`.

It ensures that the resulting type represents a concrete value that is guaranteed to exist.

## Definition

```ts [NonNullable.ts]
/**
 * Removes `null` and `undefined` from a type.
 */
export type NonNullable<T> = T extends null | undefined ? never : T;
```

## Example Usage

This utility allows you to strictly enforce that a value has been initialized and is securely accessible, effectively stripping away the possibility of it being absent.

```typescript [example.ts]
import type { NonNullable } from '@riavzon/utils'

type MaybeString = string | null | undefined;
type MaybeUser = { id: string } | undefined;

// Evaluates to: string
type DefiniteString = NonNullable<MaybeString>;

// Evaluates to: { id: string }
type DefiniteUser = NonNullable<MaybeUser>;

function printName(name: DefiniteString) {
  console.log(name.toUpperCase()); // Safe to use string methods here
}

// Allowed
printName("Sergo");

// Error: Argument of type 'null' is not assignable to parameter of type 'string'.
printName(null);
```
