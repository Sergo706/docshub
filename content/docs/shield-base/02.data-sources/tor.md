---
title: Tor Nodes
description: Live Tor relay and exit node data fetched from the Tor Project's Onionoo API, compiled into tor.mmdb.
icon: i-lucide-globe-lock
---

The Tor source fetches live relay data directly from the [Tor Project's Onionoo API](https://metrics.torproject.org/onionoo.html) and compiles it into an MMDB database. The script filters for relay nodes with the following flags: `Exit`, `Valid`, `Running`, `Stable`, or `HSDir`. IP addresses are normalized to `/24` (IPv4) or `/64` (IPv6) CIDR blocks.

**Output file:** `tor.mmdb`

---

## Data Source

- Onionoo details endpoint: [onionoo.torproject.org/details](https://onionoo.torproject.org/details)

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --tor
```

```bash [yarn]
yarn dlx @riavzon/shield-base --tor
```

```bash [npm]
npx @riavzon/shield-base --tor
```

```bash [bun]
bunx @riavzon/shield-base --tor
```
```ts [Programmatic]
import { getTorLists } from '@riavzon/shield-base';

await getTorLists('./out', 'mmdbctl');
```
::

---

## Record Structure

```ts
interface TorRecord {
  range: string;
  or_addresses: string;
  exit_addresses: string;
  last_seen: string;
  last_changed_address_or_port: string;
  first_seen: string;
  running: boolean;
  flags: string;                // e.g. "Exit,Fast,Running,Valid"
  country: string;
  country_name: string;
  as: string;                   // ASN identifier, e.g. "AS215125"
  as_name: string;
  last_restarted: string;
  exit_policy: string;
  exit_policy_summary: string;
  exit_policy_v6_summary?: string;
  contact: string;
  version_status: string;
  guard_probability: number;
  middle_probability: number;
  exit_probability: number;
  recommended_version: boolean;
  measured: boolean;
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 192.42.116.52 outputDirectory/tor.mmdb
```

```json
{
  "as": "AS215125",
  "as_name": "Church of Cyberology",
  "contact": "email:mail[]nothingtohide.nl url:nothingtohide.nl proof:uri-rsa abuse:abuse[]nothingtohide.nl ciissversion:2",
  "country": "nl",
  "country_name": "Netherlands",
  "exit_addresses": "192.42.116.49",
  "exit_policy_summary": "{\"accept\":[\"43\",\"53\",\"80\",\"110\",\"143\",\"194\",\"220\",\"443\",\"465\",\"587\",\"853\",\"873\",\"993\",\"995\",...]}",
  "exit_probability": 0.0005507535,
  "first_seen": "2023-07-07 00:00:00",
  "flags": "Exit,Fast,Running,Valid",
  "guard_probability": 0,
  "last_restarted": "2026-03-07 17:44:13",
  "last_seen": "2026-03-08 10:00:00",
  "measured": true,
  "middle_probability": 0,
  "or_addresses": "192.42.116.49:9004",
  "recommended_version": true,
  "running": true,
  "version_status": "recommended"
}
```

::tip
The [Tor Analysis](/docs/bot-detection/checkers/tor-analysis) checker in Bot Detector reads this database and applies configurable penalties for exit nodes, guard nodes, bad exits, and obsolete versions.
::
