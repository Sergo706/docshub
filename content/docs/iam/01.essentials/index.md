---
title: Essentials
description: Core concepts and features of the IAM service, from JWT tokens and anomaly detection to rate limiting, database schema, and service startup.
icon: i-lucide-book-open
---

The IAM service is composed of several interconnected subsystems. Each one is designed to work independently as a library export, and together they form a complete authentication stack. This section documents every core concept in detail.

## Token system

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Tokens
  description: How the IAM service generates, caches, verifies, rotates, and revokes JWT access tokens and MySQL-backed refresh tokens.
  icon: i-lucide-key-round
  to: /docs/iam/essentials/tokens
  ---
  ::

  ::UPageCard
  ---
  title: Access Tokens
  description: How the IAM service generates, caches, verifies, and revokes access tokens, and how library users wire roles and route protection.
  icon: i-lucide-shield-check
  to: /docs/iam/essentials/access-tokens
  ---
  ::

  ::UPageCard
  ---
  title: Refresh Tokens
  description: How the IAM service generates, stores, verifies, consumes, rotates, and revokes refresh tokens with reuse detection.
  icon: i-lucide-rotate-cw
  to: /docs/iam/essentials/refresh-tokens
  ---
  ::

  ::UPageCard
  ---
  title: Cookies
  description: How the IAM service sets, reads, clears, and secures cookies including the session refresh token, the issued-at timestamp, and the bot-detector canary identifier.
  icon: i-lucide-cookie
  to: /docs/iam/essentials/cookies
  ---
  ::
::

## Authentication flows

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Signup
  description: How the IAM service registers new users, the full validation pipeline from rate limiting through email domain verification to password breach checks.
  icon: i-lucide-user-plus
  to: /docs/iam/essentials/signup
  ---
  ::

  ::UPageCard
  ---
  title: Login
  description: How the IAM service authenticates users with email and password, the rate limiting and validation pipeline, device trust, and token issuance.
  icon: i-lucide-log-in
  to: /docs/iam/essentials/login
  ---
  ::

  ::UPageCard
  ---
  title: Logout
  description: How the IAM service terminates a session by consuming and revoking the refresh token, blacklisting the access token, and clearing cookies.
  icon: i-lucide-log-out
  to: /docs/iam/essentials/logout
  ---
  ::

  ::UPageCard
  ---
  title: OAuth
  description: How the IAM service handles OAuth social login, provider registration with schema or field-type maps, profile mapping, and user deduplication.
  icon: i-lucide-users
  to: /docs/iam/essentials/oauth
  ---
  ::
::

## Security and verification

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Anomaly Detection
  description: Nine sequential behavioral checks that run on every refresh-token use, including canary cookie matching, IP range comparison, and device fingerprint consistency.
  icon: i-lucide-scan-eye
  to: /docs/iam/essentials/anomalies
  ---
  ::

  ::UPageCard
  ---
  title: MFA
  description: Adaptive email OTP triggered automatically by anomaly detection, custom MFA flows for protecting sensitive actions, and OTP code generation and verification.
  icon: i-lucide-shield-alert
  to: /docs/iam/essentials/mfa
  ---
  ::

  ::UPageCard
  ---
  title: Magic Links
  description: Signed temporary JWT links for adaptive MFA, password reset, email update, and custom flows. All link tokens are cached and single-use by design.
  icon: i-lucide-link
  to: /docs/iam/essentials/magic-links
  ---
  ::

  ::UPageCard
  ---
  title: Fingerprinting
  description: How the IAM service builds a composite device fingerprint from IP geolocation and user-agent parsing, and how it persists and compares fingerprints for anomaly detection.
  icon: i-lucide-fingerprint
  to: /docs/iam/essentials/fingerprinting
  ---
  ::

  ::UPageCard
  ---
  title: XSS Protection
  description: The multi-pass HTML sanitization pipeline, Zod integration, automatic IP banning on XSS detection, and timing-attack prevention.
  icon: i-lucide-shield-x
  to: /docs/iam/essentials/xss
  ---
  ::

  ::UPageCard
  ---
  title: HMAC Authentication
  description: How the IAM service verifies inter-service requests using HMAC-SHA256 signatures, replay protection via a nonce cache, and clock-skew tolerance.
  icon: i-lucide-key-round
  to: /docs/iam/essentials/hmac
  ---
  ::
::

## Communication and delivery

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Emails
  description: Transactional emails through Resend, EJS templates for OTP and notification flows, custom templates, disposable-email detection, and MX validation.
  icon: i-lucide-mail
  to: /docs/iam/essentials/emails
  ---
  ::

  ::UPageCard
  ---
  title: Backend for Frontend
  description: Protected endpoints for BFF proxies, including authorization checks, token metadata with rotation hints, and the full middleware security chain.
  icon: i-lucide-layers
  to: /docs/iam/essentials/bff
  ---
  ::
::

## Infrastructure

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Rate Limiting
  description: Layered rate limiters with union pairing, strike-based blocking, consecutive failure caches, and per-endpoint limiter groups for every sensitive route.
  icon: i-lucide-gauge
  to: /docs/iam/essentials/rate-limiting
  ---
  ::

  ::UPageCard
  ---
  title: Logging
  description: Application and HTTP request logging with Pino, log file layout, redaction, request IDs, child loggers, and asset filtering.
  icon: i-lucide-file-text
  to: /docs/iam/essentials/logging
  ---
  ::

  ::UPageCard
  ---
  title: Database
  description: MySQL schema organization, connection pools, hashing utilities, and in-memory caches across three tables, two pool types, and an LRU access token store.
  icon: i-lucide-database
  to: /docs/iam/essentials/database
  ---
  ::

  ::UPageCard
  ---
  title: Service Startup
  description: How the IAM service boots, initializes pools and databases, mounts middleware and routes, and serves requests in both standalone and library modes.
  icon: i-lucide-rocket
  to: /docs/iam/essentials/service
  ---
  ::
::
