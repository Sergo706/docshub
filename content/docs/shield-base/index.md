---
title: Shield Base
description: CLI and programmatic toolkit for compiling offline-ready IP intelligence databases from BGP, GeoIP, Tor, FireHOL, and other public threat feeds into MMDB and LMDB formats.
icon: i-lucide-database-zap
---

`@riavzon/shield-base` aggregates, processes, and compiles network intelligence data from multiple public sources into offline binary formats. It fetches [BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) routing tables, geographic location databases, threat intelligence lists, verified crawler IP ranges, and more, then consolidates them into ready-to-use MMDB and LMDB databases for security analysis and traffic filtering.

The tool works both as an interactive CLI powered by [Consola](https://github.com/unjs/consola) and as a fully typed programmatic library.

::note
Shield Base is the data layer that powers the [Bot Detector](/docs/bot-detection) module. All MMDB and LMDB databases it compiles are read directly by the bot detection pipeline.
::

## Features

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
  title: Interactive Wizard
  description: Choose only the databases you need or compile them all. Supports flag-based execution for CI/CD environments.
  icon: i-lucide-terminal
  ---
  ::

  ::UPageCard
  ---
  title: Dual Compiler
  description: Compiles IP range data into MMDB format via mmdbctl, and key-value data into LMDB .mdb databases with no external binary required.
  icon: i-lucide-layers
  ---
  ::

  ::UPageCard
  ---
  title: 14 Built-in Sources
  description: BGP/ASN, City, Country, Tor, Proxy, FireHOL threat levels (L1-L4 + Anonymous), verified crawlers, suspicious user-agents, disposable emails, and JA4+ fingerprints.
  icon: i-lucide-database
  ---
  ::

  ::UPageCard
  ---
  title: Type Generation
  description: Automatically generates fully typed TypeScript interfaces from any JSON input, for both custom data and built-in datasets.
  icon: i-lucide-braces
  ---
  ::

  ::UPageCard
  ---
  title: LMDB Reader
  description: Inspect any .mdb database from the command line with the lm-read subcommand, including get, range, prefix, count, exists, stats, and drop operations.
  icon: i-lucide-search
  ---
  ::

  ::UPageCard
  ---
  title: Programmatic API
  description: Every data source and compiler is exported as a typed function you can call directly from your build scripts or application code.
  icon: i-lucide-code
  ---
  ::
::

## Documentation

::UPageGrid
  ::UPageCard
  ---
  title: Getting Started
  description: Install Shield Base, run the wizard, and produce your first databases.
  icon: i-lucide-rocket
  to: /docs/shield-base/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: CLI Reference
  description: Every flag, subcommand, and example for the shield-base command.
  icon: i-lucide-terminal
  to: /docs/shield-base/cli
  ---
  ::

  ::UPageCard
  ---
  title: Data Sources
  description: Every built-in data source, what it produces, and links to the upstream providers.
  icon: i-lucide-database
  to: /docs/shield-base/data-sources
  ---
  ::

  ::UPageCard
  ---
  title: Programmatic Usage
  description: Use Shield Base as a library in your own scripts and build pipelines.
  icon: i-lucide-code
  to: /docs/shield-base/usage
  ---
  ::

  ::UPageCard
  ---
  title: Custom Data Sources
  description: Compile your own JSON data into MMDB or LMDB databases with full type generation.
  icon: i-lucide-plus-circle
  to: /docs/shield-base/custom-data-sources
  ---
  ::

  ::UPageCard
  ---
  title: API Reference
  description: Complete reference for all exported functions and the LMDB reader utilities.
  icon: i-lucide-book-open
  to: /docs/shield-base/api
  ---
  ::

  ::UPageCard
  ---
  title: TypeScript Types
  description: All exported type definitions and how to generate types from any JSON data.
  icon: i-lucide-braces
  to: /docs/shield-base/types
  class: col-span-full
  ---
  ::
::