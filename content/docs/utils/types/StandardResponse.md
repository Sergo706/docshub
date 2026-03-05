---
title: StandardResponse
description: A consistent API response structure used across the application.
icon: i-lucide-file-json
---

The `StandardResponse` types provide a consistent and predictable structure for all operations and API responses. By utilizing a discriminated union (`Results<T>`), these types allow TypeScript to distinctively resolve a payload as either a success or an error object.

## Types

### `Success<T>`

Represents a successful operation or API response.

```ts [Success.ts]
/**
 * Represents a successful operation or API response.
 *
 * @template T - The type of the payload data returned in the response.
 */
interface Success<T> {
  ok: true;
  date: string;
  data: T;
}
```

## Properties
| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ok` | `true` | - | Indicates that the operation was successful. |
| `date` | `string` | - | The date and time when the response was generated (usually an ISO 8601 string). |
| `data` | `T` | `unknown` | The payload containing the requested data. |

### `ApiError`

Represents a failed operation or API response.

```ts [ApiError.ts]
/**
 * Represents a failed operation or API response.
 */
interface ApiError {
  ok: false;
  date: string;
  reason: string;
}
```

## Properties
| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `ok` | `false` | - | Indicates that the operation failed. |
| `date` | `string` | - | The date and time when the error occurred (usually an ISO 8601 string). |
| `reason` | `string` | - | A descriptive message explaining the reason for the failure. |

### `Results<T>`

A discriminated union representing the final result of an operation or API call. It resolves to either a `Success` object containing the requested data or an `ApiError` object detailing the failure.

```ts [Results.ts]
/**
 * A discriminated union representing the final result of an operation or API call.
 * 
 * @template T - The type of the data expected upon success. Defaults to `unknown`.
 */
type Results<T = unknown> = Success<T> | ApiError;
```

## Example Usage

With the `Results` union, TypeScript will properly narrow the payload and distinctly enforce the correct properties via the `ok` discriminator.

```typescript [example.ts]
import type { Results } from '@sergo/utils/types'

async function fetchUser(): Promise<Results<{ id: string, name: string }>> {
  try {
    const user = await db.getUser()
    
    return {
      ok: true,
      date: new Date().toISOString(),
      data: user
    }
  } catch (error: unknown) {
    return {
      ok: false,
      date: new Date().toISOString(),
      reason: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
 
// Discriminator typings in action:
const response = await fetchUser()

if (response.ok) {
  // TypeScript correctly infers `response.data`
  console.log('Success:', response.data.name)
} else {
  // TypeScript correctly infers `response.reason`
  console.log('Failed:', response.reason)
}
```
