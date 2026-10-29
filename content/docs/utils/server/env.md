---
title: env
description: Total, fallback-safe readers for environment variables that never crash at import time.
icon: i-lucide-sliders-horizontal
---

The `env` module provides small, predictable readers for `process.env`. Each getter is **total**: it never throws and never returns a value outside the requested range. A missing, blank, malformed, or out-of-range variable falls back to the caller's default, so a bad `.env` degrades a single feature instead of crashing the process at startup.

The one deliberate exception is `envRequired`, which exists precisely to fail loudly for credentials.

::note
Values are read on every call rather than cached at module load. This makes the helpers safe to use in tests where `process.env` changes between assertions. If you need load-time semantics, read the value once into a constant.
::

## Definition

```ts [env.ts]
export type EnvRangeFallback = "fallback" | "clamp";

export interface EnvNumberOptions {
  min?: number;
  max?: number;
  onRangeError?: EnvRangeFallback;
}

export function envInt(
  name: string,
  fallback: number,
  options?: EnvNumberOptions,
): number;
export function envFloat(
  name: string,
  fallback: number,
  options?: EnvNumberOptions,
): number;
export function envIntOrInfinity(name: string, fallback: number): number;
export function envStr(name: string, fallback: string): string;
export function envList(name: string, fallback?: readonly string[]): string[];
export function envBool(name: string, fallback: boolean): boolean;
export function envRequired(name: string): string;
```

## Range options

`envInt` and `envFloat` accept the same options object.

| Property       | Type               | Default      | Description                                                                                                                   |
| -------------- | ------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `min`          | `number`           | `-Infinity`  | Inclusive lower bound.                                                                                                        |
| `max`          | `number`           | `Infinity`   | Inclusive upper bound.                                                                                                        |
| `onRangeError` | `EnvRangeFallback` | `'fallback'` | `'fallback'` returns the caller's default when the parsed value is out of range. `'clamp'` returns the nearest bound instead. |

When `min` is greater than `max`, the bounds are treated as misconfigured and the fallback is returned regardless of `onRangeError`.

::tip
Use `onRangeError: 'clamp'` for tuning knobs such as thresholds or concurrency limits. A typo then lands on the nearest valid value instead of silently disabling the feature. Keep the default `'fallback'` for values where any substitution would be wrong.
::

## Functions

### envInt

Integer reader. Falls back when the variable is missing, empty, non-numeric, non-integer, or out of range.

| Parameter  | Type               | Required | Description                            |
| ---------- | ------------------ | -------- | -------------------------------------- |
| `name`     | `string`           | Yes      | The environment variable name.         |
| `fallback` | `number`           | Yes      | Returned when the value is unusable.   |
| `options`  | `EnvNumberOptions` | No       | Value range and out-of-range behavior. |

`" 42 "`, `1e3`, and `0x10` are accepted because `Number` understands them. `"12.5"`, `"abc"`, `""`, and `"Infinity"` are rejected.

```ts [example.ts]
import { envInt } from "@riavzon/utils/server";

const port = envInt("PORT", 3000, { min: 1, max: 65535 });
const retries = envInt("RETRIES", 3, { min: 1, onRangeError: "clamp" });
```

### envFloat

Float reader. Falls back when the variable is missing, empty, non-numeric, or out of range.

| Parameter  | Type               | Required | Description                            |
| ---------- | ------------------ | -------- | -------------------------------------- |
| `name`     | `string`           | Yes      | The environment variable name.         |
| `fallback` | `number`           | Yes      | Returned when the value is unusable.   |
| `options`  | `EnvNumberOptions` | No       | Value range and out-of-range behavior. |

`NaN` and `Infinity` are rejected here. Use `envIntOrInfinity` when "unbounded" is itself a meaningful setting.

```ts [example.ts]
import { envFloat } from "@riavzon/utils/server";

const threshold = envFloat("SIMILARITY_THRESHOLD", 0.9, { min: 0, max: 1 });
const temperature = envFloat("TEMPERATURE", 0.2, {
  min: 0,
  max: 2,
  onRangeError: "clamp",
});
```

### envIntOrInfinity

Positive integer, or `Infinity` when the variable is explicitly `infinity`, `inf`, or `none`.

| Parameter  | Type     | Required | Description                          |
| ---------- | -------- | -------- | ------------------------------------ |
| `name`     | `string` | Yes      | The environment variable name.       |
| `fallback` | `number` | Yes      | Returned when the value is unusable. |

The sentinels are case-insensitive and surrounding whitespace is ignored. Any other value passes through `envInt` with `min: 1`, so `0` and negative numbers fall back instead of reaching a loop as a zero budget.

