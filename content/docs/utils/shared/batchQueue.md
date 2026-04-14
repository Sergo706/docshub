---
title: BatchQueue
description: Generic in-memory batch queue that collects jobs and processes them in bulk with deduplication, retries, and graceful shutdown.
icon: i-lucide-layers
---

`BatchQueue` collects jobs in an internal buffer and flushes them in bulk. A flush triggers automatically when a job is added with `'immediate'` priority, when the buffer reaches `maxBufferSize`, or when `flushIntervalMs` elapses. Failed flushes retry up to `maxRetries` times before the batch is discarded.

`BatchQueue` deduplicates by job `id`. When a job with the same `id` is enqueued multiple times before a flush, the latest payload overwrites the earlier one. For example, if a user's bot score is updated three times per second but the queue flushes every three seconds, the database receives exactly one write for that user — containing the most recent score.

Every job has a **priority**. `'deferred'` jobs accumulate in the buffer and flush together when the timer fires or the buffer fills — this is the normal mode that provides the batching benefit. `'immediate'` jobs bypass the wait and trigger a flush right away, for high-urgency writes that cannot be delayed.

## Definition

```ts [batchQueue.ts]
export type Priority = 'immediate' | 'deferred'

export interface BatchQueueOptions {
  /** Maximum queued jobs before an automatic flush. @default 100 */
  maxBufferSize?: number
  /** Milliseconds before flushing a non-full buffer. @default 5000 */
  flushIntervalMs?: number
  /** Retry attempts on flush failure before discarding the batch. @default 3 */
  maxRetries?: number
  /** Logger with `error` and `info` methods. @default console */
  logger?: Pick<Console, 'error' | 'info'>
}

export class BatchQueue<T> {
  constructor(
    processor: (params: T) => Promise<void>,
    options?: BatchQueueOptions
  )

  add(id: string, params: T, priority?: Priority): Promise<void>
  flush(): Promise<void>
  shutdown(): Promise<void>
}
```

## Constructor Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `processor` | `(params: T) => Promise<void>` | Yes | Called once per job during a flush. Receives the job's `params` object. |
| `options` | `BatchQueueOptions` | No | Optional tuning parameters. See Options table. |

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxBufferSize` | `number` | `100` | Flush when this many jobs are queued. |
| `flushIntervalMs` | `number` | `5000` | Flush after this many milliseconds of inactivity. |
| `maxRetries` | `number` | `3` | Retry a failed flush this many times, with a 1-second delay between each attempt. |
| `logger` | `Pick<Console, 'error' \| 'info'>` | `console` | Any logger with `error` and `info` methods, such as a pino child logger. |

## Methods

### `add(id, params, priority?)`

Enqueues a job. A job with the same `id` already in the buffer is overwritten — the latest payload wins and the earlier one is discarded. This prevents stale data from being written when the same entity is updated multiple times before a flush.

- **`'deferred'`** — Adds the job to the buffer. Starts the timer if it is not already running. Flushes when the timer fires or the buffer fills.
- **`'immediate'`** — Adds the job and flushes the entire queue before returning. Use this for high-urgency events where waiting for the next timed or size-triggered flush is not acceptable.

### `flush()`

Forces all queued jobs to be processed, calling `processor` for each job in parallel via `Promise.all`.

`flush()` uses a while-loop guard to handle concurrent callers without losing jobs. Here is what happens when two callers overlap:

1. Caller A calls `flush()`, snapshots the current batch, and clears the buffer.
2. New jobs arrive in the buffer while Caller A is still processing.
3. Caller B calls `flush()`, sees that a flush is already in progress, and waits.
4. Caller A's flush completes. The while loop checks again — new jobs exist in the buffer.
5. Those jobs are processed in a second pass. `flush()` only returns once the in-flight promise is null **and** the buffer is empty.

No jobs are skipped regardless of how many callers overlap.

### `shutdown()`

Calls `flush()` once and returns after all pending jobs are processed. Register this on `SIGTERM` or `beforeExit` to avoid dropping jobs when the process exits.

## Example Usage

The most common use case is batching high-frequency database writes so each incoming request does not incur its own round-trip:

```typescript [visitorQueue.ts]
import { BatchQueue } from '@riavzon/utils'

interface VisitorUpdate {
  userId: string
  score: number
  isBot: boolean
}

// Called once per job when the batch flushes.
async function saveVisitor({ userId, score, isBot }: VisitorUpdate) {
  await db.query(
    'UPDATE visitors SET score = $1, is_bot = $2 WHERE id = $3',
    [score, isBot, userId]
  )
}

const visitorQueue = new BatchQueue<VisitorUpdate>(saveVisitor, {
  maxBufferSize: 200,
  flushIntervalMs: 3000,
  maxRetries: 3,
  logger: logger.child({ service: 'visitorQueue' }),
})

// Duplicate ids are deduplicated — the second call replaces the first.
await visitorQueue.add(`visitor:${userId}`, { userId, score: 0.9, isBot: false })
await visitorQueue.add(`visitor:${userId}`, { userId, score: 0.95, isBot: false })

// Force an immediate flush for a confirmed ban.
await visitorQueue.add(`visitor:${userId}`, { userId, score: 1, isBot: true }, 'immediate')

// Drain on shutdown so no jobs are lost.
process.on('SIGTERM', () => visitorQueue.shutdown())
```

Multiple queues with different job shapes can coexist independently:

```typescript [queues.ts]
import { BatchQueue } from '@riavzon/utils'

interface EmailJob  { to: string; subject: string; body: string }
interface MetricJob { name: string; value: number; tags: string[] }

const emailQueue = new BatchQueue<EmailJob>(
  async ({ to, subject, body }) => mailer.send(to, subject, body),
  { maxBufferSize: 50, flushIntervalMs: 5000 }
)

const metricsQueue = new BatchQueue<MetricJob>(
  async ({ name, value, tags }) => statsd.gauge(name, value, tags),
  { maxBufferSize: 500, flushIntervalMs: 1000 }
)
```

::callout{icon="i-lucide-alert-triangle" color="warning"}
Retries replay the original batch snapshot — not the live buffer. When a flush fails, the same captured batch is retried with a 1-second delay between attempts. Jobs that arrive during retries are held in the buffer and processed in the next flush cycle. After all retry attempts are exhausted, the snapshot is permanently discarded and an error is logged. Wrap your `processor` in a try/catch that persists failed jobs to a dead-letter store before re-throwing if data loss is unacceptable.
::
