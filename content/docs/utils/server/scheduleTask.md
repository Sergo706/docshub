---
title: scheduleTask
description: Run background jobs of the main process.
icon: i-lucide-time
---

`scheduleTask` runs recurring background jobs from the main process without blocking the event loop. It is suitable for scheduled cleanup, cache refresh, and other maintenance tasks that must not overlap with themselves.

On Unix each job is executed with the lowest CPU priority using `nice -n 19`. On Windows the command is executed as provided. The scheduler uses a recursive timer so the next run is scheduled only after the previous run completes.

Standard output and error from each job are buffered; the buffer is capped by `memoryCap` (default 10MB) to protect the host process from excessive memory usage. All active jobs are tracked and can be awaited via `shutdownScheduledTasks()` during graceful shutdown.
## `scheduleTask`

### Definition

```ts [scheduleTask.ts]
export function scheduleTask(
	name: string,
	cmd: string,
	args: string[],
	interval: number,
	memoryCap?: number
): void
```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Label used in console log messages for this task. |
| `cmd` | `string` | — | Absolute or relative path to the executable. |
| `args` | `string[]` | — | Arguments passed to the executable. |
| `interval` | `number` | — | Milliseconds to wait after a task completes before running it again. |
| `memoryCap` | `number` | `10 * 1024 * 1024` | Max stdout/stderr buffer in bytes for the child process. |

The scheduler will not schedule new runs after `shutdownScheduledTasks()` has been invoked. Errors produced by the child process are logged to stderr; the scheduler itself does not throw.

### Example Usage

```typescript [server.ts]
import { scheduleTask, shutdownScheduledTasks } from '@riavzon/utils/server'

// Run a cleanup script every 12 hours.
scheduleTask('cleanup', '/bin/sh', ['-c', 'echo cleanup'], 1000 * 60 * 60 * 12)

// On process shutdown, wait for active jobs to finish.
process.on('SIGINT', async () => {
	await shutdownScheduledTasks()
	process.exit(0)
})
```

::callout{icon="i-lucide-info" color="info"}
Call `shutdownScheduledTasks()` during graceful shutdown to avoid terminating active child processes.
::

::callout{icon="i-lucide-alert-triangle" color="warning"}
This utility is server-side only. It relies on Node.js child process behavior and will not work in browser or edge runtimes.
::

