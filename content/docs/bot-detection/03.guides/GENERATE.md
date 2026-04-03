---
title: Scheduling Database Generation
description: How bot-detector generate works, what it produces, when to run it, and how to automate it.
icon: i-lucide-database-zap
---

`bot-detector generate` reads your accumulated visitor and ban history and compiles it into two binary MMDB databases: `banned.mmdb` and `highRisk.mmdb`. Once compiled, the [Known Bad IPs](/docs/bot-detection/checkers/known-bad-ips) checker reads these files in the cheap phase, rejecting repeat offenders in microseconds without running the full 17-checker pipeline.

The databases do not exist on a fresh installation. They grow as your application accumulates traffic and ban records, and they only become useful once you run generation for the first time.

---

## What Generation Produces

Running `bot-detector generate` compiles two files into `_data-sources/` inside the package directory. Both run in parallel.

**`banned.mmdb`**: built from every row in the `banned` table that has a non-null `ip_address`. Each entry stores the IP, score, country, user agent, and reason codes from the ban event. The [Known Bad IPs](/docs/bot-detection/checkers/known-bad-ips) checker reads this file and triggers an immediate `BAD_BOT_DETECTED` ban for any matching IP, skipping all other checkers.

**`highRisk.mmdb`**: built from rows in the `visitors` table where `suspicious_activity_score` is at or above `generator.scoreThreshold` (default `70`). These are visitors who accumulated a suspicious score but were never banned. On their next visit, they receive `highRiskPenalty` points in the cheap phase, bringing them closer to `banScore` with less effort from other checkers.

If either table has no qualifying rows, the corresponding file is skipped silently. The checker handles missing files by skipping that lookup.

---

## Hot Reload

The MMDB files are opened with `watchForUpdates: true`. When a new file is written to disk, the reader reloads it automatically without restarting your application. You can run generation while traffic is live and the updated databases take effect within seconds.

::note
`watchForUpdates` is disabled during tests (`NODE_ENV=test`). In all other environments it is always on.
::

---

## Configuration

The `generator` block in `defineConfiguration` controls all generation behavior.

```ts [server.ts]
await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
  generator: {
    scoreThreshold: 70,
    deleteAfterBuild: false,
    mmdbctlPath: 'mmdbctl',
    generateTypes: false,
  },
})
```

::field-group
::field{name="scoreThreshold" type="number"}
Minimum `suspicious_activity_score` for a visitor row to be included in `highRisk.mmdb`. Lower values include more visitors; higher values are more conservative. Default: `70`.
::

::field{name="deleteAfterBuild" type="boolean"}
When `true`, rows compiled into `banned.mmdb` are deleted from the `banned` table, and high-risk rows compiled into `highRisk.mmdb` are deleted from the `visitors` table. This keeps the database lean but means the raw rows are gone after generation. Default: `false`.
::

::field{name="mmdbctlPath" type="string"}
Path to the `mmdbctl` binary used to compile MMDB files. If the binary is not on `PATH`, provide the absolute path here. Default: `'mmdbctl'`.
::

::field{name="generateTypes" type="boolean"}
When `true`, TypeScript type definitions are generated alongside the MMDB files. Useful during development. Default: `false`.
::
::

::warning
`deleteAfterBuild: true` permanently removes rows from your database after each generation. If generation fails mid-run, some rows may already be deleted. Only enable this if your database size is a concern and you have another record of your ban history.
::

---

## Running Generation

### CLI

Run generation from the terminal at any time:

::code-group

```bash [npm]
npx @riavzon/bot-detector generate
```

```bash [pnpm]
pnpm dlx @riavzon/bot-detector generate
```

```bash [yarn]
yarn dlx @riavzon/bot-detector generate
```


```bash [bun]
bunx @riavzon/bot-detector generate
```
::

The command reads your current configuration, connects to the configured database, compiles both MMDB files, and exits. If `mmdbctl` is not found at the configured path, it prompts you to install it.

### Programmatic

Call `runGeneration()` from your application code. This is useful for triggering generation after a bulk ban operation.

```ts [server.ts]
import { runGeneration } from '@riavzon/bot-detector';

await runGeneration();
```

`runGeneration()` requires `defineConfiguration()` to have been called and awaited first.

---

## Scheduling with Cron

Running generation on a schedule ensures that new bans from ongoing traffic are captured in the MMDB files regularly. The right frequency depends on your traffic volume.

The examples below use a standard Unix cron format. Adjust the path and user to match your deployment.

```cron [crontab]
# Run every night at 2:00 AM
0 2 * * * cd /app && npx bot-detector generate >> /var/log/bot-detector-generate.log 2>&1
```

For higher-traffic applications where bans accumulate quickly:

```cron [crontab]
# Run every hour
0 * * * * cd /app && npx bot-detector generate >> /var/log/bot-detector-generate.log 2>&1
```

::tip
Log the output of the generate command. It emits structured info lines including the entry count for each compiled database, making it easy to spot when traffic patterns change or ban volume spikes.
::

### Triggering After Bulk Bans

When you perform a bulk operation that adds many rows to the `banned` table, for example, after processing a list of known bad IPs or running a manual review, trigger generation immediately rather than waiting for the next scheduled run:

```ts [admin-script.ts]
import { updateBannedIP, runGeneration } from '@riavzon/bot-detector';
import type { BannedInfo } from '@riavzon/bot-detector';

// Bulk insert ban records...
for (const ip of badIps) {
  const info: BannedInfo = { score: 100, reasons: ['PREVIOUSLY_BANNED_IP'] };
  await updateBannedIP('', ip, 'us', '', info);
}

// Compile updated MMDB immediately
await runGeneration();
```

---

## `scoreThreshold` and the `highRisk.mmdb` Tradeoff

The `scoreThreshold` value controls how aggressively `highRisk.mmdb` is populated. A lower threshold includes visitors who triggered only a few weak signals. A higher threshold limits the file to visitors with strong evidence of suspicious behavior.

| Threshold | Effect |
| --- | --- |
| `40` | Catches more visitors who have accumulated moderate scores. Higher risk of including false positives. |
| `70` (default) | Balanced. Captures visitors with strong suspicious history. |
| `90` | Conservative. Only the most suspicious non-banned visitors are included. |

::note
The `highRiskPenalty` configured under `enableKnownBadIpsCheck` controls how many points a high-risk IP receives on its next visit (default `30`). This is separate from `scoreThreshold`. Raising `highRiskPenalty` makes high-risk IPs easier to ban on return; lowering it uses `highRisk.mmdb` as a contributing signal rather than a near-ban trigger.
::
