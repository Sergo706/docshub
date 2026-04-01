---
title: Usage Guide
description: Deep dive into the Bot Detector middleware and runtime configuration.
icon: i-lucide-book-open
---

The `@riavzon/botdetector` engine operates primarily as an Express-compatible connect middleware. In a Nuxt 3 application, this means you will interact with the engine via an **Event Handler** (often in `/server/middleware/` or `/server/api/`).

## The Detection Pipeline

The core detection logic is triggered within the `detectBots` middleware. This middleware automatically sets and checks a "Canary Cookie", parses the client's IP, User-Agent, and geolocation, and orchestrates the detection pipeline.

### Mounting the Middleware

To protect specific routes (for example, authentication endpoints or data mutations), wrap the target handler with the `detectBots` middleware.

```typescript [server/api/protected.post.ts]
import { detectBots } from '@riavzon/botdetector'

// The detectBots function returns an Express middleware signature: (req, res, next) => void
// Nuxt's fromNodeMiddleware converts this into an H3 EventHandler
const botProtection = fromNodeMiddleware(detectBots);

export default defineEventHandler(async (event) => {
  // 1. Run the Bot Detector pipeline first
  await botProtection(event);
  
  // 2. If the request was bad, the middleware automatically rejects it the connection.
  // Otherwise, execution continues here.
  const body = await readBody(event);
  
  return { 
    ok: true, 
    message: 'Request passed advanced bot heuristics.',
    data: body
  };
})
```

::callout{icon="i-lucide-alert-triangle" color="warning"}
The `detectBots` middleware relies heavily on reading cookies. Ensure `cookie-parser` or Nuxt's native cookie handling is enabled before the middleware runs.
::

## Runtime Configuration

While you can pass initial defaults to `initBotDetector` (as shown in the [Getting Started](/docs/bot-detection/getting-started) guide), you can also dynamically adjust settings based on the environment or specific route requirements.

### Overriding Settings

The detector exports a master `botDetectorSettings` object that handles deep merging of your custom configuration with the internal defaults.

```typescript [server/middleware/01.configure.ts]
import { botDetectorSettings } from '@riavzon/botdetector'

export default defineEventHandler((event) => {
  // Example: Increase the ban threshold for a specific marketing route
  if (event.path.startsWith('/api/marketing')) {
    botDetectorSettings({
      banScore: 45, 
      checks: {
        // Disable reverse DNS lookups on fast routes to save latency
        enableDnsChecks: false 
      }
    });
  }
})
```

::callout{icon="i-lucide-info" color="primary"}
When overriding nested objects like `checks` or `penalties`, the `botDetectorSettings` function automatically spreads the existing default values so you don't accidentally disable unmentioned checks.
::

## Dynamic Banning

The engine allows you to dynamically extend the list of banned countries at runtime without restarting the server.

```typescript
import { addBannedCountries } from '@riavzon/botdetector'

// Ban traffic originating from Ukraine
addBannedCountries('ua'); 

// Ban traffic originating from Iran and North Korea
addBannedCountries(['ir', 'kp']); 
```

These codes must be lowercase, ISO 3166-1 alpha-2 country codes. If a request originates from an IP matching a banned country, the `geoLocationCalc` checker applies a massive penalty (by default, 100 points), immediately crossing the `banScore` threshold.

## Next Steps

Review the [Standalone API](/docs/bot-detection/api) for documentation on raw utility exports like `parseUA` and `getGeoData` that can be used independently of the middleware pipeline.
