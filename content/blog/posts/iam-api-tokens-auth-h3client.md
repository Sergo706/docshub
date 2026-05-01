---
title: "IAM API Tokens with Auth H3 Client: Secure M2M Access in Nuxt and Nitro"
description: "A detailed guide to the IAM API token subsystem, from verification and management to protecting custom APIs with Auth H3 Client."
tags:
  - Security
  - API Tokens
  - Nuxt
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"
author: "Sergio"
authorImg: "https://github.com/Sergo706.png"
authorGithub: "https://github.com/Sergo706"
authorGithubUserName: "Sergo706"
featured: false
date: 2026-05-01T10:00:00.000Z
readingTime: "14 min read"
---

Machine-to-machine authentication looks simple until you need to answer real
questions. How do you scope access, revoke a leaked key, rotate credentials,
keep raw secrets out of the database, and still give users a clean dashboard
for managing their integrations?

The IAM service solves that problem with a dedicated API token subsystem.
Public verification and authenticated management are two distinct surfaces with
different security requirements. The database never stores a raw secret. Only
the SHA-256 digest of each key is persisted. Privilege labels and optional IP restrictions
live at the row level, and the full model maps cleanly into Auth H3 Client for
Nuxt, Nitro, and plain H3 applications.

::important
This article assumes you already have a running IAM service and a Nuxt or Nitro
app configured with `@riavzon/auth-h3client`. If your app exposes
machine-to-machine routes protected with `defineAuthenticatePublicApi`, do not
place those routes behind the bundled Nuxt auth middleware. That middleware is
for browser session flows, while API-key routes need a path bypass.
::

---

## What the subsystem exposes

The API token subsystem has two distinct surfaces. Public verification is the
machine-to-machine entry point. Management routes are session-authenticated
browser flows for creating, listing, rotating, revoking, and updating tokens.

| Surface | Method | Route | Purpose |
|---|---|---|---|
| Public verification | `GET` | `/api/public/verify` | Verify a raw API token from `X-API-KEY` |
| Token creation | `POST` | `/api/manage/new-token` | Create a new API token |
| Token inventory | `GET` | `/api/manage/list-metadata` | List the current user's valid tokens |
| Revocation | `POST` | `/api/manage/revoke` | Invalidate a token |
| Metadata | `POST` | `/api/manage/metadata` | Return details for one token |
| Rotation | `POST` | `/api/manage/rotate` | Replace a token with a fresh raw key |
| IP updates | `POST` | `/api/manage/ip-restriction-update` | Change the stored IP allowlist |
| Privilege updates | `POST` | `/api/manage/privilege-update` | Change the stored privilege label |

Every token is scoped with one privilege label: `custom`, `demo`,
`restricted`, `protected`, or `full`. The verification route checks the exact
label you request, not a hierarchy. If your route requires `demo`, the token
must carry `demo`.

The five levels have no built-in ordering. `demo` does not imply access to
`restricted` routes, and `restricted` does not include `protected`. Each token
carries exactly one label and that label is matched literally. `custom` is a
catch-all for use cases that do not map to the four named levels. You decide
what `custom` means in your own application.

---

## How a token is shaped and stored

The raw token format is simple on the surface. Each key is created as
`prefix_random_checksum`, where the checksum is the first eight hexadecimal
characters of a SHA-256 digest of the random portion.

```text [API token format]
rpt_d2f460c847aca70d00766922991aa073210fc107de5b251669f9b94ffa9d30e7122549a9b2d94be78a0b801629036a5f0aea8d82a12cd565044c39aa6608a36a_af609e80
```

That checksum lets the IAM service reject malformed keys quickly before doing a
database lookup. The raw key is only returned once, at creation or rotation
time. After that, the database stores only the SHA-256 digest in the
`api_tokens.api_token` column.

The subsystem also creates a separate `public_identifier`. This value is not a
credential. It exists so management actions can target the correct row without
relying on the raw token after it has been issued. In the direct IAM API, most
management actions require `tokenId`, `publicIdentifier`, and `name` together.
Auth H3 Client deliberately hides `publicIdentifier` from browser code and
resolves it on the server.

The stored row carries operational metadata too. The IAM service records the
token owner, privilege label, creation time, expiration time, last-use time,
usage count, validity flag, and optional IP restriction list. That gives you a
real credential inventory rather than an opaque secret store.

---

## How verification works

The public verification route is `GET /api/public/verify`. It reads the raw
token from the `X-API-KEY` header, reads the required privilege from the query
string, and validates the request IP so IP-restricted tokens can be enforced.

