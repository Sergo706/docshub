---
title: safeAction
description: Implements deduplication and short-term caching for concurrent asynchronous actions.
icon: i-lucide-lock
---

::callout{icon="i-lucide-info" color="info"}
**Advanced Utility**: This function is designed for high-concurrency environments to solve the [Cache Stampede](https://en.wikipedia.org/wiki/Cache_stampede) problem by deduplicating in-flight asynchronous operations.
::

The `safeAction` utility is a tool for managing concurrent asynchronous operations. It prevents duplicate execution of expensive actions (like refreshing a token or fetching a singleton resource) by using a "leader" pattern.

## Behavior

When multiple concurrent calls are made with the same token:
1. **Cache Check**: If a fresh result exists in the short-term cache, it's returned immediately.
2. **Lock Check**: If the action is already being executed by another caller, the current caller waits for that same promise to resolve.
3. **Leader Execution**: If no lock or cache exists, the current caller becomes the "leader", starts the execution, and shares the resulting promise with all subsequent callers.

## Definition

```ts [promiseLocker.ts]
export async function safeAction<T>(
    token: string,
    action: () => Promise<T>,
    recentResultsTTL = 3000,
    log: pino.Logger
): Promise<T>
```

## Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `token` | `string` | - | A unique key used for locking and caching the operation. |
| `action` | `() => Promise<T>` | - | The asynchronous function to perform if no lock or cache is found. |
| `recentResultsTTL` | `number` | `3000` | Duration (in ms) to cache the completed result after the lock is released. |
| `log` | `pino.Logger` | - | A Pino logger instance for tracking execution flow and cache status. |

## Example Usage

This is perfect for preventing redundant heavy requests to external APIs or databases.

```typescript [example.ts]
import { safeAction } from '@riavzon/utils'
import pino from 'pino'

const logger = pino();

async function refreshToken() {
  console.log('Refreshing token...');
  return await api.post('/refresh');
}

// Even if 100 requests call this simultaneously:
// Only ONE 'Refreshing token...' log will appear.
// All 100 callers will receive the exact same result.
const token = await safeAction('auth-refresh', refreshToken, 5000, logger);
```

::callout{icon="i-lucide-shield-check" color="success"}
This utility is especially powerful in microservices or high-concurrency environments to ensure consistency and reduce load on external services.
::
