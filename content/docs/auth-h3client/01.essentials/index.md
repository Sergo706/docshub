---
title: Essentials
description: Core concepts covering session management, route protection, CSRF, token rotation, authentication flows, OAuth, bot detection, cookies, and logging.
icon: i-lucide-book-open
---

The essentials section covers every subsystem that the module provides at the gateway layer. Each page focuses on one area of the integration: how it works, what the relevant functions are, and how to wire them into your H3, Nitro, or Nuxt application.

For MFA, password reset, and email change flows, see the dedicated [MFA section](/docs/auth-h3client/mfa).

For Nuxt/Vue Composables see the [Client-Side](/docs/auth-h3client/client) section

::UPageGrid
  ::UPageCard
  ---
  title: Session Management
  description: How useAuthData populates auth state during SSR, hydrates on the client, and exposes MFA challenges.
  icon: i-lucide-user-check
  to: /docs/auth-h3client/essentials/session
  ---
  ::

  ::UPageCard
  ---
  title: Route Protection
  description: Event handler wrappers that enforce authentication, CSRF, and method requirements at the route definition level.
  icon: i-lucide-lock-keyhole
  to: /docs/auth-h3client/essentials/route-protection
  ---
  ::

  ::UPageCard
  ---
  title: CSRF Protection
  description: How the signed CSRF cookie is issued and verified, and how the client composables inject the token on every state-changing request.
  icon: i-lucide-shield-x
  to: /docs/auth-h3client/essentials/csrf
  ---
  ::

  ::UPageCard
  ---
  title: Auth Flows
  description: The built-in login, signup, and logout controllers, the routes they register, and how token cookies are set on the response.
  icon: i-lucide-log-in
  to: /docs/auth-h3client/essentials/auth-flows
  ---
  ::

  ::UPageCard
  ---
  title: OAuth and OIDC
  description: Provider configuration, the authorization redirect, the callback exchange, PKCE, ID token verification, and at_hash validation.
  icon: i-lucide-users
  to: /docs/auth-h3client/essentials/oauth
  ---
  ::

  ::UPageCard
  ---
  title: Bot Detection
  description: IP validation, bot detection middleware, the check endpoint integration, and firewall-level banning.
  icon: i-lucide-scan-eye
  to: /docs/auth-h3client/essentials/bot-detection
  ---
  ::

::

::UPageGrid{class="lg:grid-cols-2 mt-5"}
  ::UPageCard
  ---
  title: Cookies
  description: Cookie names, security attributes, how signed cookies work, and the makeCookie utility.
  icon: i-lucide-cookie
  to: /docs/auth-h3client/essentials/cookies
  ---
  ::

  ::UPageCard
  ---
  title: Logging
  description: The HTTP request logger, the pino logger instance, log levels, and Telegram alerting for critical events.
  icon: i-lucide-terminal
  to: /docs/auth-h3client/essentials/logging
  ---
  ::
::
