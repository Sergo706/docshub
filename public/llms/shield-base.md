---
title: Shield Base
description: Threat intelligence, disposable-email lists, and compiled Geo/IP datasets used across the Riavzon ecosystem.
icon: i-lucide-shield
---

Shield Base is a data aggregation and compilation tool that collects public network intelligence and converts it into offline, ready-to-query databases. It produces MMDB and LMDB artifacts and TypeScript types so services can perform fast lookups for geolocation, ASN, proxy/tor detection, crawler verification, disposable-email checks, ja4 fingerprint matching, and more.

::note
Use Shield Base to produce compact, typed lookup databases for runtime checks.
::

## What it does

- Fetches and normalizes many public sources: BGP/ASN feeds, GeoIP datasets, FireHOL/Threat blocklists, Tor/Proxy lists, verified crawler IP ranges, suspicious user-agents, disposable-email domains, and JA4 fingerprints.
- Compiles IP-range data into `.mmdb` files using `mmdbctl` for fast IP lookups.
- Compiles key-value and fingerprint datasets into LMDB `.mdb` files for efficient key lookups.
- Generates TypeScript types from JSON inputs so lookups are strongly typed.
- Exposes both a CLI (`shield-base`) and a programmatic API (`@riavzon/shield-base`).

## Primary data sources

- ASN and BGP routing tables (prefixes, origin ASNs)
- City and country geolocation data
- FireHOL and other threat blocklists (multiple protection levels)
- Tor exit node lists and curated proxy lists
- Major search-engine and platform crawler IP ranges
- Suspicious and malicious user-agent patterns
- Disposable email domain blocklists
- JA4 TLS/SSL fingerprints

## Outputs

- MMDB files (`*.mmdb`) for IP-to-metadata and range queries
- LMDB files (`*.mdb`) for key-value datasets (user-agents, disposable emails, ja4)
- Generated TypeScript type files from JSON inputs

## CLI examples

Run a single dataset build:

```bash
# Build disposable-email LMDB
npx @riavzon/shield-base --email

# Build JA4 fingerprint database
npx @riavzon/shield-base --ja4

# Build user-agent LMDB
npx @riavzon/shield-base --useragent
```

Compile JSON into mmdb or lmdb with the compiler subcommand:

```bash
# Compile IP-range JSON into an MMDB
npx @riavzon/shield-base compile --type mmdb --name myMmdbDb --outputDir ./out example.json

# Compile key-value JSON into an LMDB
npx @riavzon/shield-base compile --type lmdb --name myDb --outputDir ./out example.json
```

CI and test example (used in `@riavzon/auth`):

```bash
# Generate disposable-email dataset into a path used by the service
npx @riavzon/shield-base --email --path=.github/_data-sources
```

## Programmatic usage

Minimal examples using the public API documented in the package:

```ts
import { getDisposableEmailLmdbList, getUserAgentLmdbList, compiler } from '@riavzon/shield-base'

// Disposable emails
await getDisposableEmailLmdbList('./out')

// User agents
await getUserAgentLmdbList('./out')

// Compile a JSON array into an MMDB with types
await compiler({
  type: 'mmdb',
  input: {
    data: 'example.json',
    dataBaseName: 'myMmdbDb',
    mmdbPath: '/usr/local/bin/mmdbctl',
    outputPath: './out',
    generateTypes: true
  }
})
```

## Integration notes

- The `@riavzon/auth` and `@riavzon/bot-detector` services consume Shield Base outputs for anomaly detection, rate limiting, disposable-email rejection, and crawler identification.
- For production builds, generate fresh data during the build step and store artifacts in your immutable artifact storage.
- For CI and tests, prebuilt fixtures are acceptable. Use Git LFS to store large test fixtures or generate them during the CI run.

## Performance and size

Some data sources are large (multi-megabyte to hundreds of megabytes). Use `mmdbctl` to inspect MMDB contents and verify sizes. When storing test fixtures in a repository, use Git LFS and avoid committing very large raw files directly.

## Troubleshooting

- If a source fetch fails, re-run the specific dataset command. Many sources are fetched with tiered fallbacks.
- `ja4` datasets are large. Ensure enough disk space and avoid loading the whole file into memory; Shield Base streams large sources.
- The CLI will prompt for a contact User-Agent for certain providers. Provide `--contact 'Name [url] - email@domain'` in automated runs.

## Links

- Repository: https://github.com/Sergo706/shield-base-cli
- Package: https://www.npmjs.com/package/@riavzon/shield-base
- Full Docs for users: https://docs.riavzon.com/docs/shield-base
- Full Docs for LLMS: https://docs.riavzon.com/llms-full.txt
- mmdbctl: https://github.com/ipinfo/mmdbctl