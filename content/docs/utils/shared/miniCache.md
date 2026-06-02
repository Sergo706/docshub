---
title: MiniCache
description: In-memory TTL cache with insertion-order eviction and LRU-style access refresh.
icon: i-lucide-database
---

The `MiniCache` class is a lightweight, in-memory cache for short-lived values.
It combines per-entry TTL expiration with insertion-order eviction and an
LRU-style refresh on successful reads. This makes it useful for request
deduplication, temporary lookup caching, and small per-process state stores.

`MiniCache` works entirely in local process memory. It does not persist data,
share state across instances, or guarantee global consistency across multiple
servers.

---

## Definition

```ts [miniCache.ts]
/**
 * Small in-memory TTL cache supporting LRU-style eviction using insertion order.
 *
 * @typeParam T - Stored value type.
 */
export class MiniCache<T = unknown> {
  constructor(maxEntries = Infinity, sweepIntervalMs = 60_000)

  stale(key: string): T | null
  set(key: string, value: T, ttlMs: number): void
  get(key: string): T | null
  del(key: string): void
  clear(): void
}
```

## Constructor parameters

Create a `MiniCache` instance once, then reuse it for related values.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `Infinity` | Maximum number of keys stored at once. When the cache exceeds this size, the oldest key in insertion/access order is evicted. |
| `sweepIntervalMs` | `number` | `60000` | Interval in milliseconds for the background sweep that removes expired entries. |

## Behavior

`MiniCache` mixes TTL expiration with Map-based ordering rules. These behaviors
matter when you use it as the store for limiters, deduplication, or
short-lived memoization.

| Behavior | Description |
| --- | --- |
| TTL expiration | Each `set()` call stores an absolute expiry timestamp based on `Date.now() + ttlMs`. |
| Lazy expiration | `get()` removes expired values when you access them. |
| Background cleanup | A timer periodically sweeps expired entries even if they are never read again. |
| LRU-style refresh | A successful `get()` moves the key to the newest position in the internal `Map`. |
| Insertion-order eviction | When `maxEntries` is exceeded, the oldest key in the current order is removed. |
| Unref'd timer | In Node.js environments that support `unref()`, the sweep timer does not keep the process alive on its own. |

## Methods

The class exposes five public methods. Together they let you add, read, inspect,
delete, and clear cached values.

| Method | Description |
| --- | --- |
| `stale(key)` | Returns the stored value without checking expiry and without refreshing its position in the LRU order. |
| `set(key, value, ttlMs)` | Adds or updates a value with a specific TTL and evicts the oldest entry if the cache grows beyond `maxEntries`. |
| `get(key)` | Returns the cached value when it exists and is still fresh. Removes expired entries and refreshes successful reads to the newest position. |
| `del(key)` | Immediately removes an entry. |
| `clear()` | Clears all entries. |

### `stale(key)`

`stale()` reads the raw stored value without validating its TTL and without
updating the entry's position in the internal Map. Use it only when you
explicitly want an unchecked lookup.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Cache key to inspect. |

**Returns:** `T | null`. Returns the stored value when the key exists, or
`null` when the key is missing.

::callout{icon="i-lucide-info" color="info"}
`stale()` does not check whether the entry is expired. If the background sweep
has not removed an expired key yet, `stale()` can still return that value.
::

### `set(key, value, ttlMs)`

`set()` inserts a new entry or replaces an existing one. When a key already
exists, the old value is removed first so the new write becomes the newest item
in the eviction order.

After the value is stored, `MiniCache` checks `maxEntries`. If the cache is now
too large, it evicts the oldest key until the size is back within the limit.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Unique cache key. |
| `value` | `T` | Yes | Value to store in the cache. |
| `ttlMs` | `number` | Yes | Time-to-live in milliseconds for this specific entry. |

**Returns:** `void`.

### `get(key)`

`get()` is the main read method. It returns `null` when the key is missing or
expired. When the value is still valid, it moves the entry to the newest
position in the internal Map so frequently accessed keys are less likely to be
evicted next.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Cache key to retrieve. |

**Returns:** `T | null`. Returns the fresh cached value, or `null` when the key
does not exist or its TTL has expired.

### `del(key)`

`del()` removes one entry immediately. Use it when you know a cached value is no
longer valid and should not wait for TTL expiration.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | `string` | Yes | Cache key to delete. |

**Returns:** `void`.

### `clear()`

`clear()` removes every cached entry at once. This is useful for teardown,
manual invalidation, or tests that need a clean cache state.

**Returns:** `void`.

## Example Usage

The most common pattern is caching short-lived values that are cheap to rebuild
but expensive to fetch repeatedly.

```typescript [example.ts]
import { MiniCache } from '@riavzon/utils'

// Cache up to 100 entries, and sweep expired items every 30 seconds.
const cache = new MiniCache<string>(100, 30_000)

// Store a value with a 5-minute TTL.
cache.set('user:1', 'John Doe', 5 * 60 * 1000)

// Read the cached value.
const user = cache.get('user:1')
console.log(user) // "John Doe"

// Successful reads refresh the key's position in the eviction order.
cache.get('user:1')

// Remove the entry explicitly when it becomes invalid.
cache.del('user:1')
```

You can also use `MiniCache` to keep a small set of recent objects in memory
without promoting stale values accidentally.

```typescript [sessionCache.ts]
import { MiniCache } from '@riavzon/utils'

interface SessionState {
  userId: string
  roles: string[]
}

const sessions = new MiniCache<SessionState>(10_000, 60_000)

export function storeSession(token: string, session: SessionState) {
  sessions.set(token, session, 15 * 60_000)
}

export function getSession(token: string) {
  return sessions.get(token)
}

export function peekSessionUnchecked(token: string) {
  return sessions.stale(token)
}
```

::callout{icon="i-lucide-info" color="info"}
The cache uses a background timer to periodically clean up
expired items, and `get()` also enforces expiration on access. This combination
keeps memory usage under control even when some keys are never read again.
::
