---
title: Getting Started
description: How to install and configure the Bot Detector module in your Nuxt project.
icon: i-lucide-rocket
---

The `@riavzon/botdetector` module is built primarily for robust, standalone Node.js environments (like Express workflows), but it integrates seamlessly into a Nuxt 3 application using Nitro server middleware and proxy routes.

## Prerequisites

Before installing the module, ensure your environment meets the following baseline requirements:

1. **Linux OS:** The engine specifically relies on functionalities optimized for Linux file systems and network operations (like reverse DNS lookups).
2. **Persistent Storage:** A SQLite database file or a running MySQL instance is required to track visitor scores and apply progressive penalties.
3. **GeoIP Databases:** You must download the **MaxMind GeoLite2 databases** (`GeoLite2-ASN.mmdb`, `GeoLite2-City.mmdb`, `GeoLite2-Country.mmdb`) to enable the geolocation heuristics phase.

## Installation

Install the detection engine using your preferred package manager:

::code-group

```bash [pnpm]
pnpm add @riavzon/botdetector
```

```bash [yarn]
yarn add @riavzon/botdetector
```

```bash [npm]
npm install @riavzon/botdetector
```

```bash [bun]
bun add @riavzon/botdetector
```
::

## Initial Configuration

Once installed, the module requires a boot sequence to establish its in-memory caches and prepare the SQLite/MySQL tables.

In a Nuxt 3 environment, the easiest way to achieve this is via a Nitro plugin.

### 1. Nitro Initialization Plugin

Create a new file at `server/plugins/bot-detector.ts`. This script will fire once when the Nitro server boots up.

```typescript [server/plugins/bot-detector.ts]
import { initBotDetector } from '@riavzon/botdetector'
import { resolve } from 'node:path'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    // Determine the absolute path to your downloaded MaxMind databases
    const geoDataPath = resolve(process.cwd(), './server/geoData');

    // Initialize the engine. The settings object overrides the internal defaults.
    await initBotDetector({
      banScore: 30, // Score threshold that triggers a ban
      storage: {
        type: 'sqlite',
        sqlite: {
          dbName: resolve(process.cwd(), './server/database/bots.sqlite')
        }
      },
      // You must provide the path to your GeoIP databases
      // If omitted, Geo-Checks will silently fail and return 0 penalties.
      geoDataDir: geoDataPath
    });

    console.log('✅ Bot Detector Engine Online');
  } catch (error) {
    console.error('❌ Failed to initialize Bot Detector:', error);
  }
})
```

::callout{icon="i-lucide-folder-tree" color="primary"}
Ensure that the `geoDataDir` points to a folder containing the three required `.mmdb` files.
::

### 2. Updating Known Bot IPs

The engine relies on an internal JSON list to exempt "Good Bots" (like Googlebot) from being scored. You can manually update this list to ensure it has the latest IP ranges from major search engines by running the provided package script:

```bash
npm run updatebotips --prefix node_modules/@riavzon/botdetector
```

*Tip: Consider adding this as a `postinstall` script in your main `package.json` to keep definitions fresh.*

## Next Steps

Now that the engine is installed and initialized, you can proceed to intercept and score incoming requests.

::UPageCard
---
title: Usage Guide
description: Learn how to mount the Bot Detector middleware to your API routes or Nuxt server middleware.
to: /docs/bot-detection/usage
icon: i-lucide-book-open
---
::