Internally, verification follows a strict sequence. The IAM service validates
the checksum, hashes the raw key, looks up the hashed row where `valid = 1`,
checks the exact `privilege_type`, applies expiration rules, enforces any
stored IP restrictions, and updates `usage_count` and `last_used` for
successful requests.

Failed verification attempts are throttled aggressively. Any request with a
missing key, a malformed privilege value, an unresolvable IP address, or an
invalid token feeds directly into the IAM verification limiters. The limiter
counts against the caller's IP, so repeated failures eventually trigger a
permanent ban at the gateway level. Successful requests can also be
rate-limited if you enable consumption limiting on the IAM side.

Call the route directly like this:

```bash [Terminal]
curl \
  -H "X-API-KEY: rpt_d2f460c847aca70d00766922991aa073210fc107de5b251669f9b94ffa9d30e7122549a9b2d94be78a0b801629036a5f0aea8d82a12cd565044c39aa6608a36a_af609e80" \
  "http://localhost:10000/api/public/verify?privilege=demo"
```

On success, the IAM service returns a compact metadata object. This is the same
shape Auth H3 Client later exposes on `event.context.apiVerification`.

```json [Verification response]
{
  "ok": true,
  "date": "2026-05-01T10:00:00.000Z",
  "data": {
    "name": "report-worker",
    "tokenId": 12,
    "userId": 42,
    "createdAt": "2026-05-01T09:00:00.000Z",
    "expiresAt": "2026-06-01T09:00:00.000Z",
    "lastUsed": "2026-05-01T10:00:00.000Z",
    "usageCount": 8,
    "providedPrivilege": "demo"
  }
}
```

---

## How management works

Management routes are intentionally more demanding than public verification.
They sit behind `requireAccessToken`, `requireRefreshToken`, fingerprint
collection, active MFA checks, JWT protection, and for `POST` routes a JSON
content-type check plus a 1 KB body limit.

That split is the right model for a real product. Verification is for services
calling your APIs. Management is for logged-in users who are creating and
changing credentials inside a dashboard.

Here is the direct IAM management map:

| Action | Method | Input | Result |
|---|---|---|---|
| `new-token` | `POST` | `name`, `prefix`, `expires?`, `ipv4?`, `privilege` | New raw token and public identifier |
| `list-metadata` | `GET` | None | All valid tokens for the authenticated user |
| `revoke` | `POST` | `tokenId`, `publicIdentifier`, `name` | Invalidates the token |
| `metadata` | `POST` | `tokenId`, `publicIdentifier`, `name` | Returns one token plus total counts |
| `rotate` | `POST` | `tokenId`, `publicIdentifier`, `name` | Returns a replacement raw token |
| `ip-restriction-update` | `POST` | `tokenId`, `publicIdentifier`, `name`, `ipv4?` | Replaces the stored IP allowlist |
| `privilege-update` | `POST` | `tokenId`, `publicIdentifier`, `name`, `newPrivilege` | Replaces the stored privilege label |

Rotation deserves special attention. The IAM service revokes the current token
and creates a fresh raw token in one management flow. That means the caller can
roll credentials forward without deleting the integration entirely. Creation and
rotation are the only two moments when the raw secret leaves the server.

::note
The direct IAM create route returns both `rawApiKey` and `rawPublicId`. Auth H3
Client strips `rawPublicId` before exposing the creation result to your Nuxt
handler. That keeps management identity in the server layer instead of the
browser.
::

---

## Why Auth H3 Client fits this subsystem well

Auth H3 Client does more than proxy requests. It gives the IAM token model the
right shape for H3 and Nuxt applications. Public machine-to-machine routes use
`defineAuthenticatePublicApi`. Authenticated dashboard routes use
`defineApiManagementHandler`. Token inventory reads can use
`getApiListsController`.

That split matters because the browser and service callers have different
security needs. Browser management routes need session auth, CSRF protection,
and token identity mapping. Machine-to-machine verification needs a single
`X-API-KEY` header and a clean path to the IAM verification endpoint.

The wrappers also hide low-level IAM details from your application code. Your
Nuxt route only deals with `tokenId` for existing-token actions, while the
server wrapper resolves `publicIdentifier` and `name` through IAM
`/api/manage/list-metadata` before making the final management request.

---

## Integrating with the Nuxt module

