---
title: parseCookies
description: Parses raw cookies from strings, arrays, or objects into a key-value record.
icon: i-lucide-cookie
---

The `parseCookies` utility is a flexible parser that normalizes cookie data from various sources into a standard key-value `Record`. It automatically ignores common cookie attributes (like `path` or `expires`) and URI-decodes all values.

## Definition

```ts [parseRawCookies.ts]
/**
 * Parses raw cookies from various formats into a key-value record.
 *
 * @param cookies - The cookies to parse (Record, array of strings, or a single string).
 * @returns A record of cookies where keys are names and values are strings or numbers.
 */
export function parseCookies(
    cookies: Record<string, unknown> | string[] | string
): Record<string, string | number>
```

## Supported Inputs

- **Single String**: A standard `document.cookie` style string (e.g., `"id=1; theme=dark"`).
- **Array of Strings**: Common in Node.js response headers (e.g., `["id=1", "theme=dark"]`).
- **Existing Objects**: Will normalize numeric values and return a clean Record.

## Example Usage

```typescript [example.ts]
import { parseCookies } from '@sergo/utils'

// 1. Parsing a standard cookie string
const fromString = parseCookies("theme=dark; user=sergo; path=/");
// { theme: "dark", user: "sergo" }

// 2. Parsing from an array (e.g., set-cookie headers)
const fromArray = parseCookies(["session=abc; HttpOnly", "dev=true"]);
// { session: "abc", dev: "true" }
```

::callout{icon="i-lucide-info" color="info"}
The parser automatically excludes reserved attributes such as `domain`, `path`, `expires`, `max-age`, `samesite`, `secure`, and `httponly`.
::
