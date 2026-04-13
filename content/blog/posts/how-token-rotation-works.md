---
title: "How Token Rotation Works: Access Tokens, Refresh Tokens, and the Deduplication Problem"
description: "A deep dive into the dual-token lifecycle, why short-lived access tokens paired with hashed refresh tokens are safer than sessions, and how concurrent rotation requests are coalesced."
navigation: false
tags:
    - Tokens
    - Security
image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80"
author: "Sergio"
authorImg: "https://github.com/Sergo706.png"
authorGithub: "https://github.com/Sergo706"
authorGithubUserName: "Sergo706"
featured: false
date: 2026-04-13T10:00:00.000Z
readingTime: "10 min read"
---

Most authentication systems issue a single credential — a session ID, a JWT, a cookie — and use it until it expires or the user logs out. The problem with that model is straightforward: if an attacker obtains that credential, they have as long as it lives to use it. The longer it lives, the bigger the exposure window.

Riavzon solves this with a dual-token architecture. Access tokens are short-lived and verified cryptographically. Refresh tokens are long-lived but stored as hashes in a database, consumed atomically, and wrapped in a reuse detection system that revokes every session the moment replay is detected. This post explains every layer of that architecture: why it is designed this way, how each piece works, and what happens when two requests from the same user arrive at the same time.

---

## The Two-Token Model

Every authenticated user in the system holds two credentials at once.

The **access token** is a signed JWT. It lives in a `__Secure-a` cookie on the browser. Its lifetime is short — typically 15 minutes — and it is verified on every request without touching the database. The IAM service uses an LRU cache to hold every valid token, so verification is a cache lookup plus a cryptographic check, not a database query. When the token expires, the cache entry is evicted and the next verification call fails immediately.

The **refresh token** is a 64-byte cryptographically random string, hex encoded. The browser holds the raw token in an `httpOnly` cookie named `session`. The server never stores the raw token. Instead, it hashes it with SHA-256 and stores the hash in a MySQL `refresh_tokens` table. The raw token leaves the server exactly once, when it is issued, and the server never sees it again in plaintext.

```json
{
  "visitor": "vis_abc123",
  "roles": ["user"],
  "sub": "42",
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1710000000,
  "exp": 1710000900
}
```

That is a typical access token payload. The `jti` is a UUID generated fresh on every issuance. It is also the key by which the token lives in the LRU cache. Deleting the cache entry for a `jti` revokes that token immediately, without a database write, without waiting for expiry.

The canary cookie — `canary_id` — ties the session to a specific device fingerprint. It is issued by the Bot Detector middleware and is required alongside both tokens for any sensitive operation. It is neither a credential nor an authentication factor on its own, but it binds the token family to the visitor context that created it, and any mismatch triggers anomaly detection.

---

## Why Short-Lived Access Tokens

The conventional objection to short-lived tokens is the extra network round trips. If the token expires every 15 minutes, the user's browser needs to refresh it every 15 minutes. That cost is real, but the security benefit justifies it.

An access token that lives for 15 minutes and is stolen gives an attacker a 15-minute window. An access token that lives for 24 hours gives an attacker 24 hours. In practice, the difference between these windows matters enormously when you consider how often stolen credentials go undetected. The 15-minute window usually closes before the attacker can do meaningful damage. The 24-hour window rarely does.

More importantly, the LRU cache is the real enforcement boundary. An access token is not just valid because it carries the right signature. It is valid because it exists in the cache. This means revocation is instant and free. Deleting the cache entry with the token's `jti` terminates that token immediately, regardless of how long it has until expiry. Sessions can be force-terminated without a database write, without blocking, and without any propagation delay.

```ts
import { tokenCache } from '@riavzon/auth'

const cache = tokenCache()
cache.delete(rawToken) // This token is now invalid. No database write needed.
```

The two-gate verification model — cache check first, cryptographic check second — also means the cryptographic work only happens when the cache says the token could be valid. Revoked tokens fail at the first gate, before any cryptographic computation runs.

---

## Why Hashed Refresh Tokens in the Database

Long-lived tokens stored in plaintext are a liability. If the database is compromised, every session is compromised. Hashing the token before storing it breaks that link. An attacker with a dump of the `refresh_tokens` table gets SHA-256 hashes — not the raw tokens they need to authenticate.

The storage schema for a refresh token row looks like this:

| Column | Value |
|---|---|
| `token` | `sha256(rawToken)` — never the raw value |
| `valid` | `1` when active, `0` when revoked |
| `usage_count` | `0` when fresh, `1` after first consumption |
| `session_started_at` | Timestamp from the original login, carried across all rotations |
| `expiresAt` | Computed from `refresh_ttl` at insert time |

The `usage_count` column is the core of the reuse detection system. It starts at zero. The moment the token is consumed — used to issue a new token pair — the database atomically sets it to `1`. Any second attempt to consume a token with `usage_count > 0` is treated as a replay attack, and all sessions for that user are immediately revoked.

