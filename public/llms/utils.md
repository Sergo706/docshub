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

### `shared/` & `server/` (Core Tools & Infrastructure)
Contains heavily optimized pure functions and robust server-side utilities.
- **Advanced Concurrency & Scheduling:** Provides `scheduleTask` for non-blocking recurring background jobs, `batchQueue` for request coalescing, and `promiseLocker` for safe concurrency locks.
- **Rate Limiting & Memory Caching:** Features tiered backoff strategies, fast token buckets (`rateLimiters`), and `miniCache` for instantaneous, memory-efficient TTL storage crucial for edge proxies.
- **File & Process Management:** Includes `replace` for atomic file updates with built-in rollback protection, and `spawnRun` for specialized process execution.
- **Data Manipulation:** Fast list and object traversal tools like `ensureArray` to normalize varied inputs reliably.

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

## Evolution & Discovery

The functional domain folders (`shared/`, `server/`, `types/`, `eslint/`) are continuously growing with new features and helpers. **The utilities explicitly listed above are only a small subset of the library.** 

When working within this ecosystem, do not assume this document contains every available function. You should proactively search the repository, inspect the codebase, or check the `/content/docs/utils/` directory to discover new concurrency helpers, formatting tools, and type contracts that may have been added since this document was generated.

## Usage Overview

Because the library utilizes ES modules (`type: "module"`), imports can cleanly harness tree-shaking mechanisms during build:

```typescript
// Isomorphic execution context
import { ensureArray, miniCache } from '@sergo/utils';

const parsedTags = ensureArray(rawTagsInput);
```

## Links

- Repository: https://github.com/Sergo706/utils
- Package: https://www.npmjs.com/package/@riavzon/utils
- Full Docs for Users: https://docs.riavzon.com/docs/utils
- Full Docs for LLMS: https://docs.riavzon.com/llms-full.txt
- mmdbctl: https://github.com/ipinfo/mmdbctl
