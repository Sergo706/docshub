---
title: Merge
description: Merges two types, where the second type overrides the first.
icon: i-lucide-combine
---

The `Merge<FirstType, SecondType>` utility type is designed to merge two object types together. 

When encountering conflicting keys between the two types, the `SecondType` dictates the final property type, effectively overriding the `FirstType`.

## Definition

```ts [Merge.ts]
/**
 * Merges two types, where the second type overrides the first.
 */
export type Merge<FirstType, SecondType> = Omit<FirstType, keyof SecondType> & SecondType;
```

## Example Usage

This utility is extremely helpful when you are extending a base configuration or payload with specialized properties that might redefine existing properties.

```typescript [example.ts]
import type { Merge } from '@sergo/utils/types'

interface DefaultConfig {
  url: string;
  timeout: number;
  headers: Record<string, string>;
}

interface CustomConfig {
  timeout: string; // Changed from number to string
  retries: number; // New property
}

// Standard Intersection keeps `timeout` as `number & string` (which evaluates to `never`)
type BadIntersection = DefaultConfig & CustomConfig;

// Merge correctly overrides `timeout` to be `string`
type FinalConfig = Merge<DefaultConfig, CustomConfig>;

const config: FinalConfig = {
  url: 'https://api.example.com',
  timeout: '5000ms', // Allowed, because it was overridden to string
  headers: { 'Content-Type': 'application/json' },
  retries: 3
};
```
