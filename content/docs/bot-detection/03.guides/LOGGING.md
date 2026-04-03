---
title: Logging
description: Understanding the structured log output, log files, log levels, and what each entry tells you about the detection pipeline.
icon: i-lucide-scroll-text
---

`bot-detector` uses [Pino](https://getpino.io/) for structured JSON logging. Every significant event in the detection pipeline writes a log entry: request phases start and end, each individual checker fires its own entries with duration and score, bans are recorded, and reputation updates are tracked. All output goes to files on disk, split by severity.

---

## Log Files

Three files are written on startup if they do not already exist. Each file captures its named level and everything above it.

| File | Level captured | Contents |
| --- | --- | --- |
| `info.log` | `info` and above | Full pipeline trace: phase boundaries, per-checker results, reputation updates, cache hits |
| `warn.log` | `warn` and above | Ban decisions, pipeline aborts when `banScore` is reached, missing visitor records |
| `errors.log` | `error` and above | Storage failures, database errors, unexpected exceptions |

The files are written to a `bot-detector-logs/` directory resolved from `process.cwd()`. Set the `LOG_DIR` environment variable to write logs to a different location.

```bash [Terminal]
LOG_DIR=/var/log/bot-detector node server.js
```

---
 
## Log Level

The `logLevel` configuration option controls the minimum level that is processed. Lower levels produce more output; higher levels suppress verbose trace entries.

```ts [server.ts]
await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error' | 'fatal'
})
```

| Level | When to use |
| --- | --- |
| `debug` | Development only. Produces extremely verbose output. |
| `info` | Default. Full pipeline trace with per-checker timing. |
| `warn` | Production with moderate traffic. Ban decisions and errors only. |
| `error` | Strict mode. Only infrastructure failures. |
| `fatal` | Minimal. Only unrecoverable errors. |

::tip
Use `warn` in production environments where log volume is a concern. Ban decisions and errors are always captured at `warn` and `error` respectively, so you lose nothing operationally by suppressing `info` in high-traffic deployments.
::

---

## Log Structure

Every entry is a JSON object. Pino adds `level`, `time`, and `pid` automatically. The logger adds `uptime` (seconds since process start) to every entry via a mixin. Internal modules add a `service` and `branch` field to identify where the entry came from.

```json
{
  "level": 30,
  "time": "2025-04-01T12:00:00.000Z",
  "pid": 1234,
  "uptime": 142.5,
  "service": "BOT DETECTOR",
  "branch": "checks",
  "phase": "cheapPhase",
  "reqId": 1743508800000,
  "event": "start"
}
```

Common `branch` values and what they cover:

| `branch` | Source |
| --- | --- |
| `main` | Top-level detection entry and ban decisions |
| `checks` | Per-checker and per-phase timing |
| `reputation` | Score healing and cache reads |
| `generator` | MMDB compilation runs |
| `batchQueue` | Deferred DB write operations |

---

## Per-Checker Entries

For every checker that runs, two entries are written: one when the checker starts and one when it finishes. The finish entry includes the checker's name, how long it took, what score it returned, and what reason codes it fired.

```json
{
  "level": 30,
  "service": "BOT DETECTOR",
  "branch": "checks",
  "reqId": 1743508800000,
  "check": "Tor Analysis",
  "event": "end",
  "durationMs": 0.041,
  "score": 35,
  "reasons": ["TOR_ACTIVE_NODE", "TOR_EXIT_NODE"]
}
```

When the accumulated score reaches `banScore`, the pipeline stops and writes a `warn`-level entry:

```json
{
  "level": 40,
  "service": "BOT DETECTOR",
  "branch": "checks",
  "reqId": 1743508800000,
  "botScore": 100,
  "msg": "Bot detected — aborting checks"
}
```

This entry tells you exactly which checker pushed the score over the threshold. The checkers that fired before this entry in the same `reqId` group show you the full picture of why the visitor was banned.

---

## Sensitive Field Redaction

The logger automatically redacts values at the following paths before writing to disk. Redacted values are replaced with `[SECRET]`.

| Redacted path | Covers |
| --- | --- |
| `*.password` | Any nested `password` field |
| `*.email` | Any nested `email` field |
| `name`, `Name` | Top-level name fields |
| `cookie`, `cookies` | Top-level cookie fields |
| `*.cookie`, `*.cookies` | Any nested cookie fields |
| `*.accessToken` | Any nested access token |
| `*.refresh_token` | Any nested refresh token |
| `*.secret` | Any nested secret field |

::note
Canary cookie values appear as strings in some log entries (for cache key tracing). The redaction covers structured object fields, not inline string values in log messages. Avoid logging `ctx.cookie` directly in custom checkers.
::

---

## Reading Logs for a Specific Request

Each request gets a `reqId` derived from `Date.now()` at the point the pipeline starts. To trace all entries for a single request, filter by `reqId`. With standard Unix tools:

```bash [Terminal]
grep '"reqId":1743508800000' bot-detector-logs/info.log | jq .
```

The entries in order give you the full execution trace: phase start, each checker with its score and reasons, phase end, and if the visitor was banned, the `warn` abort entry.

::tip
In production, pipe your `info.log` into a log aggregator (Loki, Datadog, CloudWatch) and filter by `reqId` or `branch` in the aggregator's query interface rather than grepping files directly.
::
