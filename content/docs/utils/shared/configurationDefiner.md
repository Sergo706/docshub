---
title: createConfigManager
description: Creates a type-safe configuration manager for a project with runtime validation.
icon: i-lucide-settings
---

`createConfigManager` manages global configuration state for a project. It validates raw input against a Zod schema at startup, runs async initialization tasks, then deep-freezes the result so it cannot be mutated at runtime.

When validation fails, the function throws a detailed, pretty-printed error listing every failing field, making misconfigured environments fail immediately at boot rather than silently at runtime.

## Definition

```ts [configurationDefiner.ts]
import { type ZodType } from "zod"

export function createConfigManager<T>(schema: ZodType<T>, projectName?: string)
```
 
## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `schema` | `ZodType<T>` | Yes | Zod schema used to parse and validate the incoming configuration data. |
| `projectName` | `string` | No | Label prefixed to error messages for debugging. Defaults to `"App"`. |

## Returns

`createConfigManager` returns an object with two functions bound to the provided schema:

### `defineConfiguration(config, initializations?): Promise<void>`

```ts
async function defineConfiguration(
  config: unknown,
  initializations?: ((config: T) => Promise<void> | void)[]
): Promise<void>
```

`defineConfiguration` validates `config`, runs all `initializations` tasks concurrently, then freezes and stores the result. Call this once during application startup, before any module calls `getConfiguration`.

**`initializations`** is an optional array of async setup functions that receive the validated config object. Use it for side effects that depend on config values and must complete before the app starts, for example, opening a database connection or warming a cache. All tasks run via `Promise.all`. If any task throws, the error propagates and the config is never stored.

**`await` is required.** `defineConfiguration` returns a `Promise` because `initializations` tasks are async. Omitting `await` means the config will not be stored before the rest of the module initializes, and any call to `getConfiguration()` will throw a premature-access error.

### `getConfiguration(): T`

Returns the validated, frozen configuration object. Throws with a stack trace if called before `defineConfiguration` resolves successfully.

## Example Usage

```typescript [config.ts]
import { z } from 'zod'
import { createConfigManager } from '@riavzon/utils'

const AppSchema = z.object({
  apiKey: z.string().min(10, 'API Key is too short'),
  environment: z.enum(['development', 'production', 'testing']),
  port: z.number().default(3000),
})

export const { defineConfiguration, getConfiguration } = createConfigManager(AppSchema, 'CoreApp')
```

```typescript [index.ts]
import { defineConfiguration } from './config'
import { connectDB } from './database'
import { warmCache } from './cache'

// connectDB and warmCache both receive the parsed config and run concurrently.
// The process only continues once both resolve.
// If the API key is missing or too short, the app refuses to boot.
await defineConfiguration(
  {
    apiKey: process.env.SECRET_API_KEY,
    environment: process.env.NODE_ENV,
  },
  [connectDB, warmCache]
)
```

```typescript [database.ts]
import { getConfiguration } from './config'

export function connectDB() {
  const { environment, port } = getConfiguration()

  if (environment === 'production') {
    console.log(`Starting PROD database on port ${port}...`)
  }
}
```

::callout{icon="i-lucide-alert-triangle" color="warning"}
Always `await defineConfiguration(...)`. Omitting `await` means the Promise resolves in the background, `getConfiguration()` will throw a premature-access error for any code that runs before it settles.
::

::callout{icon="i-lucide-info" color="info"}
The validated config is frozen with `Object.freeze` after all initialization tasks complete. Any attempt to mutate the returned object is silently ignored in sloppy mode and throws a `TypeError` in strict mode.
::
