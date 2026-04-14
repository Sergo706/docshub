---
title: Auth H3 Client
description: H3 middleware and utilities for integrating gateways with the IAM service.
icon: i-lucide-key-round
---

# Auth H3 Client

The `auth-h3client` package provides the essential middleware, controllers, and utility functions needed to integrate front-end gateways (like Nuxt 3 applications) with the centralized IAM (`@riavzon/jwtauth`) service.

It is designed to cleanly bridge the gap between user-facing edge environments powered by `unjs/h3` and the core Express-based authentication backend.

## Key Features

- **Drop-in Route Handlers:** Pre-configured composables (`useAuthRoutes`, `magicLinksRouter`, `useOAuthRoutes`) automatically register complex login, MFA, password reset, and PKCE-enabled OAuth flows onto any H3 router.
- **Edge Security Middleware:**
  - CSRF cookie issuance (Signed `__Host-` / `__Secure-` cookies) and strict verification.
  - Request body size limiting to prevent payload exhaustion (`limitBytes`).
  - Deep visitor fingerprint validation tying sessions to specific client contexts.
  - Automatic injection of Bot Detector metrics before proxying to the auth backend.
- **Server-to-Server Connectivity:** Safely bridges requests to the upstream IAM service, configured via strict types (`zod`). It supports advanced security features like mutual TLS (mTLS) and custom HMAC request sealing.
- **Caching & Performance:** Built-in `unstorage` integration (Memory, Redis, Cloudflare KV) for caching successful verifications and minimizing redundant network calls to the upstream auth provider.
- **Nuxt 3 Native:** Includes a dedicated Nuxt module (`auth-h3client/module`) for zero-config auto-imports and setup directly in your `nuxt.config.ts`.

## Configuration & Usage

The client is highly versatile, supporting both legacy and bleeding-edge edge runtimes:
- **H3 v1** support for stable branch gateways (`auth-h3client/v1`).
- **H3 v2** support adapting to the latest `defineEventHandler` structures (`auth-h3client/v2`).
- Specialized **Client Composables** (`auth-h3client/client`) providing isomorphic functionality for Vue/Nuxt environments relying on `ofetch`.

### Typical Nuxt Integration

Using the provided Nuxt integration simplifies the setup process:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['auth-h3client/module'],
  authClient: {
    // Config injected directly into the H3 instance
    server: {
      auth_location: {
        serverOrDNS: process.env.AUTH_API_HOST ?? '127.0.0.1',
        port: Number(process.env.AUTH_API_PORT ?? 10000),
      },
      cryptoCookiesSecret: process.env.COOKIE_SECRET!
    },
    // Automatic OAuth definitions
    OAuthProviders: [
      {
        kind: 'oidc',
        name: 'google',
        issuer: 'https://accounts.google.com',
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        supportPKCE: true
      }
    ]
  }
})
```
