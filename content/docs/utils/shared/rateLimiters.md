---
title: rateLimiters
description: In-memory fixed-window, sliding-window, and sliding-window-counter rate limiters backed a memory cache.
icon: i-lucide-timer-reset
---

The `rateLimiters` module provides three lightweight, in-memory rate limiting
functions for per-process traffic control. Each factory accepts cache
configuration once and returns a synchronous limiter function that evaluates a
string key such as an IP address, user ID, API key, or composite identifier.

All three functions store state in
[`MiniCache`](/docs/utils/shared/minicache), so idle keys expire
automatically. The returned limiter resolves to `true` when the request is
accepted and `false` when the current request exceeds the configured limit.

::callout{icon="i-lucide-alert-triangle" color="warning"}
These limiters keep all state in local memory. They do not synchronize across
multiple Node.js processes, containers, or regions, and they do not generate
HTTP headers such as `Retry-After`.
::

## Definition

The module exports three factory functions and a small set of interfaces that
describe the cache payload used by each strategy.

```ts [rateLimiters.ts]
export interface Entry {
  count: number
  windowStart: number
}

export interface RateEntry {
  timestamps: number[]
}

export interface CounterEntry {
  currentBucket: number
  previousBucket: number
  bucketStart: number
}

export interface CacheConfig {
  maxEntries?: number
  sweepIntervalMs?: number
}

export function fixedWindowRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => boolean

export function slidingWindowRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => boolean

export function slidingWindowCounterRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => boolean
```

## State interfaces

The exported interfaces are the internal shapes stored in `MiniCache`. You do
not need them for everyday use, but they explain how each algorithm tracks
recent traffic.

| Interface | Used by | Description |
| --- | --- | --- |
| `Entry` | `fixedWindowRateLimiter` | Stores the accepted request count and the timestamp where the active fixed window started. |
| `RateEntry` | `slidingWindowRateLimiter` | Stores every accepted request timestamp that still belongs to the active rolling window. |
| `CounterEntry` | `slidingWindowCounterRateLimiter` | Stores the current bucket count, the previous bucket count, and the start time of the current bucket. |

## Shared configuration

Each factory accepts the same `CacheConfig` object. These options control only
how limiter state is stored and cleaned up in memory.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `Infinity` | Maximum number of active keys kept in memory. When this limit is reached, `MiniCache` evicts the oldest key and that key starts fresh on its next request. |
| `sweepIntervalMs` | `number` | `60000` | Interval in milliseconds used by `MiniCache` to remove expired keys in the background. Access-time checks still enforce expiry even if the sweep has not run yet. |

## Choosing a strategy

The three factories share the same public signature, but they trade accuracy,
memory use, and burst handling differently.

| Strategy | Accuracy | Memory per key | Best for | Tradeoff |
| --- | --- | --- | --- | --- |
| `fixedWindowRateLimiter` | Lowest | Lowest | Simple IP throttling and coarse route protection | Boundary bursts can pass at the end of one window and the start of the next. |
| `slidingWindowRateLimiter` | Highest | Highest | Sensitive endpoints such as login, reset, or verification routes | Stores every accepted timestamp for the active window. |
| `slidingWindowCounterRateLimiter` | High, approximate | Low | High-throughput APIs where timestamp arrays are too expensive | Uses weighted buckets, so the count is an approximation. |

## Returned limiter function

Each factory returns the same limiter signature. The function is synchronous, so
you can call it directly inside middleware, route handlers, or in-memory
guards.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Unique identity to limit, such as an IP address, user ID, session ID, API key, or composite key. |
| `limit` | `number` | No | Maximum number of accepted requests inside the active window. Defaults to `50`. |
| `windowMs` | `number` | No | Window size in milliseconds. Defaults to `1000`. |

The returned function resolves immediately to `true` when the request is
accepted, or `false` when the request must be rejected.

## Methods

The following factory functions differ only in how they count recent traffic for
each key.

### `fixedWindowRateLimiter(cache)`

`fixedWindowRateLimiter` stores a single counter and a `windowStart` timestamp
per key. The window is anchored to the first accepted request for that key, and
the counter resets when the full window duration has elapsed.

