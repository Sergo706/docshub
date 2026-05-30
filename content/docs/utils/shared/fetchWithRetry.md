---
title: fetchWithRetry
description: Fetches a URL with automatic exponential backoff and jitter, retrying on specific HTTP statuses or network errors.
icon: i-lucide-repeat
---

`fetchWithRetry` wraps the standard fetch API to provide resilient network requests. It automatically retries requests when they fail or return specific error codes. By using exponential backoff combined with randomized jitter, it prevents overwhelming struggling servers.

The function handles both network failures, where the fetch request itself throws an error, and HTTP errors, like 429 Too Many Requests or 500 Internal Server Error.

## Definition

```ts [fetchWithRetry.ts]
export async function fetchWithRetry(
  url: string, 
  retries = 5, 
  delay = 1000, 
  init?: RequestInit, 
  statusCodeToRetry?: number | number[]
): Promise<Response>
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | `string` | Yes | The target URL to fetch. |
| `retries` | `number` | No | The maximum number of retry attempts. Defaults to `5`. |
| `delay` | `number` | No | The base delay in milliseconds before the first retry. It doubles on each subsequent retry. Defaults to `1000`. |
| `init` | `RequestInit` | No | Optional custom settings to apply to the fetch request, such as headers or HTTP method. |
| `statusCodeToRetry` | `number \| number[]` | No | A specific HTTP status code or array of codes that trigger a retry. If not provided, any non-OK response (`!res.ok`) triggers a retry. |

## Returns

Returns a Promise resolving to the standard fetch `Response` object. It throws the last error encountered if a network failure persists after all retries are exhausted. If an HTTP error persists, it returns the final failed `Response` object.

## Example Usage

The most common use case is fetching data from an external API that might temporarily fail or rate-limit your requests.

### Basic Retry on Any Error

By default, the function retries on any non-OK response:

```typescript [apiClient.ts]
import { fetchWithRetry } from '@riavzon/utils'

// Retries up to 5 times for any 4xx or 5xx status code
const response = await fetchWithRetry('https://api.example.com/data')

if (!response.ok) {
  throw new Error('Failed to fetch data after all retries')
}

const data = await response.json()
```

### Targeted Retries

You can target specific status codes to avoid retrying on permanent errors like 404 Not Found:

```typescript [targetedRetry.ts]
import { fetchWithRetry } from '@riavzon/utils'

// Only retry if the server is rate-limiting (429) or unavailable (503)
// Retries 3 times, starting with a 2000ms base delay
const response = await fetchWithRetry(
  'https://api.example.com/submit',
  3,
  2000,
  { method: 'POST', body: JSON.stringify(payload) },
  [429, 503]
)
```

::callout{icon="i-lucide-info" color="info"}
The backoff time is calculated by doubling the base delay on every retry and adding a randomized jitter. This means a base delay of 1000ms will wait roughly 1s, then 2s, then 4s, and then 8s between subsequent failures.
::
  