If your application only uses browser auth flows, the Nuxt module can run with
`enableMiddleware: true` and register the built-in middleware for every
request. Mixed apps need a different setup. If you protect custom APIs with
`defineAuthenticatePublicApi`, disable the bundled middleware and add your own
path-aware middleware so browser auth routes still get bot detection and CSRF,
while machine-to-machine routes bypass that chain.

Start by registering the module and disabling the bundled middleware.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['auth-h3client/module'],
  authH3Client: {
    enableMiddleware: false,
    authStatusUrl: '/api/auth/users/authStatus'
  }
})
```

The module still gives you server auto-imports and client composables in this
mode. It does not auto-register the bundled middleware, but it still registers
the auth status route and, when configured, the optional API token list route.

Configure the gateway in a Nitro plugin:

```ts [server/plugins/auth.ts]
import { defineNitroPlugin } from 'nitropack/runtime'
import { useStorage } from 'nitropack/runtime/storage'
import { configDefaults } from 'auth-h3client/server/templates'
import { defineAuthConfiguration } from 'auth-h3client/v1'

export default defineNitroPlugin((nitroApp) => {
  defineAuthConfiguration(nitroApp, {
    ...configDefaults,
    onSuccessRedirect: '/dashboard',
    enableFireWallBans: false,
    uStorage: {
      storage: useStorage('cache'),
      cacheOptions: {
        successTtl: 60 * 60 * 24 * 30,
        rateLimitTtl: 10
      }
    }
  })
})
```

Next, register a browser middleware that mirrors the packaged middleware but
skips your machine-to-machine prefix.

```ts [server/middleware/auth-browser.ts]
import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  isMethod,
  sendNoContent,
} from 'auth-h3client/v1'
import {
  botDetectorMiddleware,
  generateCsrfCookie,
  isIPValid,
} from 'auth-h3client/v1'

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)

  if (
    isMethod(event, 'HEAD') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/_mdc') ||
    pathname.startsWith('/_nuxt') ||
    pathname.startsWith('/api/public/')
  ) {
    if (isMethod(event, 'HEAD') || pathname === '/api/health') {
      sendNoContent(event)
    }

    return
  }

  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor === '127.0.0.1' || forwardedFor === '::1') {
    return
  }

  isIPValid(event)
  await botDetectorMiddleware(event)
  generateCsrfCookie(event)
})
```

::tip
If your app does not expose machine-to-machine API-key routes, keep
`enableMiddleware: true` and optionally use `registerApiRoute` on the module.
That is the simplest browser-only setup.
::

---

## Protecting a custom API with `X-API-KEY`

Once the gateway is configured, protecting a custom API route is small and
predictable. `defineAuthenticatePublicApi` reads the incoming `X-API-KEY`,
calls IAM `/api/public/verify?privilege=...`, and places the verification
result on `event.context.apiVerification` before your handler runs.

Here is a custom reports endpoint that grants access to tokens with the exact
`demo` privilege label:

```ts [server/api/public/reports.get.ts]
import { defineAuthenticatePublicApi } from 'auth-h3client/v1'

export default defineAuthenticatePublicApi(async (event) => {
  const token = event.context.apiVerification

  return {
    ok: true,
    consumer: token.name,
    tokenId: token.tokenId,
    userId: token.userId,
    privilege: token.providedPrivilege,
    report: {
      generatedAt: new Date().toISOString(),
      items: ['orders', 'revenue', 'retention']
    }
  }
}, 'demo')
```

Call the route from another service like this:

```bash [Terminal]
curl \
  -H "X-API-KEY: rpt_d2f460c847aca70d00766922991aa073210fc107de5b251669f9b94ffa9d30e7122549a9b2d94be78a0b801629036a5f0aea8d82a12cd565044c39aa6608a36a_af609e80" \
  "http://localhost:3000/api/public/reports"
```

This pattern is the cleanest way to grant access to a custom API. Your Nuxt
server owns the route contract and decides what the response shape looks like.
The IAM service owns credential validity. It checks the privilege label,
enforces IP restrictions, updates the usage record, and applies abuse controls
before your handler is ever reached.

---

## Let logged-in users create and rotate tokens

The other half of the story is dashboard management. That is where
`defineApiManagementHandler` fits. The wrapper enforces session authentication
and CSRF verification before it processes any action. It requires a `POST`
method and applies a 2 KB JSON body limit. Token identity resolution happens
on the server, so the browser only needs to submit a `tokenId` for any
existing-token action.

Create one route file and branch on `event.context.params.action`:

```ts [server/api/auth/api-tokens/[action].post.ts]
import { defineApiManagementHandler } from 'auth-h3client/v1'

