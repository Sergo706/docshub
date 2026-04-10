---
title: Role-Based Access Control
description: How roles flow from database to JWT to request context, and how to build route guards, role-checking middleware, and per-resource authorization using the IAM service as a library.
icon: i-lucide-shield-check
---

Role-based access control (RBAC) in the IAM service is built on top of the JWT access token. Roles are embedded at signing time, cached alongside the token, verified for integrity on every use, and exposed on `req.user.roles` after `protectRoute` runs. This guide covers how to attach roles to tokens, how integrity enforcement works, and how to build route guards and custom authorization logic.

---

## How roles work

When the IAM service generates an access token, it embeds the user's roles as a `roles` claim in the JWT payload. Simultaneously, the same roles are recorded in the in-memory token cache entry. On every subsequent `verifyAccessToken` call, `compareRoles` confirms that the roles in the JWT payload exactly match the roles stored in the cache. Any mismatch causes verification to fail, preventing a client from tampering with role claims in the token string.

After `protectRoute` runs successfully, `req.user.roles` holds the verified role array for the current request. Route handlers and custom middleware read roles exclusively from this field.

```
generateAccessToken({ role: ['editor'] })
       │
       ├── JWT payload: { roles: ['editor'], sub: '42', ... }
       └── Cache entry: { roles: ['editor'], valid: true, ... }

verifyAccessToken(token)
       │
       ├── Cache lookup → roles: ['editor']
       ├── JWT decode   → roles: ['editor']
       └── compareRoles(['editor'], ['editor']) → { valid: true }

protectRoute
       └── req.user.roles = ['editor']
```

---

## Attaching roles to tokens

The built-in login, signup, and OAuth controllers issue tokens without roles by default. You have three options for attaching roles.

### Static payload via configuration

Add a `payload` object under `jwt.access_tokens` in the configuration. Every token issued by the service merges this object into the payload at signing time. Use this for roles that apply to every user uniformly.

```json [config.json]
{
  "jwt": {
    "jwt_secret_key": "your-secret",
    "access_tokens": {
      "expiresIn": "15m",
      "payload": {
        "roles": ["user"]
      }
    }
  }
}
```

::warning
The `payload` field adds the same roles to every token. It is not suitable for per-user roles. Use it only for a universal default role that every authenticated user should have.
::

### Custom login controller

Build a login handler that queries the user's roles from your database and passes them to `generateAccessToken`. This is the standard approach for per-user RBAC.

```ts [server/routes/login.ts]
import {
  generateAccessToken,
  generateRefreshToken,
  validateZodSchema,
  makeSanitizedZodString,
  verifyPassword,
  hashPassword,
  makeCookie,
  getLogger,
} from '@riavzon/auth'
import { getPool, getConfiguration } from '@riavzon/auth'
import { z } from 'zod'
import crypto from 'node:crypto'

const loginSchema = z.object({
  email: makeSanitizedZodString({ min: 5, max: 80 }),
  password: makeSanitizedZodString({ min: 12, max: 64 }),
})

router.post('/login', async (req, res) => {
  const log = getLogger().child({ route: '/login' })
  const result = await validateZodSchema(loginSchema, req.body, req, log)

  if ('valid' in result && !result.valid) {
    return res.status(result.errors === 'XSS attempt' ? 403 : 400).json({ error: result.errors })
  }
  if (!result.success) {
    return res.status(422).json(result.error.format())
  }

  const { email, password } = result.data
  const pool = getPool()
  const config = getConfiguration()

  // Fetch user and their roles from the database
  const [rows] = await pool.execute(
    `SELECT u.id, u.visitor_id, u.password_hash,
            GROUP_CONCAT(r.name ORDER BY r.name) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = ? AND u.active_user = 1
     GROUP BY u.id
     LIMIT 1`,
    [email]
  )

  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await verifyPassword(user.password_hash, password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const roles: string[] = user.roles ? user.roles.split(',') : []

  const refreshToken = await generateRefreshToken(config.jwt.refresh_tokens.refresh_ttl, user.id)
  const accessToken = generateAccessToken({
    id: user.id,
    visitor_id: user.visitor_id,
    jti: crypto.randomUUID(),
    role: roles,
  })

  makeCookie(res, 'session', refreshToken.raw, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    domain: config.jwt.refresh_tokens.domain,
    path: '/',
    expires: refreshToken.expiresAt,
  })

  res.status(200).json({ accessToken })
})
```

### Issuing tokens in custom flows

When issuing tokens outside of the standard login flow (for example, after completing a custom MFA verification or promoting a user to a new role), call `generateAccessToken` directly with the role array.

```ts
import { generateAccessToken } from '@riavzon/auth'
import crypto from 'node:crypto'

const accessToken = generateAccessToken({
  id: user.id,
  visitor_id: user.visitor_id,
  jti: crypto.randomUUID(),
  role: ['admin', 'editor'],
})
```

::tip
Always fetch roles from the database at the moment of token issuance, not from the previous token's payload. A user's roles may have changed since their last login.
::

---

## Role integrity enforcement

`compareRoles` runs inside `verifyAccessToken` on every token verification. It compares the roles in the JWT payload against the roles recorded in the token cache entry when the token was generated.

The comparison is an exact set check: both arrays must contain the same strings with no extras and no omissions. Duplicates before and after normalization cause a `MalformedPayload` failure. A discrepancy between the JWT payload and the cache causes an `InvalidRoles` failure, which rejects the token entirely.

This design means a client cannot elevate privileges by modifying the JWT payload. Even if the signature is somehow forged, the cache entry remains authoritative. The only way to legitimately hold a role in a request is to have received a token that was signed with that role at issuance.

