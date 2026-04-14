---
title: Suspicious User-Agents
description: Curated list of malicious and suspicious HTTP User-Agent strings compiled into an LMDB database keyed by pattern name.
icon: i-lucide-scan-search
---

This source downloads a curated CSV list of suspicious and malicious HTTP User-Agent strings from [mthcht/awesome-lists](https://github.com/mthcht/awesome-lists/tree/main/Lists). Use it to detect and block known bad clients at the request level. Each record includes regex patterns, severity ratings, tool metadata, and flow direction flags.

**Output file:** `useragent-db/useragent.mdb`

---

## Data Source

- Suspicious user-agents CSV: [mthcht/awesome-lists](https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/suspicious_http_user_agents_list.csv)

::note
A `useragent.mdb-lock` file is generated automatically alongside the database. This file is required for concurrent access.
::

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --useragent
```

```bash [yarn]
yarn dlx @riavzon/shield-base --useragent
```

```bash [npm]
npx @riavzon/shield-base --useragent
```

```bash [bun]
bunx @riavzon/shield-base --useragent
```
```ts [Programmatic]
import { getUserAgentLmdbList } from '@riavzon/shield-base';

// Compile into LMDB
await getUserAgentLmdbList('./out');

// Or download the raw CSV without compiling
import { getUserAgentList } from '@riavzon/shield-base';
await getUserAgentList('./out'); // outputs useragent.csv
```
::

---

## Record Structure

```ts
type Severity = 'none' | 'low' | 'medium' | 'high' | 'critical';
type Usage = 'Hunting' | 'Detection rule';

interface UserAgentRecord {
  useragent_rx: string;                                  // Regex pattern
  metadata_description: string;
  metadata_tool: string;
  metadata_category: string;
  metadata_link: string;
  metadata_priority: Severity;
  metadata_fp_risk: Severity;
  metadata_severity: Severity;
  metadata_usage: Usage;
  metadata_flow_from_external: boolean | null;
  metadata_flow_from_internal: boolean | null;
  metadata_flow_to_internal: boolean | null;
  metadata_flow_to_external: boolean | null;
  metadata_for_successful_external_login_events: boolean | null;
  metadata_comment: string;
  date: string;
  comment: string;
}
```

---

## Reading the Database

Use the `lm-read` subcommand to inspect records from the command line:

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base lm-read --path ./out/useragent-db/useragent.mdb --name useragent --operation get --key "*DecoyLoader*"
```

```bash [yarn]
yarn dlx @riavzon/shield-base lm-read --path ./out/useragent-db/useragent.mdb --name useragent --operation get --key "*DecoyLoader*"
```

```bash [npm]
npx @riavzon/shield-base lm-read --path ./out/useragent-db/useragent.mdb --name useragent --operation get --key "*DecoyLoader*"
```

```bash [bun]
bunx @riavzon/shield-base lm-read --path ./out/useragent-db/useragent.mdb --name useragent --operation get --key "*DecoyLoader*"
```
```ts [Programmatic]
import { getByKey } from '@riavzon/shield-base';
import type { UserAgentRecord } from '@riavzon/shield-base';

const record = getByKey<UserAgentRecord>(
  './out/useragent-db/useragent.mdb',
  'useragent',
  '*DecoyLoader*'
);
```
::

```json
{
  "useragent_rx": "(?:).*DecoyLoader.*(?:)",
  "metadata_description": "malware sample communicating over HTTP with a hard-coded C2 server and this using string in the user-agent",
  "metadata_tool": "DecoyLoader",
  "metadata_category": "Malware",
  "metadata_link": "",
  "metadata_priority": "high",
  "metadata_fp_risk": "none",
  "metadata_severity": "high",
  "metadata_usage": "Detection rule",
  "metadata_flow_from_external": null,
  "metadata_flow_from_internal": null,
  "metadata_flow_to_internal": null,
  "metadata_flow_to_external": null,
  "metadata_for_successful_external_login_events": null,
  "metadata_comment": "",
  "date": "2026-03-24T23:23:16.470Z",
  "comment": "Data maintained by https://github.com/mthcht/awesome-lists, transformed by Shield-base"
}
```

::tip
The [Known Bad User-Agents](/docs/bot-detection/checkers/known-bad-ua) checker in Bot Detector reads this database to match incoming request user-agent strings against known malicious patterns.
::