export default defineApiManagementHandler(async (event) => {
  const action = event.context.params?.action

  if (action === 'new-token') {
    return { ok: true, data: event.context.newApiToken }
  }

  if (action === 'metadata') {
    return { ok: true, data: event.context.extensiveMetadata }
  }

  if (action === 'rotate') {
    return { ok: true, data: event.context.rotate }
  }

  if (action === 'revoke') {
    return { ok: true, data: event.context.revoke }
  }

  return {
    ok: true,
    data: event.context.ipRestrictionUpdate ?? event.context.privilegeUpdate
  }
}, 'demo', 'protected')
```

In this example, newly created tokens are always issued with the `demo`
privilege. The optional third argument allows `privilege-update` to move a
token to `protected`. If you omit that third argument, the wrapper rejects the
privilege update action.

From the browser, call that route with `executeRequest`. The helper injects the
CSRF header on the client and forwards cookies correctly during SSR.

```ts [app/composables/useApiTokens.ts]
import { executeRequest } from 'auth-h3client/client'

export async function createDemoToken() {
  return await executeRequest<{
    rawApiKey?: string
    expiresAt?: string | null
  }>('/api/auth/api-tokens/new-token', 'POST', {
    name: 'report-worker',
    prefix: 'rpt',
    expires: 1000 * 60 * 60 * 24 * 30,
    ipv4: ['203.0.113.10']
  })
}

export async function rotateToken(tokenId: number) {
  return await executeRequest<{
    msg: string
    newRawToken?: string
    newExpiry?: string | null
  }>('/api/auth/api-tokens/rotate', 'POST', {
    tokenId
  })
}
```

Notice what the browser does not send for rotate. It only sends `tokenId`. The
wrapper fetches the authenticated token inventory, resolves the matching
`publicIdentifier` and `name`, and only then calls the IAM management endpoint.
That is one of the main reasons to use Auth H3 Client instead of calling the
IAM management API directly from the browser.

The wrapper also gives you typed action results on the event context:

| Action | Event context field |
|---|---|
| `new-token` | `event.context.newApiToken` |
| `metadata` | `event.context.extensiveMetadata` |
| `rotate` | `event.context.rotate` |
| `revoke` | `event.context.revoke` |
| `ip-restriction-update` | `event.context.ipRestrictionUpdate` |
| `privilege-update` | `event.context.privilegeUpdate` |

---

## A complete flow for granting access to a custom API

With the pieces above, the end-to-end flow is straightforward. A logged-in user
creates a token from your dashboard. Your app stores only the raw token shown
once to the user. The external service then calls your Nuxt route with
`X-API-KEY`, and the gateway verifies it against the IAM service before your
handler runs.

`getApiListsController` gives the browser a clean inventory view for active
tokens. It proxies to IAM `/api/manage/list-metadata` and strips
`public_identifier` before the response reaches the browser. That means the
frontend can render names, creation dates, expiry times, usage counts, and IP
restrictions without learning the internal management identifier.

This split gives you three strong properties at the same time. The custom API
stays simple. The IAM service remains the only place that decides whether a key
is valid. The browser never needs to hold server-side token identity data for
management actions.

---

## Summary

Each
key is validated by checksum before a database lookup happens. The database
holds only hashed values and never the raw secret. Privilege matching is exact,
and IP restrictions are enforced at the verification layer before your handler
sees the request. Every successful call updates the token's usage record, giving
you a real credential inventory rather than an opaque secret store. Rotation and
revocation are first-class operations built into the same management surface
that creates tokens.

Auth H3 Client is the layer that makes that subsystem practical in Nuxt and
Nitro. Machine-to-machine verification gets a dedicated wrapper that calls IAM
and places results on the event context. Browser management routes get a
separate wrapper that handles session auth and CSRF checks, then resolves token
identity on the server so the browser never holds internal IAM references. The
inventory controller strips `public_identifier` from list responses so the
frontend can render names, dates, expiry times, and usage counts without
learning the server-side management identifier.

If you are building a mixed app with both browser auth and API-key protected
custom APIs, the right pattern is clear. Keep browser middleware on browser
routes. Bypass that middleware for `defineAuthenticatePublicApi` routes. Let
the IAM service own credential validity and token lifecycle decisions.

::read-more{to="/docs/iam/essentials/api"}
::

::read-more{to="/docs/auth-h3client/getting-started/nuxt"}
::

::read-more{to="/docs/auth-h3client/api/middleware"}
::