```ts [example.ts]
import { envIntOrInfinity } from "@riavzon/utils/server";

// MAX_ITEMS=none means "no limit"
const maxItems = envIntOrInfinity("MAX_ITEMS", 100);
const budget = Number.isFinite(maxItems) ? maxItems : Number.MAX_SAFE_INTEGER;
```

### envStr

String reader with a fallback for missing and blank values.

| Parameter  | Type     | Required | Description                                               |
| ---------- | -------- | -------- | --------------------------------------------------------- |
| `name`     | `string` | Yes      | The environment variable name.                            |
| `fallback` | `string` | Yes      | Returned when the variable is missing or whitespace-only. |

The value is trimmed, but inner whitespace and case are preserved.

```ts [example.ts]
import { envStr } from "@riavzon/utils/server";

const region = envStr("AWS_REGION", "eu-central-1");
const appName = envStr("APP_NAME", "My App"); // inner spaces kept
```

### envList

Comma-separated list, split, trimmed, and lower-cased, with blanks dropped.

| Parameter  | Type                | Required | Description                                                                                 |
| ---------- | ------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `name`     | `string`            | Yes      | The environment variable name.                                                              |
| `fallback` | `readonly string[]` | No       | Returned as a copy when the variable is missing or holds only separators. Defaults to `[]`. |

`"a, B ,,c "` becomes `['a', 'b', 'c']`. Duplicates are kept, so the order and multiplicity of the raw value survive.

```ts [example.ts]
import { envList } from "@riavzon/utils/server";

const allowedHosts = envList("ALLOWED_HOSTS"); // [] when unset
const suffixes = envList("TRUSTED_SUFFIXES", ["gov"]); // fallback is not mutated
```

::warning
The returned array is always a fresh copy, including when the fallback is used. Mutating the result never affects the array you passed in.
::

### envBool

Boolean reader with an explicit allow-list.

| Parameter  | Type      | Required | Description                                          |
| ---------- | --------- | -------- | ---------------------------------------------------- |
| `name`     | `string`  | Yes      | The environment variable name.                       |
| `fallback` | `boolean` | Yes      | Returned for missing, blank, or unrecognized values. |

| Value                                  | Result     |
| -------------------------------------- | ---------- |
| `true`, `1`, `yes`, `on`               | `true`     |
| `false`, `0`, `no`, `off`              | `false`    |
| Anything else, including `ture` or `2` | `fallback` |

Matching is case-insensitive. A typo falls back rather than guessing, so a mistake cannot silently flip a safety switch.

```ts [example.ts]
import { envBool } from "@riavzon/utils/server";

const bypassCache = envBool("BYPASS_CACHE", false);
const dryRun = envBool("DRY_RUN", true);
```

### envRequired

Reads a variable that must be present and non-blank.

| Parameter | Type     | Required | Description                    |
| --------- | -------- | -------- | ------------------------------ |
| `name`    | `string` | Yes      | The environment variable name. |

Returns the trimmed value and throws when the variable is missing, empty, or whitespace-only.

```ts [example.ts]
import { envRequired } from "@riavzon/utils/server";

const databaseUrl = envRequired("DATABASE_URL");
// Throws: Missing required environment variable: DATABASE_URL
```

::caution
This is the only throwing getter in the module. Use it for credentials, connection strings, and anything else where a silent fallback would hide the misconfiguration until the first request arrives. Call it at the point of use rather than at module scope so a missing variable fails with a useful stack trace instead of breaking every import.
::

## Behavior summary

| Value in `process.env` | `envInt` | `envFloat` | `envStr`     | `envList`         | `envBool` |
| ---------------------- | -------- | ---------- | ------------ | ----------------- | --------- |
| Unset                  | fallback | fallback   | fallback     | fallback copy     | fallback  |
| `''` or whitespace     | fallback | fallback   | fallback     | fallback copy     | fallback  |
| `'42'`                 | `42`     | `42`       | `'42'`       | `['42']`          | fallback  |
| `'12.5'`               | fallback | `12.5`     | `'12.5'`     | `['12.5']`        | fallback  |
| `'abc'`                | fallback | fallback   | `'abc'`      | `['abc']`         | fallback  |
| `'Infinity'`           | fallback | fallback   | `'Infinity'` | `['infinity']`    | fallback  |
| `'yes'`                | fallback | fallback   | `'yes'`      | `['yes']`         | `true`    |
| `'a, B ,,c '`          | fallback | fallback   | `'a, B ,,c'` | `['a', 'b', 'c']` | fallback  |
