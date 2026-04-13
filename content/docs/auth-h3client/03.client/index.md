---
title: Client-side
description: Browser-side Vue composables and fetch utilities shipped from the auth-h3client/client entry point for reading session state, handling magic links, making authenticated requests, and reading the CSRF cookie.
icon: i-lucide-monitor
---

The `auth-h3client/client` entry point ships a small surface of browser-side Vue composables and fetch utilities. They are the counterpart to the gateway's server-side primitives: the server resolves the session, rotates tokens, and issues cookies, while the client-side exports read that state, build authenticated requests, and handle magic link query parameters in Vue pages and components.

Everything in this section runs in the browser (or inside a Vue SSR context). The functions depend on `nuxt/app` for SSR helpers like `useState`, `useRequestHeaders`, `useRequestEvent`, and `useFetch`, so they work in any Nuxt application. When using the Nuxt module, all of them are auto-imported in Vue components and pages without an explicit import statement.

---

## Import paths

```ts
import { useAuthData, useMagicLink, executeRequest, getCsrfToken } from 'auth-h3client/client'
```

The `auth-h3client/client` entry point is separate from `auth-h3client/v1` and `auth-h3client/v2`. Server-side code (routes, middleware, handler wrappers) imports from the v1 or v2 entries, while browser-side code imports from `auth-h3client/client`. The two surfaces never leak into each other: the client entry point contains no Node-only modules, and the server entries contain no Vue composables.

---

## What each function does

::UPageGrid
  ::UPageCard
  ---
  title: useAuthData
  description: Reads the current session state during SSR, hydrates it on the client without a second request, and surfaces MFA challenges.
  icon: i-lucide-user-check
  to: /docs/auth-h3client/client/use-auth-data
  ---
  ::

  ::UPageCard
  ---
  title: useMagicLink
  description: Reads magic link query parameters from the current route, validates them with the gateway, and routes to the correct verification endpoint.
  icon: i-lucide-link
  to: /docs/auth-h3client/client/use-magic-link
  ---
  ::

  ::UPageCard
  ---
  title: executeRequest
  description: Universal fetch wrapper that auto-injects the CSRF header on the client, proxies headers on the server, and forwards Set-Cookie headers for transparent token rotation.
  icon: i-lucide-send
  to: /docs/auth-h3client/client/execute-request
  ---
  ::

  ::UPageCard
  ---
  title: getCsrfToken
  description: Reads the __Host-csrf cookie in the browser and returns the raw token segment for use in manual fetch calls.
  icon: i-lucide-shield-x
  to: /docs/auth-h3client/client/get-csrf-token
  ---
  ::
::

---

## How the client-side fits the overall flow

The server resolves the session on every request and sets cookies for the access token, refresh token, CSRF token, and visitor fingerprint. The browser never sees raw tokens: it sees HttpOnly cookies it cannot read and a single non-HttpOnly `__Host-csrf` cookie that contains the double-submit CSRF token. Client-side code then follows this pattern:

1. `useAuthData` calls the auth status route during SSR and stores the response in a singleton so that every page reads the same reactive state. On the client, the composable reuses the SSR payload instead of issuing a second network request. See [Session Management](/docs/auth-h3client/essentials/session) for the server side of this flow.
2. `executeRequest` wraps `$fetch` for authenticated requests. On the client it reads the CSRF token from the `__Host-csrf` cookie and injects it as the `X-CSRF-Token` header. On the server it forwards incoming request headers (cookies included) and captures any `Set-Cookie` from the response to forward to the browser, which is how token rotation surfaces during SSR.
3. `useMagicLink` handles email verification landing pages. It reads `token`, `random`, `reason`, and `visitor` from the URL, picks the matching server endpoint by `reason` (case-insensitive), and calls `executeRequest` behind the scenes. See [Client-Side MFA](/docs/auth-h3client/mfa/client-side) for the full bounce-route integration.
4. `getCsrfToken` is a low-level escape hatch for custom fetch calls that cannot use `executeRequest`.

---

## Using it outside Nuxt

The client entry point imports from `nuxt/app`, so it requires a Nuxt runtime to resolve those symbols. For a plain Vue application served behind an H3 or Nitro gateway, read the CSRF cookie with `getCsrfToken` and use your own fetch wrapper with the `X-CSRF-Token` header. See [CSRF Protection](/docs/auth-h3client/essentials/csrf) for the exact header contract and the double-submit pattern.