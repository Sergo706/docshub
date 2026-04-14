---
title: run
description: Executes a shell command and returns the output via a Promise.
icon: i-lucide-terminal
---

The `run` utility is a modernized, Promise-based wrapper around Node.js's native `child_process.exec`.

It enables seamless execution of shell commands within an `async/await` flow, automatically parsing and returning both `stdout` and `stderr`. It also overrides the restrictive default buffer size, allowing for processes with massive outputs without crashing.

::callout{icon="i-lucide-alert-triangle" color="error"}
**Warning**: This utility designed to be used server side and its provided input is not sanitized. Do not pass untrusted values to it.
::

## Definition

```ts [run.ts]
import type { ExecOptions } from 'node:child_process';

export interface RunResult {
  stdout: string | Buffer;
  stderr: string | Buffer;
}

/**
 * Executes a shell command and returns the output.
 *
 * @param command - The shell command to execute
 * @param options - Optional node:child_process ExecOptions
 * @returns A promise resolving to the stdout and stderr
 */
export const run = async (command: string, options: ExecOptions = {}): Promise<RunResult>
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `command` | `string` | Yes | The literal shell command string to execute. |
| `options` | `ExecOptions` | No | Any native Node.js `ExecOptions` overrides (like `cwd`, `env`, or custom `maxBuffer`). |


## Example Usage

This utility automatically trims whitespace from string outputs and includes robust error logging when a command fails or throws an exception.

```ts [example.ts]
import { run } from '@riavzon/utils/server'

async function checkSystemMemory() {
  try {
    // Run the 'free -m' command across the system
    const { stdout, stderr } = await run('free -m');

    if (stderr) {
      console.warn('Command produced warnings:', stderr);
    }

    console.log('Memory Stats:\n', stdout);
  } catch (error) {
    console.error('Failed to retrieve system memory.');
    // The run utility has already safely logged the exact stderr payload internally
  }
}
```
