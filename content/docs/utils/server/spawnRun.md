---
title: spawnRun
description: Spawns a child process to run a shell command, streaming output live.
icon: i-lucide-terminal-square
---

The `spawnRun` utility is a Promise-based wrapper around Node.js's `child_process.spawn` for running shell commands with live output streaming. It is ideal for long-running or interactive processes, forwarding stdout and stderr directly to the parent process in real time.

::caution
This utility designed to be used server side and its provided input is not sanitized. Do not pass untrusted values to it.
::

## Definition

```ts [run.ts]
import type { SpawnOptionsWithoutStdio } from 'node:child_process';

/**
 * Spawns a child process to run a shell command, streaming stdout and stderr live to the parent process.
 *
 * @param cmd - The command to execute (e.g., 'npx').
 * @param args - Arguments to pass to the command (default: []).
 * @param options - Optional spawn options. If `detached` is true, the child will be detached from the parent.
 *
 * @returns A promise that resolves when the process exits with code 0, or rejects with an error if the exit code is nonzero or the process fails to start.
 */
export const spawnRun = async (
  cmd: string,
  args: string[] = [],
  options: SpawnOptionsWithoutStdio = {}
) => Promise<void>
```

## Parameters

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `cmd` | `string` | Yes | — | The shell command to execute. |
| `args` | `string[]` | No | `[]` | Arguments to pass to the command. |
| `options` | `SpawnOptionsWithoutStdio` | No | `{}` | Node.js spawn options (`cwd`, `env`, `detached`, etc). |

## Behavior

- Streams stdout and stderr live to the parent process.
- Resolves when the process exits with code 0.
- Rejects if the process exits with a nonzero code or fails to start.
- If `detached: true`, the child process is detached and unreferenced.

## Example Usage

```ts [example.ts]
import { spawnRun } from '@riavzon/utils/server'

async function runBuild() {
  try {
    // Run a build script and stream output
    await spawnRun('npm', ['run', 'build']);
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error);
  }
}
```

```ts [example-detached.ts]
import { spawnRun } from '@riavzon/utils/server'

async function startDetachedProcess() {
  await spawnRun('node', ['server.js'], { detached: true });
  console.log('Server started in detached mode.');
}
```