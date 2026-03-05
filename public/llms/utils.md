---
title: Shared Utilities Library
description: A standard library of highly optimized helpers and types.
icon: i-lucide-wrench
---

# Utilities Library (`@sergo/utils`)

The `@sergo/utils` repository serves as the fundamental bedrock of the Riavzon ecosystem. It is a strictly typed library containing generic TypeScript utilities, unified configuration parameters, and shared typings utilized across all other microservices and frontends.

By centralizing common logic, this library ensures consistency across authentication backends, edge gateways, and heavy bot-detection middleware.

## Core Structure

The library is organized into discrete functional domain folders:

### `generic/` (Core Tools)
Contains heavily optimized pure functions avoiding side-effects.
- **Data Manipulation:** Fast list and object traversal tools like `ensureArray` to normalize varied inputs reliably.
- **Sanitization & Formatting:** Standardized string parsing for reliable database insertion or UI rendering.
- **Lightweight Caching:** Integrations like `miniCache` provide instantaneous, memory-efficient TTL storage crucial for high-throughput edge proxies.

### `types/` (Shared Contracts)
Maintains the unified TypeScript (`.d.ts`) interfaces.
- **API Contracts:** Strictly defines the input payloads and expected JSON response structures utilized inherently by the BFFs and upstream Auth services.
- **Error Types:** Establishes predictable error union types (e.g., specific HTTP exception domains).
- **Configuration Schemas:** Centralizes definitions (mostly powered by `zod`) so that when the IAM service configuration updates, the client implementations automatically reflect those strict constraints.

### `eslint/` (Linting Standardization)
Exports pre-configured, highly strict ESLint profiles designed specifically for our tooling matrix:
- `defineStrictTSConfig` for pure Node endpoints (like the backend IAM and Bot Detector).
- `defineStrictVueConfig` extending the base profiles but injecting specific rules for isomorphic Vue/Nuxt environments.

This enforces uniform code quality and style conventions immediately when bootstrapping new projects within the ecosystem, eradicating configuration fatigue.

## Usage Overview

Because the library utilizes ES modules (`type: "module"`), imports can cleanly harness tree-shaking mechanisms during build:

```typescript
// Isomorphic execution context
import { ensureArray, miniCache } from '@sergo/utils';

const parsedTags = ensureArray(rawTagsInput);
```
