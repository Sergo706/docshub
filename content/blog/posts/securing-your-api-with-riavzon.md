---
title: "Securing Your API Endpoints with Riavzon IAM"
description: "A deep dive into configuring identity management, token rotation, and rate limiting to protect your backend services from unauthorized access."
tags:
  - Security
  - iam
  - api
image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
author: "Sergio"
authorImg: "https://github.com/Sergo706.png"
authorGithub: "https://github.com/Sergo706"
authorGithubUserName: "Sergo706"
featured: true
date: 2026-03-04
readingTime: "8 min read"
icon: "i-lucide-shield-check"
---

Modern APIs face a growing number of threats—from credential stuffing to token theft. In this article, we walk through securing your endpoints using the Riavzon IAM module.

## Why API Security Matters

Every exposed endpoint is a potential attack vector. Without proper authentication and authorization, your services are vulnerable to:

- **Brute-force attacks** on login endpoints
- **Token replay attacks** using stolen JWTs
- **Privilege escalation** through misconfigured permissions

::callout{icon="i-lucide-alert-triangle" color="warning"}
Over 40% of data breaches in 2025 involved compromised API credentials. Securing your endpoints is not optional.
::

## Setting Up IAM

The Riavzon IAM module provides a drop-in solution for identity management. Here's how to get started:

### 1. Install the Package

```bash
npm install @sergo/iam
```

### 2. Configure the Auth Handler

Create a new server middleware that initializes the IAM client:

```typescript
import { createIAMClient } from '@sergo/iam'

const iam = createIAMClient({
  secret: process.env.IAM_SECRET,
  issuer: 'https://api.riavzon.com',
  tokenExpiry: '15m',
  refreshExpiry: '7d'
})

export default defineEventHandler(async (event) => {
  event.context.auth = await iam.validateRequest(event)
})
```

::note
The `tokenExpiry` controls how long access tokens live. Shorter values are more secure but require more frequent refreshes.
::

### 3. Protect Your Routes

Use the built-in middleware to enforce authentication on specific routes:

```typescript
export default defineEventHandler({
  onRequest: [requireAuth()],
  async handler(event) {
    const user = event.context.auth.user
    return { message: `Hello, ${user.name}!` }
  }
})
```

## Token Architecture

Riavzon uses a **dual-token architecture** for maximum security:

| Token Type     | Lifetime | Storage          | Purpose                    |
| -------------- | -------- | ---------------- | -------------------------- |
| Access Token   | 15 min   | Memory           | Stateless API auth         |
| Refresh Token  | 7 days   | HTTP-only cookie | Obtaining new access token |

::tip
Access tokens are never stored in `localStorage`. They live only in memory, making XSS attacks significantly harder.
::

## Rate Limiting

Protect against brute-force attacks with multi-tiered rate limiting:

```typescript
import { createRateLimiter } from '@sergo/iam'

const limiter = createRateLimiter({
  burst: { maxRequests: 10, windowMs: 1000 },
  sustained: { maxRequests: 100, windowMs: 60000 },
  penalty: { threshold: 5, blockDurationMs: 300000 }
})
```

The penalty system automatically escalates blocks for repeat offenders, backed by persistent storage in MySQL.

## What's Next?

In the next article, we'll cover **OAuth integration** with third-party providers and how Riavzon handles account linking.

::callout{icon="i-lucide-rocket" color="primary"}
Ready to get started? Check out the [Getting Started guide](/docs/getting-started) for a complete walkthrough.
::
