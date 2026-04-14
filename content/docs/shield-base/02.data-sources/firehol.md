---
title: FireHOL Threat Intelligence
description: Five FireHOL blocklist levels fetched from the firehol/blocklist-ipsets repository, each compiled into its own MMDB database keyed by IP range.
icon: i-lucide-shield-alert
---

The FireHOL source fetches IPv4 blocklists from the [firehol/blocklist-ipsets](https://github.com/firehol/blocklist-ipsets) repository and compiles each selected level into a separate MMDB database. Each database is named after its source level.

**Output files:** `firehol_l1.mmdb`, `firehol_l2.mmdb`, `firehol_l3.mmdb`, `firehol_l4.mmdb`, `firehol_anonymous.mmdb`

---

## Threat Levels

| Level | Description | Flag |
| --- | --- | --- |
| **Level 1** | Maximum protection, minimum false positives. | `--l1` |
| **Level 2** | Recent attacks. | `--l2` |
| **Level 3** | Active attacks, spyware, and viruses. | `--l3` |
| **Level 4** | Aggressive tracking, higher false-positive risk. | `--l4` |
| **Anonymous** | Tor exit nodes, I2P, VPNs, and other anonymity network relays. | `--anonymous` |

::note
FireHOL datasets its self aggregate these datasets, and, depending on the sources, may carry specific licensing.
Check [FireHOL](https://github.com/firehol/blocklist-ipsets) documentation, for more information. 
::

::warning
You must pass `--acceptFireholRisk` when using these sources via the CLI, or acknowledge the license during the interactive wizard. 
::

---

## Data Sources

| Level | URL |
| --- | --- |
| `firehol_l1` | [firehol_level1.netset](https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level1.netset) |
| `firehol_l2` | [firehol_level2.netset](https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level2.netset) |
| `firehol_l3` | [firehol_level3.netset](https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level3.netset) |
| `firehol_l4` | [firehol_level4.netset](https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_level4.netset) |
| `firehol_anonymous` | [firehol_anonymous.netset](https://github.com/firehol/blocklist-ipsets/raw/refs/heads/master/firehol_anonymous.netset) |

---

## Usage

Select one or more levels using their corresponding flags. All FireHOL flags require `--acceptFireholRisk`.

::code-group
```bash [pnpm]
# Compile all five levels
pnpm dlx @riavzon/shield-base --l1 --l2 --l3 --l4 --anonymous --acceptFireholRisk

# Compile Level 1 and Level 2 only
pnpm dlx @riavzon/shield-base --l1 --l2 --acceptFireholRisk
```

```bash [yarn]
yarn dlx @riavzon/shield-base --l1 --l2 --l3 --l4 --anonymous --acceptFireholRisk
yarn dlx @riavzon/shield-base --l1 --l2 --acceptFireholRisk
```

```bash [npm]
npx @riavzon/shield-base --l1 --l2 --l3 --l4 --anonymous --acceptFireholRisk
npx @riavzon/shield-base --l1 --l2 --acceptFireholRisk
```

```bash [bun]
bunx @riavzon/shield-base --l1 --l2 --l3 --l4 --anonymous --acceptFireholRisk
bunx @riavzon/shield-base --l1 --l2 --acceptFireholRisk
```
```ts [Programmatic]
import { getThreatLists } from '@riavzon/shield-base';

// Compile all five levels
await getThreatLists('./out', 'mmdbctl', true);

// Compile a specific subset
await getThreatLists('./out', 'mmdbctl', ['firehol_l1', 'firehol_l2', 'firehol_anonymous']);
```
::

---

## Record Structure

Each record stores the IP range and a comment identifying its source level and maintainer:

```ts
interface ThreatRecord {
  range: string;   // IPv4 address or CIDR, e.g. "45.143.203.0/24"
  comment: string; // e.g. "firehol_l1  Maintainer: http://iplists.firehol.org/"
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 45.143.203.111 outputDirectory/firehol_l1.mmdb
mmdbctl read -f json-pretty 1.31.80.222 outputDirectory/firehol_l2.mmdb
mmdbctl read -f json-pretty 1.24.16.177 outputDirectory/firehol_l3.mmdb
mmdbctl read -f json-pretty 1.10.141.115 outputDirectory/firehol_l4.mmdb
mmdbctl read -f json-pretty 1.0.136.76 outputDirectory/firehol_anonymous.mmdb
```

```json
{
"comment": "firehol_l1  Maintainer: http://iplists.firehol.org/",
"ip": "45.143.203.111",
"network": "45.143.203.0/24"
}

{
"comment": "firehol_l2  Maintainer: http://iplists.firehol.org/",
"ip": "1.31.80.222",
"network": "1.31.80.222/32"
}
{
"comment": "firehol_l3  Maintainer: http://iplists.firehol.org/",
"ip": "1.24.16.177",
"network": "1.24.16.177/32"
}

{
"comment": "firehol_l4  Maintainer: http://iplists.firehol.org/",
"ip": "1.10.141.115",
"network": "1.10.141.115/32"
}

{
"comment": "firehol_anonymous  Maintainer: http://iplists.firehol.org/",
"ip": "1.0.136.76",
"network": "1.0.136.76/32"
}
```

::tip
The [Known Threat](/docs/bot-detection/checkers/known-threats) checker in Bot Detector reads these databases and applies configurable penalty scores per FireHOL level. Higher levels carry more aggressive penalties.
::
