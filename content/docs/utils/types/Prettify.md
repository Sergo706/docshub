---
title: Prettify
description: Forcefully expands a type definition to reveal its keys and values.
icon: i-lucide-code-2
---

The `Prettify<T>` utility type is a powerful development tool that forcefully expands a type definition to clearly reveal its keys and values. 

This is particularly useful when working with heavily intersected types, as it simplifies the output displayed in IDE tooltips from complex intersections into clean, flattened object signatures.

## Definition

```ts [Prettify.ts]
/** 
 * Forcefully expands a type definition to reveal its keys and values.
 * Useful for debugging complex intersections in IDE tooltips.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

## Example Usage

When combining multiple types, IDEs often display the raw intersection (`A & B`). Using `Prettify` fully resolves its properties:

```typescript [example.ts]
import type { Prettify } from '@riavzon/utils'

type UserBase = { id: string; name: string }
type UserMeta = { createdAt: string; isActive: boolean }

//  IDE shows: UserBase & UserMeta
type User = UserBase & UserMeta 

//  IDE shows:
// {
//   id: string;
//   name: string;
//   createdAt: string;
//   isActive: boolean;
// }
type PrettifiedUser = Prettify<UserBase & UserMeta>
```