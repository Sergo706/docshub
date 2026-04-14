---
title: IAM
description: Production-grade Identity and Access Management for Node.js and Express
icon: i-lucide-shield-check
---

`@riavzon/auth` is a production-grade authentication service built on [Express 5](https://expressjs.com/) and [MySQL](https://www.mysql.com/). It ships ready to use route sets, middleware, and a fully typed programmatic API that cover every layer of a modern auth stack: JWT access and refresh tokens with configurable rotation, multi-factor authentication, OAuth social login, behavioral anomaly detection, rate limiting, and secure email flows powered by [Resend](https://resend.com/).

You can use this service, as library to build your own custom flows, configure different part of it to suite your apps needs, and use the standalone service thats already shipped with it.

The service integrates directly with [Bot Detector](/docs/bot-detection) for IP geolocation and device fingerprinting, and uses [Shield Base](/docs/shield-base) databases for disposable-email and threat-intelligence checks.

The service is also available as a docker image.

::note
IAM is designed to run as a standalone Express service. The [Auth H3 Client](/docs/auth-h3client) module connects your Nuxt/H3/Nitro frontend to this service with full session management, different OAuth providers and many other boilerplate to get you started quickly to actual building your app. 
::

## Features

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
  title: JWT Token Lifecycle
  description: Short-lived access tokens cached in memory for fast verification, and long-lived refresh tokens stored hashed in MySQL with configurable rotation on every use.
  icon: i-lucide-key-round
  ---
  ::

  ::UPageCard
  ---
  title: Anomaly Detection
  description: Every refresh-token use runs through nine behavioral checks including canary-cookie matching, IP range comparison, idle-time detection, device fingerprint consistency, and integrates natively with the Bot Detector service.
  icon: i-lucide-scan-eye
  ---
  ::

  ::UPageCard
  ---
  title: Adaptive MFA
  description: Email OTP links are issued automatically when an anomaly is detected. Custom MFA flows let you trigger verification for any sensitive action in your application.
  icon: i-lucide-shield-alert
  ---
  ::

  ::UPageCard
  ---
  title: OAuth Social Login
  description: Add any OAuth provider by defining a name and field mapping. Built-in support for standard profile schemas with automatic deduplication against existing accounts.
  icon: i-lucide-users
  ---
  ::

  ::UPageCard
  ---
  title: Rate Limiting
  description: Fully configurable rate limiters for every sensitive endpoint. Backed by in-memory or MySQL stores with black and white list support.
  icon: i-lucide-gauge
  ---
  ::

  ::UPageCard
  ---
  title: Magic Links
  description: Signed temporary JWTs power password reset and MFA email flows. All link tokens are cached and single use by design.
  icon: i-lucide-link
  ---
  ::

  ::UPageCard
  ---
  title: Password Security
  description: Argon2id hashing with a configurable pepper, time cost, memory cost, and hash length. Built-in disposable-email detection via Shield Base LMDB.
  icon: i-lucide-lock-keyhole
  ---
  ::

  ::UPageCard
  ---
  title: HMAC Service Auth
  description: Optional shared-secret HMAC authentication layer for inter-service calls with clock-skew tolerance and request signing.
  icon: i-lucide-fingerprint
  ---
  ::

  ::UPageCard
  ---
  title: mTLS support
  description: The Auth H3 Client allows you easily to configure mTLS to the auth service.
  icon: i-lucide-file-badge
  ---
  ::

  ::UPageCard
  ---
  title: Detects Leaked Credentials
  description: Uses the haveibeenpwned api and searches it by hash range using k-anonymity to detect if new signing up users, uses leaked password, and if logging in users password was found in a data breach.
  icon: i-lucide-radar
  ---
  ::

  ::UPageCard
  ---
  title: Logging
  description: Ships with both HTTP logger and a general logger powered by pino.
  icon: i-lucide-terminal
  ---
  ::

  ::UPageCard
  ---
  title: Docker
  description: Comes with a hardened docker image with your secrets encrypted at rest, and deleted after they loaded.
  icon: i-lucide-container
  ---
  ::
::

## Documentation
::UPageGrid
  ::UPageCard
  ---
  title: Getting Started
  description: Prerequisites, installation, and first run.
  icon: i-lucide-rocket
  to: /docs/iam/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: Essentials
  description: Token lifecycle, authentication flows, anomaly detection, MFA, rate limiting, database schema, and every core subsystem.
  icon: i-lucide-book-open
  to: /docs/iam/essentials
  ---
  ::

  ::UPageCard
  ---
  title: Security
  description: Password hashing with Argon2id, cookie security, XSS defenses, and an overview of the defense strategy.
  icon: i-lucide-lock-keyhole
  to: /docs/iam/security
  ---
  ::

  ::UPageCard
  ---
  title: Guides
  description: RBAC, deployment, etc for using this service.
  icon: i-lucide-book-marked
  to: /docs/iam/guides/rbac
  ---
  ::

  ::UPageCard
  ---
  title: Configuration
  description: Complete reference for the configuration object passed to the IAM service, including database, JWT, email, and rate-limiter options.
  icon: i-lucide-settings
  to: /docs/iam/configuration
  ---
  ::

  ::UPageCard
  ---
  title: API Reference
  description: Complete reference for all exported functions, middlewares, and routes.
  icon: i-lucide-code
  to: /docs/iam/api/api
  ---
  ::
::