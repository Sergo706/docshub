---
title: Introduction
description: An overview of the Riavzon ecosystem — what each module does, how they connect, and where to start.
icon: i-lucide-rocket
---

# Introduction

The Riavzon ecosystem is a set of focused Node.js modules for authentication, bot detection, and shared infrastructure. Each module has a single responsibility, and they are designed to work together as a layered stack. You can use the full stack or adopt individual modules into an existing application.

## The Stack

The ecosystem has five modules. Three of them form the core authentication and bot detection pipeline. The other two are supporting tools.

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
  title: IAM
  description: The central authentication service. Handles signup, login, logout, OAuth, MFA, token issuance, anomaly detection, and rate limiting. Runs as a standalone Express app backed by MySQL.
  icon: i-lucide-shield-check
  to: /docs/iam
  ---
  ::

  ::UPageCard
  ---
  title: Auth H3 Client
  description: The gateway layer for your Nuxt, Nitro, or H3 application. Sits between the browser and the IAM service. Handles session management, token rotation, CSRF, OAuth code exchange, magic links, and bot screening.
  icon: i-lucide-layers
  to: /docs/auth-h3client
  ---
  ::

  ::UPageCard
  ---
  title: Bot Detector
  description: An Express middleware that scores incoming requests through 17 configurable checkers. Used internally by the IAM service and available standalone. Reads compiled MMDB and LMDB databases from Shield Base.
  icon: i-lucide-shield-half
  to: /docs/bot-detection
  ---
  ::

  ::UPageCard
  ---
  title: Shield Base
  description: The data layer for Bot Detector. A CLI and programmatic tool that downloads, processes, and compiles IP intelligence, geolocation, threat feeds, and user-agent databases into MMDB and LMDB formats.
  icon: i-lucide-database-zap
  to: /docs/shield-base
  ---
  ::

  ::UPageCard
  ---
  title: Utilities
  description: A tree-shakeable library of generic TypeScript helpers, server utilities, ESLint configurations, and advanced utility types shared across the ecosystem.
  icon: i-lucide-wrench
  to: /docs/utils
  ---
  ::
::

---

## How the modules connect

Understanding the dependency chain helps you decide which modules to set up and in what order.

::steps

### Shield Base compiles the databases

Shield Base downloads BGP tables, geolocation data, Tor exit nodes, FireHOL threat lists, and verified crawler IP ranges. It compiles them into MMDB and LMDB binary files that the Bot Detector reads at runtime. You run Shield Base once to produce the databases, then again periodically to refresh them.

### Bot Detector uses those databases

The Bot Detector middleware reads the compiled databases to score each incoming request across IP reputation, geolocation consistency, device fingerprinting, behavioral rate limits, and more. Requests that exceed the ban threshold are rejected at the edge before touching any application logic.

### IAM uses Bot Detector internally

The IAM service runs Bot Detector on every request as part of its middleware chain. It also manages the canary cookie that ties a browser session to a specific visitor fingerprint, which Bot Detector uses for session coherence checks.

### Auth H3 Client proxies to IAM

Auth H3 Client is the server layer of your Nuxt or Nitro application. It intercepts authentication-related requests, signs them with HMAC, forwards them to the IAM service, and applies the resulting tokens and cookies to the response. Your application never handles raw credentials.

::

---

## Where to start

The right starting point depends on what you are building.

::UPageGrid{class="lg:grid-cols-2"}
  ::UPageCard
  ---
  title: I want to add auth to a Nuxt app
  description: Start with the IAM service, then connect your Nuxt frontend using Auth H3 Client. The Nuxt module registers all routes and middleware automatically with a single plugin call.
  icon: i-lucide-monitor-smartphone
  to: /docs/auth-h3client/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: I want to add auth to an H3 or Nitro app
  description: Auth H3 Client ships H3 v1 and H3 v2 exports. Register the route handlers and middleware manually using the provided router setup functions.
  icon: i-lucide-server
  to: /docs/auth-h3client/guides/h3-nitro
  ---
  ::

  ::UPageCard
  ---
  title: I want to deploy the IAM service
  description: The IAM service runs as a standalone Express app or Docker container. Start with the getting started guide to configure the database, JWT settings, and email transport.
  icon: i-lucide-shield-check
  to: /docs/iam/getting-started
  ---
  ::

  ::UPageCard
  ---
  title: I want to add bot detection to an existing app
  description: Bot Detector is a standalone Express middleware. Compile the databases with Shield Base, then mount the middleware on your router.
  icon: i-lucide-bot
  to: /docs/bot-detection/getting-started
  ---
  ::
::

::note
If you are setting up the full stack for the first time, the recommended order is: **Shield Base**, **IAM**, **Auth H3 Client**. Bot Detector is bundled with the IAM service, so you do not need to configure it separately unless you want to use it standalone.
::