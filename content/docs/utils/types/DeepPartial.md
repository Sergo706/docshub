---
title: DeepPartial
description: Recursively makes all properties of an object optional.
icon: i-lucide-layers
---

The `DeepPartial<T>` utility recursively makes all properties of an object (including nested objects) optional. 

Unlike TypeScript's built-in `Partial<T>`, which only makes the top-level properties of an object optional, `DeepPartial` traverses the entire object tree, making every level completely optional.

## Definition

```ts [DeepPartial.ts]
/**
 * Recursively makes all properties of an object optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

## Example Usage

This utility is extremely useful for forms, state mutations, or patch payloads where only a subset of deeply nested properties are being updated.

```typescript [example.ts]
import type { DeepPartial } from '@sergo/utils/types'

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
    retries: number;
    ssl: {
      enabled: boolean;
      certPath: string;
    };
  };
}

// Updating only a deep subset of the full configuration
const configUpdate: DeepPartial<Config> = {
  database: {
    ssl: {
      enabled: false
      // certPath is optional
    }
    // retries and url are optional
  }
  // server is optional
};
```
