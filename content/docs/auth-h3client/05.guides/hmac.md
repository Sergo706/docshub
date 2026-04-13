---
title: HMAC Inter-service Auth
description: How the module signs every outbound request to the IAM service with HMAC-SHA256, what headers are generated, and how to validate incoming signatures from other services.
icon: i-lucide-fingerprint
---

HMAC inter-service authentication ensures that only known gateway instances can reach the IAM service. Every request the module sends to the IAM service is signed with a shared secret and a timestamp. The IAM service verifies the signature before processing the request, rejecting anything that does not carry a valid signature or arrives outside the clock-skew tolerance window.

---

## How signing works

`signature(method, path)` generates four headers that authenticate the request:

| Header | Content |
|---|---|
| `X-Client-Id` | The gateway's identifier, from `hmac.clientId` |
| `X-Timestamp` | Current Unix timestamp in milliseconds |
| `X-Request-Id` | A random UUID for this request |
| `X-Signature` | HMAC-SHA256 over `clientId:timestamp:method:path:requestId` |

The HMAC key is `hmac.sharedSecret`. The signature covers the method and path, preventing a valid signature from one endpoint being replayed against another.

`serviceToService` (the internal `sendToServer` function) calls `signature` automatically for every outbound request when `enableHmac: true`. You do not need to call it manually for standard flows.

---

## Configuration

Set `hmac.enableHmac` to `true` and provide matching `clientId` and `sharedSecret` values in both the module configuration and the IAM service configuration:

```ts [server/plugins/auth.ts]
configuration({
  server: {
    auth_location: {
      serverOrDNS: process.env.AUTH_SERVER_LOCATION!,
      port: Number(process.env.AUTH_PORT_LOCATION!)
    },
    hmac: {
      enableHmac: true,
      clientId: process.env.HMAC_CLIENT_ID!,
      sharedSecret: process.env.HMAC_SHARED_SECRET!
    },
    ssl: { enableSSL: false },
    cryptoCookiesSecret: process.env.AUTH_CRYPTO_COOKIES!
  }
})
```

::field-group

::field{name="hmac.enableHmac" type="boolean" required}
Activates HMAC signing. When `true`, every call to the IAM service includes the four signature headers. When `false`, requests are sent without authentication headers.
::

::field{name="hmac.clientId" type="string"}
A stable identifier for this gateway instance. Used in the signature base string and sent as `X-Client-Id`. The IAM service uses this to look up the expected shared secret.
::

::field{name="hmac.sharedSecret" type="string"}
The HMAC-SHA256 key. Must be identical in the module configuration and the IAM service configuration. Should be at least 32 bytes of random data and must remain stable across restarts.
::

::

::caution
If you let the config template auto-generate `clientId` and `sharedSecret`, they will be different on every cold start. The IAM service will reject requests signed with a key it does not recognize. Always set these values from environment variables in production.
::

---

## Signing requests manually

Call `signature` directly when making custom requests to the IAM service from your own handlers:

```ts [server/api/internal/sync.post.ts]
export default defineAuthenticatedEventHandler(async (event) => {
  const headers = signature('POST', '/internal/sync')

  const response = await fetch(`http://iam.internal:10000/internal/sync`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ... })
  })

  return response.json()
})
```

---

## How `hmacSignatureMiddleware` fits in

`hmacSignatureMiddleware` runs inside every authenticated handler wrapper (`defineAuthenticatedEventHandler`, `defineOptionalAuthenticationEvent`, etc.). It generates the four HMAC headers and stores them on `event.context.authHeaders` so that the IAM call made by the wrapper carries a valid signature. You do not need to call it directly in normal usage.

The HMAC signature verification for incoming requests is performed by the IAM service, not by the gateway. The gateway only generates outbound signatures.

---

## IAM service setup

The IAM service must have a matching `clientId` and `sharedSecret` configured in its HMAC settings. See [IAM HMAC](/docs/iam/essentials/hmac) for the server-side configuration, clock-skew tolerance settings, and replay detection nonce cache.

See [Security: Inter-service Authentication](/docs/auth-h3client/security#inter-service-authentication) for how HMAC fits into the full trust model between the BFF layer and the IAM service, and how it compares with mTLS. For the `hmacSignatureMiddleware` reference with full header and response tables, see the [Middleware Reference](/docs/auth-h3client/api/middleware#hmacSignaturemiddleware).
