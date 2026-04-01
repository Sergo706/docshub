---
title: Brand
description: Creates a "Branded" type (Nominal Typing) to distinguish primitives.
icon: i-lucide-tag
---

The `Brand<K, T>` utility creates a "Branded" type (Nominal Typing) to distinguish primitives.

TypeScript's structural typing means that any two `number` types are considered identical. The `Brand` type helps enforce strict typing at compile-time by virtually "tagging" primitive types with a unique identifier, preventing accidental mixing of different concepts that share the same underlying base type.

## Definition

```ts [Brand.ts]
/**
 * Creates a "Branded" type (Nominal Typing) to distinguish primitives.
 */
export type Brand<K, T> = K & { __brand: T };
```

## Example Usage

Branded types are perfect for enforcing domain-specific constraints. For instance, distinguishing between different currencies or ensuring an ID string isn't used where a purely random string is expected.

```typescript [example.ts]
import type { Brand } from '@riavzon/utils'

type USD = Brand<number, 'USD'>;
type EUR = Brand<number, 'EUR'>;

const dollars = 10 as USD;
const euros = 10 as EUR;

// TypeScript allows assignments within the same brand
const moreDollars: USD = dollars;

//  TypeScript prevents mixing different brands, even if they are both numbers
// Type 'EUR' is not assignable to type 'USD'.
const newDollars: USD = euros; 

function processPayment(amount: USD) {
  // Processing logic...
}

//  Correct
processPayment(dollars);

// Error: Argument of type 'EUR' is not assignable to parameter of type 'USD'.
processPayment(euros);
```
