---
title: Standalone API
description: Complete reference for standalone utilities exposed by the detector.
icon: i-lucide-code
---

The `@riavzon/botdetector` module not only provides middleware but also exports its internal, highly-optimized utility functions.

You can use these standalone API exports individually in your custom Nitro routes without triggering the full detection pipeline.

## Parsing & Analysis

### `parseUA`

The `parseUA(userAgentString)` function parses a raw HTTP `User-Agent` string into a structured object, determining the browser, engine, operating system, and device type.

```typescript [usage.ts]
import { parseUA } from '@riavzon/botdetector'

export default defineEventHandler((event) => {
  const userAgent = getHeader(event, 'user-agent') || '';
  const parsed = parseUA(userAgent);

  if (parsed.device.type === 'mobile') {
    return { view: 'mobileLayout' };
  }
})
```

The returned object follows the `ParsedUAResult` TypeScript definition.

### `getGeoData`

The `getGeoData(ipAddress)` function executes a blazing-fast local lookup against the provided MaxMind GeoLite2 databases to extract geolocation and ASN information.

```typescript [usage.ts]
import { getGeoData } from '@riavzon/botdetector'

export default defineEventHandler((event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1';
  const geoInfo = getGeoData(ip);

  // geoInfo will be null if the GeoLite2 databases are missing or the IP is unresolvable.
  if (geoInfo && geoInfo.country_code === 'US') {
     console.log('Request from the United States');
  }
})
```

## Penalties & Management

### `banIp`

The `banIp(ip, reason)` utility manually forces an immediate ban on a specific IP address by updating the persistent storage.

```typescript [usage.ts]
import { banIp } from '@riavzon/botdetector'

export default defineEventHandler((event) => {
  const ip = '192.168.1.50';

  // Implements the action taken when a manual ban is required.
  // Updates the SQLite/MySQL store and triggers Telegram logging if configured.
  await banIp(ip, 'Manual intervention from Admin panel');
})
```

### `updateIsBot`

The `updateIsBot(ip, status)` utility flags an IP as a known bot (or removes the flag) within the database schemas without necessarily applying a full connection ban.

### `updateBannedIP`

Similar to `banIp`, the `updateBannedIP(ip, status, reasonCode)` function updates the ban status for a specific visitor, but gives you granular control over the `BanReasonCode` schema field.

## Setup & Warm-up

### `initBotDetector`

The `initBotDetector(options)` function establishes database connections, wires up the `lru-cache` mechanisms, and verifies the existence of your GeoData directories. This must be called during your server's startup phase.

### `warmUp`

The `warmUp()` function explicitly pre-loads the `User-Agent` pattern matching lists and initializes lightweight schema caches before the first user request hits the server. This prevents cold-start latency spikes.

## TypeScript Interfaces

The module exports critical TypeScript interfaces for type-safe integration:

- `BotDetectorConfig` - The primary settings configuration object.
- `GeoResponse` - The structured object returned by `getGeoData`.
- `ParsedUAResult` - The structured object returned by `parseUA`.
- `BannedInfo`, `BanReasonCode`, `BannedReason` - Core types for understanding penalty statuses.
