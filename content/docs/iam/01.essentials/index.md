---
title: Essentials
description: Core concepts and features of the IAM service — JWT tokens, anomaly detection, MFA, OAuth, magic links, emails, HMAC, and XSS protection.
icon: i-lucide-book-open
---

The IAM service is composed of several interconnected subsystems. Each one is designed to work independently as a library export, and together they form a complete authentication stack. This section documents every core concept in detail.

## Core concepts

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Tokens
  description: JWT access tokens cached in memory for fast verification, and refresh tokens stored hashed in MySQL with configurable rotation strategies.
  icon: i-lucide-key-round
  to: /docs/iam/essentials/tokens
  ---
  ::

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
  description: Adaptive email OTP triggered automatically by anomaly detection, and custom MFA flows for protecting sensitive actions like payments or account deletion.
  icon: i-lucide-shield-alert
  to: /docs/iam/essentials/mfa
  ---
  ::

  ::UPageCard
  ---
  title: OAuth
  description: Add any OAuth provider with a name and field mapping. Built-in standard profile schema with automatic deduplication against existing accounts.
  icon: i-lucide-users
  to: /docs/iam/essentials/OAuth
  ---
  ::

  ::UPageCard
  ---
  title: Magic Links
  description: Signed temporary JWTs for password reset and email MFA flows. All link tokens are cached and single-use by design.
  icon: i-lucide-link
  to: /docs/iam/essentials/magic-links
  ---
  ::

  ::UPageCard
  ---
  title: Emails
  description: System emails, OTP notifications, custom templates via Resend, disposable-email detection, and MX record validation.
  icon: i-lucide-mail
  to: /docs/iam/essentials/emails
  ---
  ::

  ::UPageCard
  ---
  title: HMAC
  description: Optional shared-secret HMAC authentication for inter-service requests with clock-skew tolerance and request signing.
  icon: i-lucide-fingerprint
  to: /docs/iam/essentials/hmac
  ---
  ::

  ::UPageCard
  ---
  title: XSS Protection
  description: Multi-pass HTML sanitization and entity encoding that protects every user-supplied string before it reaches the database.
  icon: i-lucide-shield-x
  to: /docs/iam/essentials/xss
  ---
  ::
::
