---
title: Data Sources
description: Every built-in data source, what database it produces, the upstream providers it fetches from, and the record structure it compiles.
icon: i-lucide-database
---

Shield Base fetches data from 14 built-in sources across five categories: network routing, geographic location, anonymity and proxy detection, threat intelligence, and application-layer fingerprints. Each source produces one or more binary database files in either MMDB format (IP range lookups) or LMDB format (key-value lookups).

---

## Sources at a Glance

| Source | Flag | Output file | Format |
| --- | --- | --- | --- |
| [BGP / ASN](./bgp) | `--bgp` | `asn.mmdb` | MMDB |
| [City Geolocation](./city) | `--city` | `city.mmdb` | MMDB |
| [Country Geolocation](./country) | `--geo` | `country.mmdb` | MMDB |
| [Proxy Detection](./proxy) | `--proxy` | `proxy.mmdb` | MMDB |
| [Tor Nodes](./tor) | `--tor` | `tor.mmdb` | MMDB |
| [Verified Crawlers](./crawlers) | `--seo` | `goodBots.mmdb` | MMDB |
| [FireHOL Threats](./firehol) | `--l1` `--l2` `--l3` `--l4` `--anonymous` | `firehol_*.mmdb` | MMDB |
| [Suspicious User-Agents](./useragent) | `--useragent` | `useragent-db/useragent.mdb` | LMDB |
| [Disposable Emails](./email) | `--email` | `email-db/disposable-emails.mdb` | LMDB |
| [JA4+ Fingerprints](./ja4) | `--ja4` | `ja4-db/ja4.mdb` | LMDB |

---

## Database Formats

[**MMDB**](https://maxmind.github.io/MaxMind-DB/) (MaxMind DB) is a binary format optimized for IP range lookups. Given an IP address, an MMDB reader returns the record associated with the matching CIDR prefix in microseconds. Every MMDB source requires the [`mmdbctl`](https://github.com/ipinfo/mmdbctl) binary to compile.

[**LMDB**](https://en.wikipedia.org/wiki/Lightning_Memory-Mapped_Database) (Lightning Memory-Mapped Database) is a key-value store with zero-copy reads and memory-mapped access. It is used for sources keyed by string identifiers rather than IP addresses: user-agent patterns, email domains, and TLS fingerprints. LMDB sources do not require any external binary.

---

## Compiling All Sources

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --all --parallel --contact "Name https://example.com - you@example.com" --acceptFireholRisk
```

```bash [yarn]
yarn dlx @riavzon/shield-base --all --parallel --contact "Name https://example.com - you@example.com" --acceptFireholRisk
```

```bash [npm]
npx @riavzon/shield-base --all --parallel --contact "Name https://example.com - you@example.com" --acceptFireholRisk
```

```bash [bun]
bunx @riavzon/shield-base --all --parallel --contact "Name https://example.com - you@example.com" --acceptFireholRisk
```
```ts [Programmatic]
import { generateData as executeAll } from '@riavzon/shield-base';

await executeAll('./data/mmdb', 'Your Name https://example.com - you@example.com', true, 'mmdbctl');
```
::
