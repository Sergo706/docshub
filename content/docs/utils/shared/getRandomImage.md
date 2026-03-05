---
title: getRandomImage
description: Fetches random image metadata and URLs from the Picsum API with local fallback.
icon: i-lucide-image
---

The `getRandomImage` utility provides a streamlined way to fetch placeholder images for your application. It attempts to retrieve real image data from the [Picsum Photos API](https://picsum.photos/), but includes a deterministic fallback mechanism that generates seeded URLs if the network or API is unavailable.

## Definition

```ts [getRandomImage.ts]
export interface ImageResults {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

/**
 * Creates a random image fetcher instance.
 *
 * @param limit - The number of images to fetch.
 * @returns An object containing the `getter` function and a helper `toUrls`.
 */
export function getRandomImage(limit: number): {
  getter: () => Promise<ImageResults[] | Error>;
  toUrls: (result: ImageResults[] | Error) => string[];
}
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | `number` | Yes | The exact number of images you want to retrieve. |

## Returns

The utility returns an object containing two highly useful members:

### `getter()`
An asynchronous function that fetches the images. It handles pagination internally if the requested limit exceeds the API's per-page limit. If the fetch fails, it automatically returns a set of deterministic, seeded placeholder images.

### `toUrls(result)`
A synchronous helper function that extracts the `download_url` from the array of `ImageResults` returned by the getter, or returns an empty array if an `Error` was passed.

## Example Usage

```typescript [example.ts]
import { getRandomImage } from '@sergo/utils'

// 1. Initialize the fetcher for 5 images
const { getter, toUrls } = getRandomImage(5);

async function loadGallery() {
  // 2. Fetch the metadata
  const results = await getter();

  if (results instanceof Error) {
    console.error('Failed to get images, though fallback data was provided');
    return;
  }

  // 3. Convert metadata to an array of URLs
  const urls = toUrls(results);

  console.log('Image URLs:', urls);
}
```

::callout{icon="i-lucide-info" color="info"}
The fallback mechanism generates `https://picsum.photos/seed/...` URLs, which are deterministic based on the index. This ensures your UI remains consistent even during development offline.
::
