---
title: JA4+ Fingerprints
description: Community-maintained JA4+ TLS fingerprint database from JA4DB.com, compiled into an LMDB database keyed by fingerprint hash.
icon: i-lucide-fingerprint
---

This source downloads a JSON file of JA4+ fingerprints for various clients, maintained by the community at [JA4DB.com](https://ja4db.com). These fingerprints represent the unique TLS/SSL configuration of the client software, such as a browser or an automated tool, rather than a specific IP address. Use it to reject or identify malicious bots, automated scrapers, or unauthorized tools that attempt to connect using known high-risk fingerprints.

**Output file:** `ja4-db/ja4.mdb`

---

## Data Source

- JA4+ fingerprint database: [ja4db.com/api/read/](https://ja4db.com/api/read/)

::note
The source dataset is several hundred megabytes. Shield Base streams it directly from the fetch response to avoid loading it into memory. A `ja4.mdb-lock` file is generated automatically alongside the database.
::

During compilation, Shield Base explodes each record by its fingerprint variant fields (`ja4_fingerprint`, `ja4s_fingerprint`, `ja4h_fingerprint`, `ja4x_fingerprint`, `ja4t_fingerprint`, `ja4ts_fingerprint`, `ja4tscan_fingerprint`). Each non-null fingerprint becomes a separate key in the LMDB database, all pointing back to the full record.

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --ja4
```

```bash [yarn]
yarn dlx @riavzon/shield-base --ja4
```

```bash [npm]
npx @riavzon/shield-base --ja4
```

```bash [bun]
bunx @riavzon/shield-base --ja4
```
```ts [Programmatic]
import { getJaDatabaseLmdb } from '@riavzon/shield-base';

// Compile into LMDB, keyed by fingerprint hash
await getJaDatabaseLmdb('./out');

// Or download the raw JSON file without compiling
import { getJaDatabase } from '@riavzon/shield-base';
await getJaDatabase('./out'); // outputs ja4.json
```
::

---

## Record Structure

```ts
interface JA4 {
  application: string | null;
  library: string | null;
  device: string | null;
  os: string | null;
  user_agent_string: string | null;
  certificate_authority: string | null;
  observation_count: number | null;
  verified: boolean | null;
  notes: string | null;
  ja4_fingerprint: string | null;
  ja4_fingerprint_string: string | null;
  ja4s_fingerprint: string | null;
  ja4h_fingerprint: string | null;
  ja4x_fingerprint: string | null;
  ja4t_fingerprint: string | null;
  ja4ts_fingerprint: string | null;
  ja4tscan_fingerprint: string | null;
  date: string;
  comment: string;
}
```

---

## Reading the Database

Use the `lm-read` subcommand to look up a fingerprint hash:

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base lm-read --path ./out/ja4-db/ja4.mdb --name ja4 --operation get --key "1024_2_1460_00"
```

```bash [yarn]
yarn dlx @riavzon/shield-base lm-read --path ./out/ja4-db/ja4.mdb --name ja4 --operation get --key "1024_2_1460_00"
```

```bash [npm]
npx @riavzon/shield-base lm-read --path ./out/ja4-db/ja4.mdb --name ja4 --operation get --key "1024_2_1460_00"
```

```bash [bun]
bunx @riavzon/shield-base lm-read --path ./out/ja4-db/ja4.mdb --name ja4 --operation get --key "1024_2_1460_00"
```
```ts [Programmatic]
import { getByKey } from '@riavzon/shield-base';
import type { JA4 } from '@riavzon/shield-base';

const record = getByKey<JA4>(
  './out/ja4-db/ja4.mdb',
  'ja4',
  '1024_2_1460_00'
);
```
::

```json
{
  "application": "Nmap",
  "library": null,
  "device": null,
  "os": null,
  "user_agent_string": null,
  "certificate_authority": null,
  "observation_count": 1,
  "verified": true,
  "notes": "",
  "ja4_fingerprint": null,
  "ja4_fingerprint_string": null,
  "ja4s_fingerprint": null,
  "ja4h_fingerprint": null,
  "ja4x_fingerprint": null,
  "ja4t_fingerprint": "1024_2_1460_00",
  "ja4ts_fingerprint": null,
  "ja4tscan_fingerprint": null,
  "date": "2026-03-24T23:23:24.116Z",
  "comment": "Maintained by https://ja4db.com, transformed by Shield-Base"
}
```
