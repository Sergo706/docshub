---
title: rateLimiters
description: In-memory fixed-window, sliding-window, and sliding-window-counter rate limiters backed by a memory cache.
icon: i-lucide-timer-reset
---

The `rateLimiters` module provides three lightweight, in-memory rate limiting
functions for per-process traffic control. Each factory accepts cache
configuration once and returns a synchronous limiter function that evaluates a
string key such as an IP address, user ID, API key, or composite identifier.

All three functions store state in
[`MiniCache`](/docs/utils/shared/minicache), so idle keys expire
automatically. The returned limiter produces a `RateLimitResult` object that
indicates whether the request is allowed, how many points remain in the current
window, and how long the caller should wait before retrying.

::warning
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
  enableBans?: boolean
  allowedAttemptsBeforeBan?: number
  banMultiplier?: number
  penaltyCooldownMultiplier?: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
  remainingPoints: number
}

export function fixedWindowRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => RateLimitResult

export function slidingWindowRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => RateLimitResult

export function slidingWindowCounterRateLimiter(
  cache: CacheConfig
): (key: string, limit?: number, windowMs?: number) => RateLimitResult
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

Each factory accepts the same `CacheConfig` object. These options control how
limiter state is stored and cleaned up in memory, and optionally enable a ban
policy for repeat offenders.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `Infinity` | Maximum number of active keys kept in memory. When this limit is reached, `MiniCache` evicts the oldest key and that key starts fresh on its next request. |
| `sweepIntervalMs` | `number` | `60000` | Interval in milliseconds used by `MiniCache` to remove expired keys in the background. Access-time checks still enforce expiry even if the sweep has not run yet. |
| `enableBans` | `boolean` | `false` | When `true`, keys that repeatedly exceed the rate limit are temporarily banned after `allowedAttemptsBeforeBan` consecutive violations. |
| `allowedAttemptsBeforeBan` | `number` | `3` | Number of consecutive rate-limit rejections required before a ban is applied. A successful (allowed) request resets the violation counter back to `0`. Only meaningful when `enableBans` is `true`. |
| `banMultiplier` | `number` | `2` | Multiplier used to exponentially increase the ban duration for repeat offenders. Only meaningful when `enableBans` is `true`. |
| `penaltyCooldownMultiplier` | `number` | `5` | Multiplier used to calculate the "cooldown" period. If a user survives for `banDuration * penaltyCooldownMultiplier` without getting banned again, their penalty tier resets to 0. Only meaningful when `enableBans` is `true`. |

## Bans and Exponential Backoff

When `enableBans` is set to `true`, the rate limiter actively penalizes repeat offenders instead of just dropping their overflow requests. This acts as a defense mechanism against brute-force attacks and misconfigured scripts.

The limiter tracks consecutive violations for each key. A "violation" occurs every time a request is rejected because the key has exceeded its limit. A single successful (allowed) request at any point resets the violation counter back to `0`, meaning a user must fail *consecutively* to trigger a penalty. 

However, once a key reaches exactly `allowedAttemptsBeforeBan` consecutive violations, a ban is **always** triggered immediately.

While a key is banned, every call short-circuits immediately without touching the main rate-limit cache. The limiter returns `allowed: false` with `retryAfterMs` set to the remaining ban duration, and `remainingPoints` set to `0`.


### The Math: Tiers and Cooldowns

Instead of issuing a flat penalty, the ban duration scales exponentially based on the user's **Penalty Tier** (how many times they have been banned recently). 

The math relies on three core calculations:
1. **Base Duration:** `windowMs * allowedAttemptsBeforeBan`
2. **Ban Duration:** `Base Duration * (banMultiplier ^ PenaltyTier)`
3. **Grace Period (Cooldown):** `Ban Duration * penaltyCooldownMultiplier`

::caution
**These numbers can grow really fast.** Because this system uses exponential backoff, a seemingly small multiplier can quickly escalate a minor timeout into a multi-day lockout. Always verify your configurations to ensure you don't accidentally trap legitimate users in an inescapable penalty loop.
::

To forgive users who eventually correct their behavior, the limiter enforces a "grace period". If a banned user waits out their ban, and then survives the ensuing Grace Period without triggering *another* ban, their record is wiped clean. Their Penalty Tier resets to `0`.

---

### Example 1: The Default Configuration (Aggressive Escalation)

By default, the limiter is configured to quickly shut down high-frequency bots.
* `windowMs`: **1000** (1 second)
* `allowedAttemptsBeforeBan`: **3**
* `banMultiplier`: **2**
* `penaltyCooldownMultiplier`: **5**

In this scenario, the Base Duration is **3 seconds** (1000ms * 3). If a malicious script continually hits the API without pausing, here is how the punishment scales:

| Penalty Tier | Active Ban Duration | Grace Period Requirement | Total Time Until Clean Slate |
| :--- | :--- | :--- | :--- |
| **Tier 1** (1st Ban) | **6s** `(3s * 2^1)` | **30s** `(6s * 5)` | **36 seconds** |
| **Tier 2** (2nd Ban) | **12s** `(3s * 2^2)` | **60s** `(12s * 5)` | **72 seconds** |
| **Tier 3** (3rd Ban) | **24s** `(3s * 2^3)` | **120s** `(24s * 5)` | **144 seconds (2.4m)** |
| **Tier 4** (4th Ban) | **48s** `(3s * 2^4)` | **240s** `(48s * 5)` | **288 seconds (4.8m)** |

