---
title: mTLS
description: Securing the IAM service with mutual TLS — configuring client certificate authentication for service-to-service calls, terminating TLS at the proxy layer, and trusting upstream headers.
icon: i-lucide-shield-ellipsis
---

Mutual TLS (mTLS) requires both the server and the client to present a certificate during the TLS handshake. For the IAM service, mTLS is the strongest available option for authenticating internal service-to-service calls — it prevents any service without a valid certificate from reaching the IAM endpoints, even on a private network.

::note
The IAM service itself does not implement TLS termination. TLS and mTLS are handled at the proxy layer (nginx, Caddy, AWS ALB, or similar). The IAM service trusts the proxy and reads the client certificate information from forwarded headers.
::

---

## Architecture

```
Internal service ──── mTLS ──── nginx/Caddy ──── HTTP ──── IAM service
                (client cert)  (terminates TLS)           (reads forwarded headers)
```

The proxy terminates the TLS connection, validates the client certificate against the CA, and forwards the verified certificate information to the IAM service in a header such as `X-Client-Cert-DN`. The IAM service trusts this header because the proxy is the only component allowed to reach it directly.

---

## Proxy configuration

### nginx

```nginx
server {
  listen 443 ssl;
  ssl_certificate     /etc/ssl/server.crt;
  ssl_certificate_key /etc/ssl/server.key;

  # Require client certificate
  ssl_client_certificate /etc/ssl/ca.crt;
  ssl_verify_client on;
  ssl_verify_depth 2;

  location / {
    proxy_pass http://iam-service:3000;
    proxy_set_header X-Client-Cert-DN $ssl_client_s_dn;
    proxy_set_header X-Client-Cert-Verified $ssl_client_verify;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### Caddy

```caddyfile
iam.internal {
  tls /etc/ssl/server.crt /etc/ssl/server.key {
    client_auth {
      mode require_and_verify
      trusted_ca_cert_file /etc/ssl/ca.crt
    }
  }

  reverse_proxy iam-service:3000 {
    header_up X-Client-Cert-DN {tls_client_subject}
    header_up X-Client-Cert-Verified {tls_client_certificate_verified}
  }
}
```

---

## IAM service configuration

Configure the IAM service to trust the upstream proxy and read the client IP from the forwarded header:

```ts [server/config/auth.ts]
import { configuration } from '@riavzon/auth'

await configuration({
  service: {
    proxy: {
      trust: true,
      ipToTrust: '10.0.0.1',    // IP address of the trusted proxy
    },
  },
  // ...
})
```

With `proxy.trust: true`, the service reads `req.ip` from `X-Forwarded-For` rather than the direct socket address. Set `ipToTrust` to the proxy's internal IP to prevent spoofing.

---

## Verifying the client certificate in a handler

Read the forwarded certificate header to verify the caller's identity in a custom handler or middleware:

```ts [server/middleware/verifyCert.ts]
import type { Request, Response, NextFunction } from 'express'

export function verifyCert(req: Request, res: Response, next: NextFunction) {
  const verified = req.headers['x-client-cert-verified']
  const dn = req.headers['x-client-cert-dn'] as string | undefined

  if (verified !== 'SUCCESS') {
    res.status(401).json({ error: 'Client certificate required.' })
    return
  }

  // Extract the common name from the DN string
  // e.g. "CN=billing-service,O=example,C=US"
  const cn = dn?.match(/CN=([^,]+)/)?.[1]

  if (!cn || !allowedClients.includes(cn)) {
    res.status(403).json({ error: 'Client certificate not authorised.' })
    return
  }

  next()
}

const allowedClients = ['billing-service', 'analytics-service']
```

Wire this middleware before any route that internal services call:

```ts
router.post('/internal/token-verify', verifyCert, handler)
```

---

## Issuing client certificates

Use [cfssl](https://github.com/cloudflare/cfssl) or [step-ca](https://smallstep.com/docs/step-ca/) to manage your internal CA and issue client certificates.

```bash [Terminal]
# Generate a client certificate for the billing service
step ca certificate billing-service billing.crt billing.key \
  --ca-url https://ca.internal \
  --root /etc/ssl/ca.crt
```

Distribute the certificate and key to the calling service. Rotate certificates on a regular schedule (90 days is common) and revoke them immediately if a service is decommissioned.

---

## Auth H3 Client mTLS

The [Auth H3 Client](/docs/auth-h3client) module provides built-in mTLS support for connecting your Nuxt/H3/Nitro frontend to the IAM service. Configure it with the certificate paths in the client configuration:

```ts [server/plugins/auth.ts]
import { configuration } from 'auth-h3client'

configuration({
  server: {
    auth_location: {
      serverOrDNS: 'auth-service.internal',
      port: 10000,
    },
    ssl: {
      enableSSL: true,
      mainDirPath: '/etc/ssl/certs',
      rootCertsPath: 'ca.pem',
      clientCertsPath: 'client.crt',
      clientKeyPath: 'client.key',
    },
    cryptoCookiesSecret: process.env.COOKIE_SECRET!,
  },
  // ...
})
```

| Field | Type | Description |
| --- | --- | --- |
| `enableSSL` | `boolean` | Set to `true` to enable mTLS on all requests to the IAM service |
| `mainDirPath` | `string` | Base directory where certificate files are stored |
| `rootCertsPath` | `string` | Filename of the root CA certificate (relative to `mainDirPath`) |
| `clientCertsPath` | `string` | Filename of the client certificate (relative to `mainDirPath`) |
| `clientKeyPath` | `string` | Filename of the client private key (relative to `mainDirPath`) |

The Auth H3 Client reads the certificates synchronously at startup and attaches them to every request sent to the IAM service via an Undici `Agent`.

---

## Combining mTLS with HMAC

For the highest inter-service security posture, combine mTLS (transport layer) with [HMAC request signing](/docs/iam/essentials/hmac) (application layer). mTLS ensures only authorized services can connect; HMAC ensures that a compromised network path cannot forge valid requests.

::tip
Use mTLS for all internal service-to-service traffic and HMAC for the subset of calls that reach the IAM service directly. This gives you defense in depth without adding latency to every request.
::
