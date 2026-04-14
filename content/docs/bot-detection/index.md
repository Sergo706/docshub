---
title: Bot Detector
description: Express middleware for multi-layered bot detection with a two-phase pipeline of 17 configurable checkers, cumulative scoring, and canary cookie fingerprinting.
icon: i-lucide-shield-half
---

`@riavzon/bot-detector` is an Express middleware that filters incoming requests through a two-phase pipeline of 17 configurable checkers. Each checker contributes a penalty score toward a configurable ban threshold. Requests that cross the threshold receive a `403` response, or a firewall-level block when `punishmentType.enableFireWallBan` is enabled.
 
The pipeline runs cheap, synchronous checks first. When the accumulated score stays below the ban threshold, the heavy phase runs. This ordering keeps median pipeline latency around 1.2 ms.

::callout{icon="i-lucide-server" color="warning"}
`punishmentType.enableFireWallBan` requires a **Linux** environment with `ufw` available and passwordless `sudo` for the Node.js process. The detection pipeline itself runs on any Node.js 18+ platform.
::

## Detection Pipeline

The middleware processes each request in two sequential phases to keep latency low without sacrificing accuracy.

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Phase 1 - Cheap Checks
  description: Synchronous in-memory lookups against MMDB and LMDB databases. Covers IP validation, User-Agent analysis, header fingerprinting, geolocation consistency, FireHOL threat feeds, Tor analysis, ASN classification, timezone consistency, and honeypot paths.
  icon: i-lucide-zap
  ---
  ::

  ::UPageCard
  --- 
  title: Phase 2 - Heavy Checks
  description: Asynchronous checks that read from the visitor cache or perform database queries. Covers behavioral rate limiting, proxy and ISP detection, session coherence, velocity fingerprinting, and bad User-Agent pattern matching against the LMDB library.
  icon: i-lucide-cpu
  ---
  ::
::

## Features

- **17 Configurable Checkers**: Every checker ships with sensible defaults and can be individually disabled or tuned with custom penalty weights.
- **Custom Checkers**: You can provide your own custom checkers via `CheckerRegistry` and custom data sources.
-  **Self optimized**: uses collected visitor data to become smarter and faster over time. Instead of running the full pipeline for known offenders, it compiles your latest database rows into local mmdb files to instantly drop past threats and high risk visitors.
- **Multi-Database Support**: The visitor persistence layer supports SQLite, MySQL, PostgreSQL, Cloudflare D1, and PlanetScale through the `db0` adapter.
- **Cumulative Scoring**: Penalty points accumulate across all checks. Requests that exceed `banScore` (default `100`) receive a `403` response.
- **Canary Cookie Fingerprinting**: The middleware issues a cryptographic cookie on first contact. Returning visitors are identified by this cookie, enabling behavioral rate tracking and session coherence checks.
- **Good Bot Exemptions**: Verified crawlers like Googlebot and Bingbot are identified through IP range matching and reverse DNS lookups, and are exempt from scoring.
- **Fast**: around 1.2ms median latency for the full pipeline.
- **CLI Tools**: The `bot-detector` CLI manages data source downloads, compilation, and custom threat database generation from your visitor history.

## Documentation

::UPageGrid
  ::UPageCard
  ---
  title: Getting Started
  description: Prerequisites, installation, data source setup, and first-run configuration.
  icon: i-lucide-rocket
  to: /docs/bot-detection/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: CLI
  description: Using the CLI to for data generation and getting started fast.
  icon: lucide:code-xml
  to: /docs/bot-detection/cli
  ---
  ::

  ::UPageCard
  ---
  title: Data Sources
  description: The data sources the bot detector uses.
  icon: lucide:database
  to: /docs/bot-detection/data-sources
  ---
  ::
 
   
  ::UPageCard
  ---
  title: Guides
  description: Guides on how to use the module configure custom checkers and more.
  icon: lucide:book-open
  to: /docs/bot-detection/guides/custom
  ---
  ::

  ::UPageCard
  ---
  title: API Reference
  description: Complete reference for all exported functions, utilities, the checker system, and TypeScript types.
  icon: i-lucide-code
  to: /docs/bot-detection/api
  ---
  :: 
  
  ::UPageCard
  ---
  title: Configuration
  description: Full configuration reference.
  icon: lucide:settings
  to: /docs/bot-detection/configuration  
  ---
  ::
::
::UPageGrid{class="lg:grid-cols-2 mt-5"}
  ::UPageCard
  ---
  title: Checkers
  description: Breakdown about each checker and what it does.
  icon: lucide:bot
  to: /docs/bot-detection/checkers
  ---
  ::
  ::UPageCard
  ---
  title: Security
  description: The scoring system, penalty configuration, the canary cookie mechanism, and persistent bans.
  icon: i-lucide-lock
  to: /docs/bot-detection/security
  ---
  :: 

::