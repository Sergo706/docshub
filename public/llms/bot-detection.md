---
title: Bot Detection
description: Advanced behavioral analysis and fingerprinting to stop malicious traffic.
icon: i-lucide-cpu
---

# Bot Detection System

The Bot Detector Service (`@riavzon/botdetector`) is a sophisticated, multi-layered middleware architecture designed to distinguish legitimate human users and verified crawler bots from malicious automated scripts.

Optimized explicitly for Linux environments, it functions as a highly performant gatekeeper, filtering traffic well before it can burden resource-intensive application components or hit database layers.

## The Detection Pipeline

The system processes incoming requests through a distinct, tiered pipeline. This allows it to fail bad traffic immediately using low-resource checks, and only spend costly operations (like network lookups) on ambiguous requests.

### Phase 1: "Cheap" Checks (In-Memory & Regex)
These checks occur instantaneously on every request, requiring no external network calls:
- **User-Agent Fingerprinting:** Rapidly matches incoming UAs against extensive signature lists (`badUaChecker`) of known malicious tools, vulnerability scanners, and headless browsers.
- **IP Validation & Whitelisting:** Drops malformed requests and validates IPs against known Good Bot ranges loaded from in-memory JSON databases (Googlebot, Bingbot).
- **Header Structure Verification:** Analyzes the coherence of standard browser headers (`Accept`, `Host`) via the `headersAndUACalc` engine to weed out poorly written scrapers.
- **Timezone/Locale Mapping:** Confirms the client-reported timezone and `Accept-Language` headers fundamentally align (`acceptLangMap.ts`).

### Phase 2: "Heavy" Checks (Network/Disk Intensive)
Invoked dynamically based on Phase 1 ambiguity:
- **Reverse DNS Verification:** Cryptographically validates claimed Good Bots by reversing their IP against known provider domain suffixes (`suffix.json`).
- **MaxMind Geolocation (`GeoLite2`):** Actively queries local MMDB files for ASN, City, and Country data. This enables immediate dropping of traffic from highly-restricted jurisdictions or datacenters traditionally hosting proxies/VPNs.
- **Behavioral Rate Tracking:** Monitors request frequency and path traversal patterns per unique visitor.

## Fingerprinting & Canary Cookies

The bedrock of the detection engine is its fingerprinting system.

The service assigns a cryptographic "canary cookie" to incoming visitors via the core `canaryCookieChecker` Express middleware. This cookie binds the user's IP, reported hardware capabilities (derived via UA parsing), and session state. If this cookie is fundamentally manipulated, dropped, or stolen across IPs, the heavy checks engine triggers automatically.

## Penalty Scoring Model

Rather than binary blocks that often cause false positives for edge-case legitimate users, `@riavzon/botdetector` uses a **Cumulative Penalty Scoring** mechanism:

1. Every failed micro-check (e.g., mismatched timezone, suspicious datacenter ASN, slightly aggressive burst rate) adds 'penalty points' to the visitor's runtime profile.
2. The score is tracked persistently via SQLite or MySQL (`updateVisitorScore`).
3. Once the accumulated score exceeds a configurable `banScore` (e.g., `35`), the system enacts a punitive response.
4. Penalties range from temporary tarpits to permanent IP/User-Agent bans across the ecosystem.

*Note: Verified Good Bots (Google, Bing) explicitly bypass this scoring mechanism to ensure uninterrupted SEO indexing.*

## Links

- Repository: https://github.com/Sergo706/botDetector
- Package: https://www.npmjs.com/package/@riavzon/bot-detector
- Full Docs Users: https://docs.riavzon.com/docs/bot-detection
- Full Docs LLMS: https://docs.riavzon.com/llms-full.txt
- mmdbctl: https://github.com/ipinfo/mmdbctl
