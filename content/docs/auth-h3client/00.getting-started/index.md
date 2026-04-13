---
title: Getting Started
description: Prerequisites, installation, Nuxt module setup, plugin configuration, and first-run verification for the Auth H3 Client.
icon: i-lucide-rocket
---

`@riavzon/auth-h3client` connects your Nuxt or Nitro application to a running [IAM service](/docs/iam). The module registers server middleware, auto-imports server utilities and client composables, and wires up the authentication routes in a single Nitro plugin call.

## Requirements

- Node.js 22 or later
- Nuxt 3 and later or a Nitro/H3 application
- A running [IAM service](/docs/iam/getting-started) reachable from your server

## Installation

::code-group

```bash [pnpm]
pnpm add auth-h3client
```

```bash [yarn]
yarn add auth-h3client
```

```bash [npm]
npm install auth-h3client
```

```bash [bun]
bun add auth-h3client
```

::

---

## Nuxt module setup

If you are using Nuxt, use the dedicated module. It handles all configuration, middleware, and auto-imports for you.

Register the module in `nuxt.config.ts`. This enables the auto-import of all server utilities and client composables, and optionally registers the global security middleware.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['auth-h3client/module'],
  authH3Client: {
    enableMiddleware: true,
    authStatusUrl: '/auth/users/authStatus'
  }
})
```
Read the [Nuxt Module Documentation](/docs/auth-h3client/getting-started/nuxt) for full configuration and usage.


## H3 v1 H3 v2

This module supports both H3 v1 and H3 v2. Choose the matching entry point for your H3 version:

- H3 v1 (default): import from auth-h3client or auth-h3client/v1. supported version: `h3@^1.15.4`.
- H3 v2: import from auth-h3client/v2. supported version: `h3@^2.0.0-beta.4`.


### Register the routes
::code-group

```ts [H3v1] 
import { createApp, createRouter } from "h3";
import { configuration, httpLogger, useAuthRoutes, useOAuthRoutes, magicLinksRouter, bounceRouter } from 'auth-h3client';

configuration(config);

const app = createApp();
httpLogger()(app);
app.use(isIPValid);
app.use(botDetectorMiddleware);
app.use(generateCsrfCookie);

const router = createRouter();
useAuthRoutes(router);
useOAuthRoutes(router);
bounceRouter(router);
magicLinksRouter(router, 'api');
router.get('/auth/users/authStatus', getAuthStatusHandler)
app.use(router);

// Your handlers
```

```ts [H3v2] 
import { H3 } from 'h3'
import {
  configuration,
  httpLogger,
  isIPValid,
  botDetectorMiddleware,
  generateCsrfCookie,
  useAuthRoutes,
  magicLinksRouter,
  useOAuthRoutes,
  getAuthStatusHandler
} from 'auth-h3client/v2';

configuration(config);

const app = new H3()
// v2 logger is a plugin: register directly
app.register(httpLogger())
app.use(isIPValid);
app.use(botDetectorMiddleware);
app.use(generateCsrfCookie);

useAuthRoutes(app);
useOAuthRoutes(app);
bounceRouter(app);
magicLinksRouter(app, 'api');
app.get('/auth/users/authStatus', getAuthStatusHandler)
// Your handlers
```
::

## Nitro
Make a Nitro plugin: 

```ts [server/plugins/initAuth.ts]
import { defineNitroPlugin } from "nitro";
import { configuration, httpLogger, useAuthRoutes, useOAuthRoutes, magicLinksRouter, bounceRouter } from 'auth-h3client';
import { configDefaults } from 'auth-h3client/server/templates'

export default defineNitroPlugin((nitro) => {
configuration({
  ...configDefaults,
    uStorage: {
      storage: useStorage('cache'),
      cacheOptions: {
          successTtl: 60 * 60 * 24 * 30, 
          rateLimitTtl: 10    
      }
    }
  });

httpLogger()(nitro.h3App);
nitro.h3App.use(isIPValid)
nitro.h3App.use(botDetectorMiddleware)
nitro.h3App.use(generateCsrfCookie)

useAuthRoutes(nitro.router);
useOAuthRoutes(nitro.router);
bounceRouter(nitro.router);
magicLinksRouter(nitro.router, 'api');
})
```
::warning
When using a newer version of nitro, use the same setup above, and check if that version uses the v2 version of h3, if so, import directly from `auth-h3client/v2`
::

Read the [H3 and Nitro Setup](/docs/auth-h3client/guides/h3-nitro) guide to learn more.

## Configuring the Module

Before using any exported handlers you must call the `configuration` function exactly once at boot:

```ts [config.ts]
import { configuration } from 'auth-h3client';
import { createStorage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';

const storage = createStorage({ driver: memoryDriver() });

configuration({
  server: {
    auth_location: {
      serverOrDNS: process.env.AUTH_API_HOST ?? '127.0.0.1',
      port: Number(process.env.AUTH_API_PORT ?? 10000),
    },
    hmac: {
      enableHmac: true,
      clientId: process.env.AUTH_CLIENT_ID!,
      sharedSecret: process.env.AUTH_SHARED_SECRET!,
    },
    ssl: {
      enableSSL: false,
    },
    cryptoCookiesSecret: process.env.COOKIE_SECRET!,
  },
  uStorage: {
    storage: storage,
    cacheOptions: {
      successTtl: 60 * 60 * 24 * 30,
      rateLimitTtl: 10
    }
  },
  onSuccessRedirect: 'https://app.example.com/dashboard',
  OAuthProviders: [
    {
      kind: 'oidc',
      name: 'google',
      issuer: 'https://accounts.google.com',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      defaultScopes: ['openid', 'email', 'profile'],
      redirectUri: 'https://app.example.com/oauth/callback/google',
      supportPKCE: true,
      redirectUrlOnSuccess: 'https://app.example.com/dashboard',
      redirectUrlOnError: 'https://app.example.com/login',
    },
  ],
  telegram: { enableTelegramLogger: false },
  logLevel: 'info',
});

```
## Verify the setup

Start your development server and make a request to the auth status endpoint. With no active session the response should be:

```bash [Terminal]
curl http://localhost:3000/auth/users/authStatus
```

```json
{
  "authorized": false
}
```

A `__Host-csrf` cookie should also be present on the response. If the IAM service is unreachable, the auth status handler returns `{ "authorized": false }` rather than erroring, so check the server logs if you expect a different result.
