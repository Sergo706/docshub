---
title: BGP / ASN
description: Autonomous System Numbers and prefix routing data from BGP.tools, compiled into asn.mmdb with classification and hit count metadata.
icon: i-lucide-network
---

The BGP source fetches ASN definitions and routing table data from [BGP.tools](https://bgp.tools) and compiles them into a single MMDB database. Each record maps a CIDR prefix to its Autonomous System, including the AS name, classification, and route visibility (hit count). Routes with fewer than 10 hits are filtered out.

**Output file:** `asn.mmdb`

---

## Data Sources

- ASN definitions CSV: [bgp.tools/asns.csv](https://bgp.tools/asns.csv)
- BGP routing table JSONL: [bgp.tools/table.jsonl](https://bgp.tools/table.jsonl)

::warning
[BGP.tools](https://bgp.tools/kb/api) requires a valid contact User-Agent in the format `<name> [url] - <email>`. You must provide this via the interactive wizard or the `--contact` flag to avoid API blocking.
::

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --bgp --contact "Your Name https://example.com - you@example.com"
```

```bash [yarn]
yarn dlx @riavzon/shield-base --bgp --contact "Your Name https://example.com - you@example.com"
```

```bash [npm]
npx @riavzon/shield-base --bgp --contact "Your Name https://example.com - you@example.com"
```

```bash [bun]
bunx @riavzon/shield-base --bgp --contact "Your Name https://example.com - you@example.com"
```
```ts [Programmatic]
import { getBGPAndASN } from '@riavzon/shield-base';

await getBGPAndASN('Your Name https://example.com - you@example.com', './out', 'mmdbctl');
```
::

---

## Record Structure

```ts
interface BgpRecord {
  range: string;          // CIDR prefix, e.g. "8.8.8.0/24"
  asn_id: string;         // AS number, e.g. "15169"
  asn_name: string;       // AS name, e.g. "Google LLC"
  classification: string; // "Content" | "Eyeballs" | "Unknown"
  hits: string;           // Route visibility count
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 8.8.8.8 outputDirectory/asn.mmdb
```

```json
{
  "asn_id": "15169",
  "asn_name": "Google LLC",
  "classification": "Content",
  "hits": "2679",
  "ip": "8.8.8.8",
  "network": "8.8.8.0/24"
}
```