This is the lightest strategy in memory and CPU cost. It works well for coarse
protection, but it can admit bursts around a window boundary.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cache` | `CacheConfig` | Yes | Cache settings for limiter state. See the shared configuration table above. |

| Returned limiter parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Unique subject to track. |
| `limit` | `number` | No | Maximum accepted requests for the current fixed window. Defaults to `50`. |
| `windowMs` | `number` | No | Fixed window duration in milliseconds. Defaults to `1000`. |

Use this strategy when you need fast, predictable protection with minimal
overhead, such as basic per-IP throttling on a public route.

```ts [loginLimiter.ts]
import { fixedWindowRateLimiter } from '@riavzon/utils'

const limitLoginAttempts = fixedWindowRateLimiter({
  maxEntries: 50_000,
  sweepIntervalMs: 30_000,
})

export function canAttemptLogin(ip: string) {
  return limitLoginAttempts(ip, 5, 60_000)
}
```

### `slidingWindowRateLimiter(cache)`

`slidingWindowRateLimiter` stores an array of accepted timestamps for each key.
On every request, it removes timestamps older than `windowMs`, counts the
remaining timestamps, and accepts or rejects the request from that rolling set.

This strategy gives the most accurate rolling-window behavior. It smooths out
boundary bursts, but it uses more memory because every accepted request adds a
timestamp to the active window.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cache` | `CacheConfig` | Yes | Cache settings for limiter state. See the shared configuration table above. |

| Returned limiter parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Unique subject to track. |
| `limit` | `number` | No | Maximum accepted requests inside the rolling window. Defaults to `50`. |
| `windowMs` | `number` | No | Sliding window size in milliseconds. Defaults to `1000`. |

Use this strategy for endpoints where fairness matters more than raw
throughput, such as login, password reset, or OTP verification flows.

```ts [passwordResetLimiter.ts]
import { slidingWindowRateLimiter } from '@riavzon/utils'

const limitPasswordReset = slidingWindowRateLimiter({
  maxEntries: 100_000,
  sweepIntervalMs: 60_000,
})

export function canSendResetEmail(key: string) {
  return limitPasswordReset(key, 3, 15 * 60_000)
}
```

### `slidingWindowCounterRateLimiter(cache)`

`slidingWindowCounterRateLimiter` stores only the current bucket count, the
previous bucket count, and the current bucket start time. It estimates the
effective request count by weighting the previous bucket according to how far
the current time has progressed through the active window.

This strategy is a good balance between accuracy and memory use. It avoids the
timestamp array used by a full sliding window while still reducing the sharp
boundary effects of a fixed window.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cache` | `CacheConfig` | Yes | Cache settings for limiter state. See the shared configuration table above. |

| Returned limiter parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Unique subject to track. |
| `limit` | `number` | No | Maximum estimated requests inside the weighted window. Defaults to `50`. |
| `windowMs` | `number` | No | Bucket size and effective window size in milliseconds. Defaults to `1000`. |

Use this strategy for high-volume APIs where you need smoother throttling than a
fixed window, but storing every timestamp would create too much overhead.

```ts [apiKeyLimiter.ts]
import { slidingWindowCounterRateLimiter } from '@riavzon/utils'

const limitApiKey = slidingWindowCounterRateLimiter({
  maxEntries: 200_000,
  sweepIntervalMs: 10_000,
})

export function canCallApi(apiKey: string) {
  return limitApiKey(apiKey, 100, 60_000)
}
```

## Example usage

In a typical HTTP handler, call the limiter before you perform the expensive or
security-sensitive work. If the limiter returns `false`, return a `429` response
immediately.

```ts [serverHandler.ts]
import { fixedWindowRateLimiter } from '@riavzon/utils'

const limitRequests = fixedWindowRateLimiter({ maxEntries: 25_000 })

export async function handleRequest(req: Request, ip: string) {
  if (!limitRequests(ip, 20, 60_000)) {
    return new Response('Too Many Requests', { status: 429 })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
```

--- 

These rate limiters are often used with other shared utilities in the package.
The following pages explain the closest related building blocks.

- See [MiniCache](/docs/utils/shared/minicache) for the TTL and eviction
  behavior that backs these limiters.
- See [fetchWithRetry](/docs/utils/shared/fetchwithretry) if you also need
  client-side backoff and retry behavior after a `429` response.
