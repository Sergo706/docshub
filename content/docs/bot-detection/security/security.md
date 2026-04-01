---
title: Security & Penalties
description: Understand the scoring system, rate limiting mechanisms, and penalty allocations.
icon: i-lucide-lock
---

The `@riavzon/botdetector` engine does not operate on a simple binary "allow or block" logic. Instead, it utilizes a sophisticated cumulative scoring system derived from multi-phase heuristic checks.

## The Cumulative Scoring System

Every incoming request begins with a `Score: 0`. As the request progresses through the detection pipeline, "checks" (like User-Agent validation, Geolocation sanity, or Header consistency) append penalties to the total score.

If a request's total score breaches the `banScore` threshold (default `100`), the engine immediately terminates the request and bans the client IP.

### Built-in Checkers

The pipeline uses several modular checkers, categorized by resource intensity:

::UPageCard
---
title: Phase 1 (Low Resource)
---
These checks hit locally cached data or evaluate memory-cheap string anomalies.
- `badUaChecker`: Analyzes the `User-Agent` string for headless signatures.
- `ipValidation`: Ensures IPv4/IPv6 integrity.
- `headersAndUACalc`: Validates required HTTP headers against the parsed UA device profile.
- `acceptLangMap` & `timezoneMap`: Ensures the requested locale strings and timezones match the IP's actual Geo-Coordinates.
::

::UPageCard
---
title: Phase 2 (High Resource)
---
These checks are only triggered if the request is not explicitly exempted (like known Good Bots) or previously cached.
- `goodBots`: Executes secure Reverse-DNS and Forward-DNS lookups.
- `rateTracker`: Reads and writes to the memory cache to identify unnatural request bursts per Canary Cookie.
- `proxyISPAndCookieCalc`: Highlights known Data Centers, Proxies, or missing Canary footprints.
::

## The Canary Cookie Fingerprint

To distinguish between ephemeral bots using rotating proxies and actual human users, the Engine injects a unique, cryptographic "Canary Cookie" onto the client's device upon their first visit.

When subsequent requests arrive:
1. The engine checks if the Canary Cookie matches the cached cryptographic signature.
2. The `rateTracker` uses the unique cookie to map behavior and request velocity, penalizing users exceeding the `checkEvery` rate (default 1000ms).

::callout{icon="i-lucide-alert-circle" color="warning"}
Bots that drop or rotate cookies on every request will constantly hit the `Canary Missing` penalty, quickly escalating their score toward the ban threshold.
::

## Customizing Penalties

You can globally adjust how heavily specific behaviors are penalized.

If you run a globally accessible API, you might lower the penalties for proxy detection. If you run a heavily regional app, you might raise the penalties for localized Geo-Anomalies.

```typescript [nitro.config.ts]
import { botDetectorSettings, settings } from '@riavzon/botdetector'

botDetectorSettings({
  banScore: 80, // Lower the threshold to ban slightly faster
  penalties: {
    ...settings.penalties,
    // Increase the penalty if an IP is detected as a known VPN or Data Center
    proxyDetected: 50,
    // Add a massive penalty for explicitly banned country origins
    bannedCountries: 200,
    behaviorTooFast: {
       ...settings.penalties.behaviorTooFast,
       // How many points to append if they exceed the rate limit
       penalty: 15
    }
  }
});
```

## Persistent Bans

When a user breaches the `banScore`, the engine invokes the `banIP` routine. This routine performs a destructive update to the configured persistent storage (SQLite or MySQL).

Once banned, the detection pipeline terminates the connection immediately via the middleware before the routing layer is even touched, drastically reducing CPU usage during volume-based scraper attacks.