`compareRoles` is also exported for use in custom authorization logic that compares two known role arrays.

```ts
import { compareRoles, getLogger } from '@riavzon/auth'

const log = getLogger()

const result = compareRoles(['admin'], req.user.roles, log)

if (!result.valid) {
  // result.errorType is 'MalformedPayload' or 'InvalidRoles'
  res.status(403).json({ error: 'Insufficient permissions' })
  return
}
```

::note
`compareRoles` checks for exact set equality. If you need to check whether a user has at least one required role from a set of alternatives, use `req.user.roles.includes()` or build a custom guard as shown in the next section.
::

---

## Building role guards

### Single-role requirement

The simplest guard checks that `req.user.roles` includes a specific role. Mount it after `protectRoute`.

```ts [server/middleware/requireRole.ts]
import type { Request, Response, NextFunction } from 'express'

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles

    if (!Array.isArray(roles) || !roles.includes(role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
```

```ts [server/routes/admin.ts]
import {
  requireAccessToken,
  requireRefreshToken,
  getFingerPrint,
  protectRoute,
} from '@riavzon/auth'
import { requireRole } from '../middleware/requireRole'

router.get(
  '/admin/dashboard',
  requireAccessToken,
  requireRefreshToken,
  getFingerPrint,
  protectRoute,
  requireRole('admin'),
  async (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard' })
  }
)
```

### Any-of-roles requirement

Allow access when the user holds at least one role from a set.

```ts [server/middleware/requireAnyRole.ts]
import type { Request, Response, NextFunction } from 'express'

export function requireAnyRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles

    if (!Array.isArray(roles) || !allowedRoles.some(r => roles.includes(r))) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
```

```ts
router.post(
  '/posts',
  requireAccessToken,
  requireRefreshToken,
  getFingerPrint,
  protectRoute,
  requireAnyRole('editor', 'admin'),
  createPostHandler
)
```

### All-roles requirement

Require the user to hold every role in a set simultaneously.

```ts [server/middleware/requireAllRoles.ts]
import type { Request, Response, NextFunction } from 'express'

export function requireAllRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.user?.roles

    if (!Array.isArray(roles) || !requiredRoles.every(r => roles.includes(r))) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
```

---

## Per-resource authorization

For resources that are owned by specific users, combine role checks with ownership checks inside the handler. Do not rely on roles alone when a resource belongs to a single user.

```ts [server/routes/posts.ts]
router.put(
  '/posts/:id',
  requireAccessToken,
  requireRefreshToken,
  getFingerPrint,
  protectRoute,
  async (req, res) => {
    const { userId, roles } = req.user!
    const pool = getPool()

    const [rows] = await pool.execute(
      'SELECT author_id FROM posts WHERE id = ? LIMIT 1',
      [req.params.id]
    )

    const post = rows[0]
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const isOwner = post.author_id === Number(userId)
    const isAdmin = Array.isArray(roles) && roles.includes('admin')

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Proceed with the update
  }
)
```

---

## Roles in the BFF pattern

When using the [BFF pattern](/docs/iam/essentials/bff), the IAM service returns the user's roles on every `GET /secret/data` response.

```json
{
  "authorized": true,
  "userId": 42,
  "roles": ["admin", "editor"],
  "ipAddress": "...",
  "date": "..."
}
```

The BFF proxy reads this response and decides whether to allow the original browser request to proceed. Role enforcement lives entirely on the server side. The browser never sees or stores the role list directly.

A typical BFF proxy handler:

```ts [server/api/admin/dashboard.get.ts]
// Example using H3 or Nitro syntax
export default defineEventHandler(async (event) => {
  const iamResponse = await $fetch('https://iam.internal/secret/data', {
    headers: { Authorization: `Bearer ${accessToken}` },
    headers: { Cookie: `session=${session}; canary_id=${canaryId}` },
  })

  if (!iamResponse.authorized) {
    throw createError({ statusCode: 401 })
  }

  if (!iamResponse.roles?.includes('admin')) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  // Proceed with the protected resource
})
```

::tip
[auth-h3client](/docs/auth-h3client) handles the BFF call and session forwarding automatically. It exposes the `roles` array from the IAM response to your route handlers without requiring manual fetch calls.
::

---

## Token rotation and role updates

When a user's roles change in the database, existing access tokens continue to carry the old roles until they expire. The cache entry matches the JWT payload, so verification passes, but the roles reflect what was true at issuance.

To force an immediate role update, revoke the user's current access token:

```ts
import { tokenCache } from '@riavzon/auth'

// Remove the token from the cache — the next request will require re-authentication
tokenCache().delete(rawAccessToken)
```

If the user's refresh token is still valid, `POST /auth/user/refresh-session` issues a new access token. At that point, your rotation controller should fetch fresh roles from the database and pass them to `generateAccessToken`.

For a full re-login (roles change requiring immediate effect across all sessions), revoke all of the user's refresh tokens:

```ts
import { revokeRefreshToken } from '@riavzon/auth'

// Revoke each active session — user must log in again to receive updated roles
for (const token of userTokens) {
  await revokeRefreshToken(token)
}
```

---

## Summary

| Concept | Where it happens |
|---|---|
| Role assignment | `generateAccessToken({ role: [...] })` at login or token issuance |
| Role storage | JWT payload claim `roles` and in-memory token cache entry |
| Role integrity | `compareRoles` inside `verifyAccessToken`, called automatically by `protectRoute` |
| Role access | `req.user.roles` after `protectRoute` completes |
| Route guard | Custom middleware reading `req.user.roles` after `protectRoute` |
| BFF roles | `roles` field in the `GET /secret/data` JSON response |
| Role revocation | Delete the cache entry via `tokenCache().delete(rawToken)` |