::tip
*Clean Slate* is the exact moment the tier cache completely deletes the key from memory.
See [`MiniCache`](/docs/utils/shared/minicache)
::

> If the user hits Tier 3, they are locked out for 24 seconds. After 24 seconds, they can make requests again. However, if they trigger another 3 violations within the next 120 seconds (the Grace Period), they immediately jump to Tier 4. If they behave perfectly for those 120 seconds, their history is erased, and their next offense starts back at Tier 1.

---

### Example 2: The Gentle Configuration (Longer Windows, Faster Forgiveness)

If you are rate limiting a user-facing action (like a login page), you likely have a larger window and want to forgive mistakes quickly.
* `windowMs`: **60,000** (1 minute)
* `allowedAttemptsBeforeBan`: **5**
* `banMultiplier`: **2**
* `penaltyCooldownMultiplier`: **2**

In this scenario, the Base Duration is **5 minutes** (60,000ms * 5). Because the `penaltyCooldownMultiplier` is lower, the user's record is wiped clean much faster after their ban expires.

| Penalty Tier | Active Ban Duration | Grace Period Requirement | Total Time Until Clean Slate |
| :--- | :--- | :--- | :--- |
| **Tier 1** (1st Ban) | **10m** `(5m * 2^1)` | **20m** `(10m * 2)` | **30 minutes** |
| **Tier 2** (2nd Ban) | **20m** `(5m * 2^2)` | **40m** `(20m * 2)` | **1 hour** |
| **Tier 3** (3rd Ban) | **40m** `(5m * 2^3)` | **80m** `(40m * 2)` | **2 hours** |

This setup protects your database, but ensures that a real user who forgot their password isn't punished for days just because they tried a few too many times.

---

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

The returned function produces a `RateLimitResult` object with three fields.

| Property | Type | Description |
| --- | --- | --- |
| `allowed` | `boolean` | Whether the request is allowed through the rate limiter. |
| `retryAfterMs` | `number` | Milliseconds the caller should wait before retrying. When the key is banned this reflects the remaining ban duration. When rate-limited without a ban this reflects the time until the current window reopens. Returns `0` when allowed. |
| `remainingPoints` | `number` | Number of requests the caller can still make in the current window. Always `0` when rejected or banned. |

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

### Basic rate limiting

Call the limiter before you perform any expensive or security-sensitive work.
Destructure the result and return a `429` response when `allowed` is `false`.

```ts [basicLimiter.ts]
import { fixedWindowRateLimiter } from '@riavzon/utils'

const limitRequests = fixedWindowRateLimiter({ maxEntries: 25_000 })

export async function handleRequest(req: Request, ip: string) {
  const { allowed, retryAfterMs } = limitRequests(ip, 20, 60_000)

  if (!allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
```

### Rate limiting with bans

Enable bans to temporarily block keys that repeatedly exceed the limit. In this
example, a key that fails 5 times in a row is banned for an escalating duration.
For the first ban, the duration is `5 * 60_000 * 2 = 600_000 ms` (10 minutes).
If they are banned again before their cooldown expires, it doubles to 20 minutes.

```ts [bannedLimiter.ts]
import { slidingWindowRateLimiter } from '@riavzon/utils'

const limitLogin = slidingWindowRateLimiter({
  maxEntries: 50_000,
  enableBans: true,
  allowedAttemptsBeforeBan: 5,
  banMultiplier: 2,
  penaltyCooldownMultiplier: 5,
})

export async function handleLogin(req: Request, ip: string) {
  const { allowed, retryAfterMs, remainingPoints } = limitLogin(ip, 10, 60_000)

  if (!allowed) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    })
  }

  // remainingPoints tells how many attempts remain in this window
  console.log(`Login allowed, ${remainingPoints} attempts remaining`)
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
```

### Exposing remaining quota in response headers

You can use `remainingPoints` and `retryAfterMs` to set standard rate-limit
headers on every response, not just on rejections.

```ts [quotaHeaders.ts]
import { slidingWindowCounterRateLimiter } from '@riavzon/utils'

const limitApi = slidingWindowCounterRateLimiter({
  maxEntries: 200_000,
  sweepIntervalMs: 10_000,
})

export async function handleApiRequest(req: Request, apiKey: string) {
  const limit = 100
  const windowMs = 60_000
  const { allowed, retryAfterMs, remainingPoints } = limitApi(apiKey, limit, windowMs)
 
  const headers = new Headers({
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remainingPoints),
  })

  if (!allowed) {
    headers.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)))
    return new Response('Too Many Requests', { status: 429, headers })
  }

  return new Response(JSON.stringify({ data: 'ok' }), { status: 200, headers })
}
```

--- 

These rate limiters are often used with other shared utilities in the package.
The following pages explain the closest related building blocks.

- See [MiniCache](/docs/utils/shared/minicache) for the TTL and eviction
  behavior that backs these limiters.
- See [fetchWithRetry](/docs/utils/shared/fetchwithretry) if you also need
  client-side backoff and retry behavior after a `429` response.
