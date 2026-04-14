---
title: MiniCache
description: A small in-memory TTL cache supporting LRU-style eviction.
icon: i-lucide-database
---

The `MiniCache` class is a lightweight, in-memory caching utility. It provides Time-To-Live (TTL) support for entries and implements an LRU-style (Least Recently Used) eviction policy to ensure the cache size remains within a defined limit.

## Definition

```ts [miniCache.ts]
/**
 * Small in-memory TTL cache supporting LRU-style eviction using insertion order.
 *
 * @typeParam T - Stored value type.
 */
export class MiniCache<T = any> {
  /**
   * Creates a new cache instance.
   *
   * @param maxEntries - Maximum number of entries before evicting the oldest (default: Infinity).
   * @param sweepIntervalMs - Interval used to remove expired items (default: 60,000ms).
   */
  constructor(maxEntries = Infinity, sweepIntervalMs = 60_000)
}
```

## Methods
| Method | Description |
| --- | --- |
| `set(key, value, ttlMs)` | Adds or updates a value with a specific TTL. Updates LRU order. |
| `get(key)` | Retrieves a value, checking for expiry. Updates LRU order on success. |
| `stale(key)` | Retrieves a value without updating LRU order or checking expiry. |
| `del(key)` | Immediately removes an entry. |
| `clear()` | Clears all entries. |

## Example Usage

```typescript [example.ts]
import { MiniCache } from '@riavzon/utils'

// Cache up to 100 entries, sweep expired items every 30 seconds
const cache = new MiniCache<string>(100, 30_000);

// Set a value with a 5-minute TTL
cache.set('user:1', 'John Doe', 5 * 60 * 1000);

// Retrieve the value
const user = cache.get('user:1');
console.log(user); // "John Doe"

// If the key is accessed frequently, it stays at the end of the eviction queue.
```

::callout{icon="i-lucide-info" color="info"}
The cache uses a background timer (`sweepIntervalMs`) to periodically clean up expired items, ensuring memory is reclaimed even if keys are not accessed.
::
