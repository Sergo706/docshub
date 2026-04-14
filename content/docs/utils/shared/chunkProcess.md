---
title: chunkProcess
description: Processes an array in chunks asynchronously.
icon: i-lucide-list-tree
---

The `chunkProcess<T>` utility is designed to safely process a large array of items by dividing it into smaller, manageable "chunks".

This is incredibly useful for database operations (like batch inserts/updates) or API requests where handling an entire massive array at once would cause rate limits, memory issues, or query parameter limits.

## Definition

```ts [chunkProcess.ts]
/**
 * Processes an array in chunks.
 *
 * @param items The array to process.
 * @param chunkSize The size of each chunk. Must be greater than 0.
 * @param processor A function to process each chunk. Can be async.
 */
export async function chunkProcess<T>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[], index: number) => Promise<void> | void
): Promise<void>
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | Yes | The array of items you need to process. |
| `chunkSize` | `number` | Yes | The maximum number of items per chunk. Must be strictly greater than 0. |
| `processor` | `Function` | Yes | The callback function executed for every chunk. It receives the `chunk` itself and its starting `index`. It can be asynchronous. |

## Example Usage

In this example, imagine we have 5000 post IDs that we need to update in a database, but our database driver only allows updates of 1000 IDs at a time. `chunkProcess` handles the loop logic for us.

```typescript [example.ts]
import { chunkProcess } from '@riavzon/utils'

const allPostIds = [1, 2, 3, 4, 5, /* ... thousands more ... */];

await chunkProcess(allPostIds, 1000, async (chunkIds, index) => {
  // This will run multiple times, with chunkIds having a maximum length of 1000 each time.
  console.log(`Processing chunk starting at index: ${index}`);

  await db.update(posts).where(inArray(posts.id, chunkIds));
});

console.log('All posts processed successfully.')
```
