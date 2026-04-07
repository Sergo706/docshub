---
title: Encryption
description: Encryption utilities in the IAM service — SHA-256 digest validation, token hashing, JWT algorithm selection, and recommendations for encrypting sensitive fields at rest.
icon: i-lucide-lock
---

The IAM service provides several encryption and hashing utilities used internally and available to your application code. This page documents them and gives guidance on encrypting sensitive data at rest.

---

## SHA-256 digest utilities

`ensureSha256Hex` and `toDigestHex` provide a consistent SHA-256 hashing interface backed by Node.js's built-in `crypto` module.

### `toDigestHex`

Computes a SHA-256 digest and returns the lowercase hexadecimal string.

```ts
import { toDigestHex } from '@riavzon/auth'

const hash = toDigestHex('some-token-value')
// Returns: 'a3f1c2...' (64-character hex string)
```

The IAM service uses this internally to hash refresh tokens before storing them in MySQL. Only the hash is stored — the raw token is sent to the client once and never retained.

### `ensureSha256Hex`

Validates that a string is already a valid SHA-256 hex digest (64 lowercase hex characters). Use it to verify that a value coming from an untrusted source has the expected format before using it in a database query.

```ts
import { ensureSha256Hex } from '@riavzon/auth'

const isValid = ensureSha256Hex(incomingHash)

if (!isValid) {
  res.status(400).json({ error: 'Invalid hash format.' })
  return
}
```

---

## JWT algorithm selection

Access tokens support all major JWT signing algorithms. Choose the algorithm based on your key management capabilities:

| Algorithm family | Algorithms | Key type | Use when |
|-----------------|------------|----------|----------|
| HMAC | `HS256`, `HS384`, `HS512` | Symmetric secret | Single-service or simple deployments |
| RSA | `RS256`, `RS384`, `RS512` | RSA key pair | Multiple services need to verify tokens |
| ECDSA | `ES256`, `ES384`, `ES512` | EC key pair | Smaller keys with equivalent security to RSA |
| RSA-PSS | `PS256`, `PS384`, `PS512` | RSA key pair | RSA with probabilistic padding |

Configure the algorithm in `jwt.access_tokens.algorithm` inside `configuration()`:

```ts
jwt: {
  jwt_secret_key: process.env.JWT_SECRET!,   // HMAC secret or RSA private key PEM
  access_tokens: {
    algorithm: 'RS256',
    expiresIn: '15m',
  },
  // ...
}
```

::tip
For services where multiple backends verify access tokens, use an asymmetric algorithm (`RS256` or `ES256`). Distribute the public key to verifying services — they never need the private key.
::

---

## Encrypting sensitive fields at rest

The IAM service stores user data (email, name, geolocation, device fingerprint) in MySQL. For fields that require encryption at rest beyond full-disk encryption, apply column-level AES encryption using Node.js's `crypto` module before inserting and after reading.

```ts [server/utils/fieldEncryption.ts]
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex')  // 32 bytes

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptField(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
```

AES-256-GCM provides authenticated encryption — it detects tampering in addition to maintaining confidentiality.

::warning
`FIELD_ENCRYPTION_KEY` must be exactly 32 bytes (256 bits) encoded as a 64-character hex string. Store it in a secrets manager and rotate it on a schedule. Rotating the key requires re-encrypting all affected rows.
::

---

## Key management recommendations

| Key | Storage | Rotation |
|-----|---------|---------|
| JWT secret / private key | Environment variable or secrets manager | Annually or on compromise |
| Magic link JWT secret | Environment variable or secrets manager | Annually or on compromise |
| Argon2 pepper | Environment variable or secrets manager | With full password re-hash campaign |
| Field encryption key | Secrets manager with key versioning | Annually with row re-encryption |
| HMAC shared secret | Secrets manager | Quarterly or on service change |

All secrets should be rotated immediately if a compromise is suspected. The IAM service must be restarted after any secret rotation to reload the new values from the environment.
