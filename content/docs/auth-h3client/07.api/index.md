---
title: API Reference
description: Complete reference for all exported controllers, middleware, event handler wrappers, composables, route registrars, and utility functions.
icon: i-lucide-code
---

Server-side exports are available from `auth-h3client/v1` (H3 v1) and `auth-h3client/v2` (H3 v2). Browser-side composables and utilities ship from the separate `auth-h3client/client` entry point. When using the Nuxt module, server utilities are auto-imported inside the `server/` directory and client composables are auto-imported in Vue components and pages.

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: Routes Reference
  description: Every HTTP route registered by the module with its middleware chain, request body, cookies, and response shapes.
  icon: i-lucide-route
  to: /docs/auth-h3client/api/controllers
  ---
  ::

  ::UPageCard
  ---
  title: Middleware Reference
  description: All authentication guards, CSRF middleware, bot detection middleware, request validation, event handler wrappers, and error utilities with Reads, Sets, and Responses tables.
  icon: i-lucide-layers
  to: /docs/auth-h3client/api/middleware
  ---
  ::
::

::UPageGrid{class="lg:grid-cols-2 mt-10"}
  ::UPageCard
  ---
  title: Client-side Reference
  description: Browser-side Vue composables and fetch utilities from auth-h3client/client for session state, magic link handling, authenticated requests, and CSRF token reading.
  icon: i-lucide-component
  to: /docs/auth-h3client/api/composables
  ---
  ::

  ::UPageCard
  ---
  title: Utilities
  description: Server utilities for token metadata, user data caching, server-to-server requests, HMAC signing, cookie management, OAuth helpers, image validation, and more.
  icon: i-lucide-wrench
  to: /docs/auth-h3client/api/utilities
  ---
  ::
::