---
title: Bot Detection Overview
description: A high-performance heuristic bot detection engine for Node.js backend environments.
icon: i-lucide-shield-half
---

The **Bot Detector** module (`@riavzon/botdetector`) is a sophisticated system designed to identify and classify incoming web requests as originating from humans or automated bots. It employs a multi-layered approach, seamlessly integrating a pipeline of "cheap" (low-resource) and "heavy" (resource-intensive) checks.

By utilizing in-memory caching mechanisms and a cumulative scoring system, the engine detects, analyzes, and mitigates malicious activity before it reaches your core application logic.

::callout{icon="i-lucide-server" color="info"}
This service is specifically developed and highly optimized for deployment on **Linux server** environments, leveraging native network operations for DNS lookups and IP management.
::

## Core Architecture

The detection engine processes incoming requests through a distinct, multi-phase pipeline to ensure optimal performance without compromising accuracy.

::UPageGrid
  ::UPageCard
  ---
  title: Phase 1 (Cheap Checks)
  description: Initial screening using lightweight data like User-Agent strings, IP format validation, basic header analysis, and known good-bot IPs.
  icon: i-lucide-zap
  ---
  ::

  ::UPageCard
  ---
  title: Phase 2 (Heavy Checks)
  description: Intensive checks like reverse DNS lookups, geolocation anomalies, behavioral rate limits, and proxy/ISP detection.
  icon: i-lucide-cpu
  ---
  ::
::

## Key Features

- **Cumulative Scoring Algorithm**: Assigns penalty points based on failed checks. Requests that exceed the configured `banScore` threshold are automatically flagged and penalized.
- **Good Bot Exemptions**: Uniquely identifies legitimate crawlers (Googlebot, Bingbot, etc.) using a combination of JSON-based IP range matching and secure reverse DNS lookups.
- **Ultra-Fast Caching**: Heavily optimizes throughput by caching results for DNS lookups, known bot IPs, rate-limiting counters, and canary cookie validation via `lru-cache`.
- **Canary Fingerprinting**: Out-of-the-box integration of a canary cookie system for deterministic client tracking and foundational device fingerprinting.

## Module Structure

The documentation is organized into four main sections to help you integrate and fully understand the engine.

::UPageGrid
  ::UPageCard
  ---
  title: Getting Started
  description: How to get started quickly, including prerequisites, environment setup, and deployment considerations.
  icon: i-lucide-rocket
  to: /docs/bot-detection/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: Usage
  description: Comprehensive usage guides demonstrating how to mount middleware and customize runtime configurations.
  icon: i-lucide-book-open
  to: /docs/bot-detection/usage
  ---
  ::

  ::UPageCard
  ---
  title: Standalone API
  description: Detailed reference for the standalone utility functions and directories available within the module.
  icon: i-lucide-code
  to: /docs/bot-detection/api
  ---
  ::

  ::UPageCard
  ---
  title: Security
  description: Deep dive into security considerations, the scoring system, penalty mechanisms, and rate limits.
  icon: i-lucide-lock
  to: /docs/bot-detection/security
  ---
  ::
::