The `session_started_at` column persists the original login timestamp across every rotation. No matter how many times the token is rotated, the session chain traces back to the original authentication event. This is how `MAX_SESSION_LIFE` works: the system knows when the session began and can enforce an absolute ceiling on how long any session can live, regardless of how often it is refreshed.

---

## The Rotation Lifecycle

Rotation is the process that converts old credentials into new ones. It is the most security-sensitive operation in the system, and it runs in a strict sequence.

When the access token is about to expire, Auth H3 Client calls `POST /auth/user/refresh-session` on the IAM service with the `session` and `canary_id` cookies. The IAM rotation controller runs this sequence:

::steps

### Rate limiting

Three layered rate limiters run first: an IP limiter, a token-hash limiter, and a composite `ip_tokenhash` limiter. Each uses consecutive caches that escalate block duration on repeated violations. Brute force attempts are stopped before anything else runs.

### Anomaly detection

`strangeThings()` runs nine sequential checks against the session. It verifies the `canary_id` binding, checks IP range consistency against historical records, compares the `User-Agent` fingerprint, validates that the session has not exceeded `maxAllowedSessionsPerUser`, and checks that the token has not already been consumed (`usage_count > 0`). The first check that fails short-circuits the rest. If anomalies are recoverable, the service sends an MFA email and returns `202`. If they are not recoverable, the token is revoked and the service returns `401`.

### Atomic consumption

`consumeAndVerifyRefreshToken` runs a single atomic `UPDATE` inside a transaction. It increments `usage_count` by one, but only if the row exists, is `valid = 1`, has `usage_count = 0`, and has not expired. All four conditions must pass in the same transaction. If even one fails, no rows are affected.

If no rows are affected, the function investigates: the token might not exist, it might have been revoked, or it might have `usage_count > 0` from a previous consumption. That last case is a reuse detection trigger — all sessions for the user are revoked immediately.

### Session lifetime check

If the token consumed successfully but `session_started_at` is older than `MAX_SESSION_LIFE`, the controller revokes the token and returns `401 Session is expired`. The session chain has lived as long as policy allows.

### New credential issuance

The old token is set to `valid = 0`. A new 64-byte random refresh token is generated, hashed, and inserted with `valid = 1`, `usage_count = 0`, and the same `session_started_at` from the consumed token. A new access token is signed with a fresh `jti` and cached. Both are sent to the browser.

::

The success response carries the new access token in the body. The new refresh token arrives in the `Set-Cookie` header. The browser replaces its cookies transparently.

```json
{
  "message": "Refresh & access tokens rotated",
  "accessToken": "<signed jwt>",
  "accessIat": "1710000000000"
}
```

---

## The Deduplication Problem

Single-page applications create a problem that most token rotation systems ignore: concurrent requests.

Consider a user whose access token has just expired. Their browser has three in-flight requests — a profile fetch, a feed load, and a notification count. All three arrive at the server at the same moment. All three see an expired access token. All three decide to rotate.

Without deduplication, all three would call `POST /auth/user/refresh-session` simultaneously. The first call consumes the refresh token (sets `usage_count = 1`). The second call tries to consume the same token and finds `usage_count > 0`. The reuse detection system interprets this as a replay attack and revokes all sessions. The user is logged out, and they did nothing wrong.

This is not a theoretical edge case. It happens on any page with multiple parallel API calls, and it happens reliably whenever token expiry falls at a high-traffic moment.

Auth H3 Client solves this with `lockAsyncAction`, a keyed async mutex. When `ensureValidCredentials` needs to rotate, it acquires a lock keyed on the refresh token value — the `session` cookie — before making any call to the IAM service. A second request for the same session finds the lock held, waits for the first call to complete, and reuses its result.

```ts
// Inside ensureValidCredentials — simplified view
const result = await lockAsyncAction(refreshToken, async () => {
  // Only one call per session cookie value runs at a time.
  // All others wait here and get the same result.
  return await callIAMRotation(sessionCookie, canaryCookie)
})
```

The lock is keyed on the refresh token value itself, not on a user ID or session ID. This matters because a user might have multiple active sessions across devices. Each session has its own refresh token, so each gets its own independent lock. Concurrent rotation on one device does not block rotation on another.

The result is cached briefly after the lock releases. Requests that arrive after the first call completes but before the lock is fully released still get the cached result without making another call. This covers the common case where a burst of requests resolves in quick succession rather than simultaneously.

---

## Reuse Detection in Depth

The reuse detection system operates on a core assumption: a refresh token should only ever be consumed once. Any second consumption means either the token was stolen and replayed, or something in the rotation flow went wrong. Either way, the safest response is to terminate all sessions for that user immediately.

**Scenario 1: An attacker steals a valid, unconsumed refresh token.**

To use the stolen token, the attacker must also replicate the user's `canary_id` cookie and pass the fingerprint checks in `strangeThings`. If the fingerprint does not match, the anomaly engine sends an MFA challenge to the real user's email before any rotation happens. The attacker cannot proceed without access to the user's email.

