---
title: Encryption
description: Secure utility for encrypting and decrypting data using AES-256-GCM and scrypt key derivation.
icon: i-lucide-lock
---

The `encryption` utility provides a secure wrapper around the native Node.js crypto module. It uses `scrypt` for robust password-based key derivation and `AES-256-GCM` for authenticated encryption. It handles binary conversion automatically and ensures data integrity by bundling the salt, initialization vector, authentication tag, and ciphertext together.

Both encryption and decryption functions wrap their outputs in a standardized [`Results`](/docs/utils/types/standardresponse) object, providing clean and predictable error handling without requiring extensive try-catch blocks.

---

## Definition

```ts [encryption.ts]
export interface EncryptionConfig {
  scrypt?: {
    keyLength?: number
    saltLength?: number
    params?: {
      n?: number
      r?: number
      p?: number
    }
  }
  initializationVectorLength?: number 
}

export interface EncryptionInstance {
  toBuffer: (data: unknown) => Buffer | Uint8Array
  encrypt: (data: unknown, password: string) => Results<Buffer>
  decrypt: <T>(encrypted: Buffer, password: string) => Results<T>
}

export function encryption(options?: EncryptionConfig): EncryptionInstance
```

## Initialization Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | `EncryptionConfig` | No | Optional tuning parameters. See the Configuration Options table below. |

## Configuration Options

You can customize the underlying cryptographic parameters by passing an `EncryptionConfig` object during initialization.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `scrypt.keyLength` | `number` | `32` | The length of the generated derived key in bytes. |
| `scrypt.saltLength` | `number` | `32` | The length of the random salt in bytes. |
| `scrypt.params.n` | `number` | `16384` | The CPU and memory cost parameter for scrypt. |
| `scrypt.params.r` | `number` | `8` | The block size parameter for scrypt. |
| `scrypt.params.p` | `number` | `1` | The parallelization parameter for scrypt. |
| `initializationVectorLength` | `number` | `12` | The length of the IV in bytes for AES-GCM. |

## Methods

### `encrypt(data, password)`

Converts the provided data to a buffer and encrypts it using the provided password. It generates a fresh random salt and initialization vector for every operation. The result is a single contiguous buffer containing all components necessary for decryption.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `data` | `unknown` | Yes | The data to encrypt. Strings, numbers, and objects are automatically stringified to JSON and converted to buffers. |
| `password` | `string` | Yes | The secret password used to derive the encryption key via scrypt. |

**Returns** [`Results<Buffer>`](/docs/utils/types/standardresponse): A standardized result object containing the combined binary buffer on success, or a failure reason on error.

::caution
After this point if you loss your password, your data cannot be decrypted
::

### `decrypt<T>(encrypted, password)`

Parses the bundled buffer to extract the salt, IV, and tag, then re-derives the key to decrypt the data. It verifies the authentication tag automatically to ensure data integrity. The method attempts to parse the decrypted bytes as JSON, falling back to raw bytes if parsing fails.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `encrypted` | `Buffer` | Yes | The bundled buffer containing the salt, IV, authentication tag, and ciphertext. |
| `password` | `string` | Yes | The secret password originally used during encryption. |

**Returns** [`Results<T>`](/docs/utils/types/standardresponse): A standardized result object containing the decrypted and automatically parsed data on success, or a failure reason on error.

### `toBuffer(data)`

Safely converts unknown data into a `Buffer` or `Uint8Array`. If the data is a plain object, it is stringified to JSON before conversion. This is used internally but exposed for convenience.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `data` | `unknown` | Yes | The data to safely convert into a Buffer. |

**Returns** `Buffer | Uint8Array`: The binary representation of the input data.

## Example Usage

Initialize the utility once and use the provided methods to secure your data:

```typescript [cryptoService.ts]
import { encryption } from '@riavzon/utils/server'

// Initialize with default secure settings
const { encrypt, decrypt } = encryption()

const secretData = { apiKey: 'sk_live_12345', permissions: ['read', 'write'] }
const masterPassword = 'super_secure_password'

// Encrypt the payload
const encryptedResult = encrypt(secretData, masterPassword)

if (!encryptedResult.ok) {
  console.error('Failed to encrypt:', encryptedResult.reason)
  return
}

// Store the single binary buffer in your database
const binaryPayloadToStore = encryptedResult.data
```

When retrieving the data, use the generic type parameter to assert the structure of the decrypted payload:

```typescript [decryptService.ts]
interface SecretData {
  apiKey: string
  permissions: string[]
}

const decryptedResult = decrypt<SecretData>(binaryPayloadToStore, masterPassword)

if (decryptedResult.ok) {
  // TypeScript knows this is SecretData
  console.log(decryptedResult.data.apiKey)
} else {
  // Handles wrong passwords, tampered data, or corrupted formatting
  console.error('Decryption failed:', decryptedResult.reason)
}
```