---
title: Proxy Detection
description: Known proxy and anonymizer IP ranges aggregated from multiple public blocklists, compiled into proxy.mmdb.
icon: i-lucide-eye-off
---

The Proxy source aggregates known proxy and anonymizer IP addresses from multiple public blocklists and merges them into a single deduplicated MMDB database. Each record stores the IP range, port (when known), and a comment identifying the data source.

**Output file:** `proxy.mmdb`

---

## Data Sources

- Proxy CSV from [mthcht/awesome-lists](https://github.com/mthcht/awesome-lists/tree/main/Lists/PROXY): [ALL_PROXY_Lists.csv](https://raw.githubusercontent.com/mthcht/awesome-lists/refs/heads/main/Lists/PROXY/ALL_PROXY_Lists.csv)
- FireHOL proxy netset: [firehol_proxies.netset](https://raw.githubusercontent.com/firehol/blocklist-ipsets/refs/heads/master/firehol_proxies.netset)

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --proxy
```

```bash [yarn]
yarn dlx @riavzon/shield-base --proxy
```

```bash [npm]
npx @riavzon/shield-base --proxy
```

```bash [bun]
bunx @riavzon/shield-base --proxy
```
```ts [Programmatic]
import { getListOfProxies } from '@riavzon/shield-base';

await getListOfProxies('./out', 'mmdbctl');
```
::

---

## Record Structure

```ts
interface ProxyRecord {
  range: string;   // IPv4 address or CIDR
  port: string;    // Port number, or "unknown" if not available
  comment: string; // Comma-separated source feed names
}
```

---

## Example Lookup

```bash [Terminal]
mmdbctl read -f json-pretty 1.0.136.198 outputDirectory/proxy.mmdb
mmdbctl read -f json-pretty 102.217.190.157 outputDirectory/proxy.mmdb
```

```json
{
  "comment": "Ip from Firehol",
  "ip": "1.0.136.198",
  "network": "1.0.136.198/32",
  "port": "unknown"
}

{
  "comment": "TheSpeedX, openproxy",
  "ip": "102.217.190.157",
  "network": "102.217.190.157/32",
  "port": "7080"
}
```

::tip
The [Proxy / ISP / Cookies](/docs/bot-detection/checkers/proxy-isp-cookies) checker in Bot Detector reads this database to detect anonymized traffic.
::
