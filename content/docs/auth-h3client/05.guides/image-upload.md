---
title: Image Upload
description: How to validate uploaded image buffers, enforce size and type limits, convert to WebP, and store the result using the configured unstorage instance.
icon: i-lucide-image
---

The module provides an image validation and conversion pipeline built on [sharp](https://sharp.pixelplumbing.com/) and [file-type](https://github.com/sindresorhus/file-type). It validates the uploaded buffer against configured limits, detects the actual MIME type from the file magic bytes rather than trusting the filename extension, converts the image to WebP, and derives a storage key.

---

## Configuration

The `imageUploader` block in the configuration controls what is allowed:

```ts
imageUploader: {
  allowedBytes: 5_000_000,                              // 5 MB max
  allowedMimes: ['image/png', 'image/jpeg', 'image/webp'],
  allowedExtensions: ['png', 'webp', 'jpeg', 'jpg'],
  key: (input) => `uploads/users/${input.userId}`       // optional
}
```

::field-group

::field{name="allowedBytes" type="number"}
Maximum buffer size in bytes. Buffers exceeding this limit are rejected before any processing begins. Default to `5000000` (5 MB).
::

::field{name="allowedMimes" type="string[]"}
Allowed MIME types. Validated against the actual detected type from the file magic bytes, not the declared content type. Default to `["image/png", "image/jpeg", "image/webp"]`.
::

::field{name="allowedExtensions" type="string[]"}
Allowed file extensions, matched against the extension detected from magic bytes. Default to `["png", "webp", "jpeg", "jpg"]`.
::

::field{name="key" type="Function"}
Optional function that returns a storage path prefix. Called with no arguments in the current implementation. The key is combined with a sanitized filename and `.webp` extension: `{key()}_{sanitizedName}.webp`. When omitted, a UUID is used as the prefix.
::

::

---

## `validateImage`

`validateImage(data, filename)` takes a raw `Buffer` and the original filename. It runs the following checks in order:

::steps{level="4"}

#### Size check

Rejects buffers larger than `allowedBytes`. Returns `{ ok: false, reason: 'File to large' }` immediately without processing.

#### MIME detection

Reads the file magic bytes using `file-type`. If the type cannot be detected, returns `{ ok: false, reason: 'Error validating mime' }`.

#### Type and extension check

Compares the detected MIME type and extension against `allowedMimes` and `allowedExtensions`. Both must be in the allowed lists. Returns `{ ok: false, reason: 'Not allowed file type.' }` on mismatch.

#### WebP conversion

Passes the buffer through sharp with:
- Auto-rotation based on EXIF orientation
- Resize to fit within 2000×2000 pixels, preserving aspect ratio
- WebP conversion at effort level 5

#### Key generation

Sanitizes the filename using `sanitizeBaseName(filename, 64)` to strip unsafe characters and truncate to 64 characters. Combines it with the `key()` result or a UUID to produce the final storage key.

::

Return value:

```ts
type ValidFile = {
  ok: true
  body: Buffer      // WebP-converted image buffer
  key: string       // Storage key including sanitized filename and .webp extension
  mime: string      // Always 'image/webp'
}

type UploadError = {
  ok: false
  date: string
  reason: string
}
```

---

## Usage in a route

Use `limitBytes` before reading the body to reject oversized payloads at the HTTP layer before the buffer is allocated. Then read the body, validate, and store:

```ts [server/api/upload/avatar.post.ts]
export default defineAuthenticatedEventPostHandlers(async (event) => {
  await limitBytes(5_000_000)(event)

  const { userId } = event.context.authorizedData
  const body = await readMultipartFormData(event)

  const file = body?.find(f => f.name === 'avatar')
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const result = await validateImage(file.data, file.filename)

  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.reason })
  }

  // Store result.body at result.key using your storage provider
  const storage = useStorage('images')
  await storage.setItemRaw(result.key, result.body)

  return { ok: true, key: result.key }
})
```

---

## Filename sanitization

`sanitizeBaseName(input, max)` strips path traversal sequences, null bytes, control characters, and other unsafe characters from a filename. It truncates to `max` characters. Use it whenever you derive a storage path from user-supplied input:

```ts
const cleanName = sanitizeBaseName('../../etc/passwd.png', 64)
// 'etcpasswd.png'

const cleanName2 = sanitizeBaseName('my profile photo (2026).jpeg', 64)
// 'my_profile_photo_2026.jpeg'
```

---

## Storage

The `uStorage` configuration accepts any [unstorage](https://unstorage.unjs.io/) instance. Use the same storage instance for auth caching and image metadata, or configure separate instances:

```ts
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

uStorage: {
  storage: createStorage({ driver: fsDriver({ base: './data' }) }),
  cacheOptions: {
    successTtl: 60 * 60 * 24 * 30,
    rateLimitTtl: 10
  }
}
```

The `uStorage.storage` instance is used by `getCachedUserData` for session caching. Image buffers stored via `setItemRaw` use the same storage instance but different key namespaces, so there is no conflict.

See [Security: Input Validation](/docs/auth-h3client/security#input-validation) for how `sanitizeBaseName` fits into the module's broader input sanitization strategy. The `validateImage` function reference with the full `ok` / `reason` return type is in [Utilities](/docs/auth-h3client/api/utilities#validateimage).
