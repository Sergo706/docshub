---
title: Auth H3 Client
description: Gateway authentication module for Nuxt and Nitro applications that connects your frontend to the IAM service with full session management, OAuth flows, CSRF protection, token rotation, and more.
icon: i-lucide-layers
---

`@riavzon/auth-h3client` is a gateway authentication module for [Nuxt](https://nuxt.com/) and [Nitro](https://nitro.unjs.io/) applications. It sits between the browser and the [IAM service](/docs/iam) and handles every authentication operation that belongs in the server layer of your frontend: session hydration, access token rotation, CSRF enforcement, OAuth code exchange, magic link handling, bot detection, API token verification, and inter-service request signing.

Its the Backend for frontend for the [IAM service](/docs/iam/essentials/bff) service.

The module ships pre-built H3 controllers for authentication flows, MFA flows, API token inventory routes, and an OAuth client to connect to various providers. It also exports event handler wrappers for API token verification and management. Every controller proxies to the IAM service over an authenticated connection with optional mTLS and HMAC request signing.

Both H3 v1 and H3 v2 are supported and ship the same controller and utility surface.

::note
Auth H3 Client is designed to run as the server layer of a Nuxt or Nitro application. The [IAM service](/docs/iam) must be running and reachable for every request that requires authentication. The module does not store credentials or issue tokens; it proxies to IAM and manages the resulting cookies and responses.
::

## Features

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
  title: Session Management
  description: Server and client session state stay synchronized without an extra round trip.
  icon: i-lucide-user-check
  ---
  ::

  ::UPageCard
  ---
  title: Token Rotation
  description: Access tokens are checked and rotated automatically on every protected request. A built-in deduplication mechanism ensures that parallel requests on the same session do not trigger competing refresh calls, keeping the session consistent under concurrent load.
  icon: i-lucide-refresh-cw
  ---
  ::

  ::UPageCard
  ---
  title: CSRF Protection
  description: A signed, expiring CSRF cookie is issued on first contact and validated on every state-changing request. The check covers the cookie signature, expiry, and a matching request header using timing-safe comparison to prevent forgery and timing side-channel attacks.
  icon: i-lucide-shield-x
  ---
  ::

  ::UPageCard
  ---
  title: Route Protection
  description: Pre-built event handler wrappers enforce authentication and CSRF requirements at the route level. Each wrapper receives the verified session data as a typed argument so no manual token extraction or status checking is needed inside the handler body.
  icon: i-lucide-lock-keyhole
  ---
  ::

  ::UPageCard
  ---
  title: OAuth and OIDC
  description: Built-in handlers cover the full authorization code flow with PKCE support. After the provider callback, the module verifies the ID token signature against the provider's JWKS endpoint, validates the at_hash claim, and forwards user data to the IAM service with protected field enforcement.
  icon: i-lucide-users
  ---
  ::

  ::UPageCard
  ---
  title: MFA and Magic Links
  description: A composable reads magic link query parameters on page load and routes the verification to the correct server endpoint based on the reason embedded in the link. Pre-built server handlers cover code requests, magic link validation, and code submission.
  icon: i-lucide-link
  ---
  ::

  ::UPageCard
  ---
  title: Password Reset and Email Change
  description: Pre-built handlers cover the complete two-step flows for password reset and email change. Each flow relies on a signed magic link issued by the IAM service. A dedicated handler validates the link before accepting new credentials.
  icon: i-lucide-key-round
  ---
  ::

  ::UPageCard
  ---
  title: Bot Detection
  description: Incoming requests are screened against the IAM service bot detection pipeline. The middleware reads the visitor fingerprint, forwards it to the check endpoint, and returns 403 for flagged visitors. On Linux with UFW available, banned IPs can be dropped at the firewall level.
  icon: i-lucide-scan-eye
  ---
  ::

  ::UPageCard
  ---
  title: mTLS
  description: Every outbound connection from the module to the IAM service can present a client certificate and verify the server certificate. The SSL configuration points to the certificate bundle paths and the module builds the underlying HTTP agent accordingly.
  icon: i-lucide-file-badge
  ---
  ::

  ::UPageCard
  ---
  title: HMAC Inter-service Auth
  description: Every request the module sends to the IAM service can be signed with a shared secret and a timestamp. The IAM service rejects any request that does not carry a valid signature, ensuring that only known gateway instances can reach it.
  icon: i-lucide-fingerprint
  ---
  ::

  ::UPageCard
  ---
  title: API Tokens
  description: Built-in wrappers verify `X-API-KEY` headers against the IAM service, expose authenticated token inventory routes, and proxy token creation, rotation, revocation, privilege changes, and IP restriction updates through typed H3 handlers.
  icon: i-lucide-key-square
  ---
  ::

  ::UPageCard
  ---
  title: Image Upload
  description: Uploaded image buffers are validated against a configurable list of allowed MIME types, extensions, and a maximum byte size. Valid images are converted to WebP before storage. An optional key function controls how the storage path is derived from the upload context.
  icon: i-lucide-image
  ---
  ::


  ::UPageCard
  ---
  title: Logging
  description: Ships with both HTTP logger and a general logger that used internally, and can be imported to use in your app.
  icon: i-lucide-bell
  ---
  ::

::

## Documentation

::UPageGrid
  ::UPageCard
  ---
  title: Getting Started
  description: Prerequisites, installation, configuration, and first-run verification.
  icon: i-lucide-rocket
  to: /docs/auth-h3client/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: Essentials
  description: Essentials docs for this module.
  icon: i-lucide-book-open
  to: /docs/auth-h3client/essentials
  ---
  ::

  ::UPageCard
  ---
  title: Client-side
  description: Browser-side Vue composables and fetch utilities shipped from auth-h3client/client.
  icon: i-lucide-monitor
  to: /docs/auth-h3client/client
  ---
  ::

  ::UPageCard
  ---
  title: Guides
  description: Guides for this module.
  icon: i-lucide-book-marked
  to: /docs/auth-h3client/guides/hmac
  ---
  ::

  ::UPageCard
  ---
  title: Security
  description: Overview of the security primitives and design of this module.
  icon: i-lucide-lock-keyhole
  to: /docs/auth-h3client/security
  ---
  ::

  ::UPageCard
  ---
  title: Configuration
  description: Complete reference for the configuration object.
  icon: i-lucide-settings
  to: /docs/auth-h3client/configuration
  ---
  ::

  ::UPageCard
  ---
  title: API Reference
  description: Complete reference for all exported controllers, middleware, event handler wrappers, composables, and utility functions.
  icon: i-lucide-code
  to: /docs/auth-h3client/api
  class: col-span-full
  ---
  ::

::
