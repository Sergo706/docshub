---
title: createConfigManager
description: Creates a type-safe configuration manager for a project with runtime validation.
icon: i-lucide-settings
---

The `createConfigManager` generic utility provides an approach for applications to manage their global configuration state securely.

By leveraging [Zod](https://zod.dev/) schemas, this utility ensures that the configuration is validated at runtime. If the initialization receives invalid data, it will instantly throw an detailed, pretty printed error message. Once validated, the configuration is deeply frozen to prevent accidental mutations during the application's lifecycle.

## Definition

```ts [configurationDefiner.ts]
import { type ZodType } from "zod";

/**
 * Creates a type-safe configuration manager for a project.
 *
 * @template T - The type of the configuration object (inferred from schema).
 * @param schema - A Zod schema used to validate the configuration.
 * @param projectName - The name of the project (used in error messages).
 * @returns An object containing `defineConfiguration` and `getConfiguration` functions.
 */
export function createConfigManager<T>(schema: ZodType<T>, projectName = "App")
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `schema` | `ZodType<T>` | Yes | A strictly-typed Zod schema used to parse and validate the incoming configuration data. |
| `projectName` | `string` | No | A label prefixed to error messages for debugging purposes. Defaults to `"App"`. |

## Returns

Executing `createConfigManager` will return an object enclosing the following two strictly-typed functions bound to the provided schema:

### `defineConfiguration(config: unknown): void`
Validates, freezes, and inherently stores the configuration state within the module closure. It is designed to be called exactly once during the application's bootstrapping phase.

### `getConfiguration(): T`
Retrieves the successfully validated and frozen configuration payload. If this function is invoked prior to `defineConfiguration`, it immediately traces and throws a premature access error.

## Example Usage

This utility perfectly facilitates the pattern of defining your configuration centrally and accessing it safely from independent modules without passing huge payloads down the component tree.

```typescript [config.ts]
import { z } from 'zod'
import { createConfigManager } from '@sergo/utils'

// 1. Outline the exact shape and constraints of your App configuration
const AppSchema = z.object({
  apiKey: z.string().min(10, 'API Key is too short'),
  environment: z.enum(['development', 'production', 'testing']),
  port: z.number().default(3000)
});

// 2. Instantiate the config manager
export const { defineConfiguration, getConfiguration } = createConfigManager(AppSchema, "CoreApp");
```

```typescript [index.ts]
import { defineConfiguration } from './config'

// 3. Initialize during bootstrapping using process.env or secret stores
defineConfiguration({
  apiKey: process.env.SECRET_API_KEY,
  environment: process.env.NODE_ENV,
});
// If the API key is missing, the app refuses to boot and throws a detailed trace!
```

```typescript [database.ts]
import { getConfiguration } from './config'

// 4. Safely pull configuration anywhere in the application
export function initializeDB() {
  const { environment, port } = getConfiguration();

  if (environment === 'production') {
    console.log(`Starting PROD database on port ${port}...`);
  }
}
```
