---
title: API Tokens
description: Machine-to-machine authentication using hashed API keys with rotation, privilege control, IP restrictions, and rate-limited verification.
icon: i-lucide-key
---

The IAM service provides a full API token system designed for machine-to-machine (M2M) communication and external integrations.

API tokens are long-lived credentials stored hashed with `sha-256` in MySQL. Each token is associated with a user, scoped by privilege level, optionally restricted to specific IP addresses, and tracked with usage metadata.

The raw token is only returned once during creation and must be stored securely by the client.

To create a token, rotate, and perform any other related sensitive action, the session needs to be fully authenticated.
To create, rotate, or perform any other sensitive management action on a token, the user's session must be fully authenticated. To consume a token, the client simply provides the valid token, and your API verifies it against the required privilege scope.


If IP restrictions are in place, the token is expired, or the privilege scope is insufficient, the request will be rejected.

::tip
If you use the Auth H3 Client module, many of these integrations already exist, requiring minimal effort from your frontend to start using this subsystem.
::

---


Each API token consists of four parts:

- `prefix` - configurable identifier
- `random` - 64-byte cryptographically value
- `checksum` - SHA-256 derived integrity check
- `publicId` - A public identifier that lets clients reference a token for dashboard actions without exposing the secret.

This structure allows the service to:

- Reject malformed tokens instantly and before DB lookup
- Prevent timing attacks using safe comparisons
- Validate integrity without exposing sensitive data


The goal of this system is to securely authenticate M2M access to your resources, APIs, and data, while remaining flexible enough to support custom business logic.

It achieves that by:

- Keeping the privileges **abstract**: The system doesn't *know* what a privilege of `demo` means to your app. But it knows that if a token with a privilege of `demo` is created, it should fail verification on a privilege of `full`. This allow *your* app to enforce RBAC, feature flags, tiered APIs, etc. 
- Optional constraints: Expiry, IP restrictions, prefixes are all optional. Your app or your clients must explicitly opt-in.
- Configurable rate limiting: It enforce rate limits *only* on failed verification attempts. Sucessfull verification rate limits are opt-in, or should be enforces by your clients.
- Two modes: A library mode, when your install the service via npm and call the functions directly. Or as a service mode, you call the `HTTP` routes.

---

## Documentation

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
    title: Creating Tokens
    description: Generate API tokens, configure prefixes, privileges, expiration, and IP restrictions.
    to: /docs/iam/essentials/api/creation
    icon: i-lucide-plus-circle
  ---
  ::

  ::UPageCard
  ---
  title: Privilege Scoping
  description: Tokens are scoped to privilege levels such as demo, restricted, protected, full, or custom. Your app decide what to do with that information.
  icon: i-lucide-shield
  to: /docs/iam/essentials/api/management/privilege
  ---
  ::

  ::UPageCard
  ---
    title: Verification
    description: How API keys are validated, including checksum validation, DB lookup, and rate limiting.
    to: /docs/iam/essentials/api/verification
    icon: i-lucide-check-circle
  ---
  ::

  ::UPageCard
  ---
    title: Management Actions
    description: Revoke, rotate, update privileges, and manage tokens securely using public identifiers.
    to: /docs/iam/essentials/api/management
    icon: i-lucide-settings
  ---
  ::

  ::UPageCard
  ---
    title: Rate Limiting
    description: Detailed explanation of limiter strategies and configuration.
    to: /docs/iam/essentials/api/rate-limiting
    icon: i-lucide-gauge
  ---
  ::

  ::UPageCard
  ---
    title: Security
    description: Deep dive into hashing, validation, and attack resistance strategies.
    to: /docs/iam/essentials/api/security
    icon: i-lucide-shield-check
  ---
  ::

::
 