If the attacker somehow passes the fingerprint checks and consumes the token, `usage_count` becomes `1`. The next time the legitimate user's browser tries to rotate — which happens automatically as the access token approaches expiry — `consumeAndVerifyRefreshToken` finds `usage_count > 0`. All sessions are revoked. Both the attacker and the legitimate user are forced to re-authenticate. The attacker cannot complete MFA without the user's email.

**Scenario 2: An attacker steals a token that has already been rotated.**

The stolen token has `usage_count = 1`. The attacker attempts to consume it. `consumeAndVerifyRefreshToken` detects `usage_count > 0` immediately, revokes all sessions for the user, and returns `valid: false`. The attacker's attempt terminates the legitimate user's current session, but the attacker gains nothing — they still cannot authenticate.

In both scenarios, the worst outcome for the legitimate user is being forced to log in again and prove their identity through MFA. The attacker is locked out at every step.

---

## Two Lifetime Controls

Refresh tokens have two independent lifetime mechanisms, and understanding the difference between them matters.

**Token TTL (`refresh_ttl`)** controls how long a single refresh token row stays valid in the database. When a token expires, verification sets `valid = 0` and clears `last_mfa_at` for the user. Clearing `last_mfa_at` resets the `byPassAnomaliesFor` cooldown — the next session anomaly (if one occurs) will not be bypassed, though a clean login from the same device still passes without MFA.

**Session lifetime (`MAX_SESSION_LIFE`)** controls how long the entire session chain can survive. Every time a token is rotated, the new token inherits the same `session_started_at` timestamp from the consumed token. That timestamp is the anchor. When `Date.now() - session_started_at` exceeds `MAX_SESSION_LIFE`, the rotation controller refuses to issue new credentials, even if the token itself has not expired yet.

The practical configuration is to set `refresh_ttl` to something like 3 days and `MAX_SESSION_LIFE` to 30 days. Individual tokens force periodic rotation and limit the exposure window of any single credential. The session ceiling prevents sessions from living indefinitely through continuous renewal.

```
refresh_ttl:      3 days    — Each token lives this long
MAX_SESSION_LIFE: 30 days   — The session chain lives this long
```

A "remember me" flow with a 3-day token TTL still expires the session completely after 30 days. The user must log in again, not just refresh.

---

## How Auth H3 Client Drives This

Auth H3 Client, the gateway layer for Nuxt and Nitro applications, handles the entire rotation lifecycle transparently. Your application code never calls the rotation endpoint directly. Instead, every protected route wraps its handler in `defineAuthenticatedEventHandler`, which calls `ensureValidCredentials` before your code runs.

`ensureValidCredentials` decides whether to rotate based on the metadata it receives from the IAM `/secret/accesstoken/metadata` endpoint. The decision logic covers every case:

| Metadata result | Action |
|---|---|
| No access token present | Rotate immediately |
| `shouldRotate: true` (within 25% of TTL) | Rotate proactively |
| `authorized: false` | Rotate |
| Server error or no response | Rotate |
| `mfa: true` (IAM returned 202) | Return 202, do not rotate |
| Valid and within threshold | Set token on context, continue |

The metadata response is cached in a `MiniCache` instance keyed by the access token value. The cache TTL is `msUntilExp - refreshThreshold - 5 seconds`, so the cache expires just before the token would trigger a rotation check anyway. Requests within that window read the cached metadata without a network call.

```ts
export default defineAuthenticatedEventHandler(async (event) => {
  // By the time this line runs:
  // - The access token has been verified or rotated
  // - New cookies have been applied to the response if rotation happened
  // - Concurrent requests from the same session were deduplicated
  // - event.context.authorizedData contains the verified session data
  const { userId, roles } = event.context.authorizedData
  return { userId }
})
```

The deduplication lock, the metadata cache, and the rotation decision all happen before the first line of your handler. From your handler's perspective, the session is always valid when it arrives.

---

## Summary

The dual-token architecture exists because no single credential can satisfy both the performance requirement (fast verification, no database query on every request) and the security requirement (cheap revocation, short exposure windows).

Access tokens satisfy the performance requirement. They are verified in memory with a cache lookup and a signature check. Revoking one is a cache delete. The database is never involved.

Refresh tokens satisfy the security requirement. They are stored as hashes, consumed atomically, and protected by a reuse detection system that terminates all sessions at the first sign of replay. Their long TTL makes them practical for real users while `MAX_SESSION_LIFE` ensures sessions cannot live indefinitely.

The deduplication layer sits between the two, preventing the concurrent-rotation problem that makes dual-token systems brittle in practice.

::read-more{to="/docs/iam/essentials/tokens"}
Read the full token reference for the IAM service
::

::read-more{to="/docs/auth-h3client/essentials/session"}
Read how Auth H3 Client manages session state and drives token rotation
::
