---
title: Bot Detection Overview
description: Learn about the internal heuristic bot detection engine.
---

# Bot Detection Engine

The **Bot Detection Engine** is a specialized module designed to heuristically analyze incoming requests and challenge suspicious traffic before it hits the application layers.

::badge
Production Ready
::

## How it works

When a request arrives, the engine passes it through several layers of analysis:

1. **IP Reputation Check:** Queries internal known-bad lists.
2. **User-Agent Analysis:** Parses the `User-Agent` header for headless browser signatures.
3. **Behavioral Heuristics:** Rates limits and concurrent connection throttling via Redis.

If a request scores above the threat threshold, an interstitial challenge (like Cloudflare Turnstile or a custom CAPTCHA) is rendered.

```sequence
Client -> Edge: Standard Request
Edge -> BotDetector: Evaluate Score
BotDetector --> Edge: Block | Allow | Challenge
Edge -> Client: HTTP 200 / Interstitial 403
```

## Setup

Getting started with the bot detection module in a Nuxt application requires adding proxy routes in your `nitro.config.ts`.

> [!WARNING]
> Ensure your Redis instance is running and reachable by Nitro, otherwise rate-limiting fallback strategies will drastically slow down requests.

```typescript [nitro.config.ts]
export default defineNitroConfig({
  routeRules: {
    '/api/**': {
      cache: { maxAge: 60 },
      // Custom bot protection middleware
      botProtection: true
    }
  }
})
```
