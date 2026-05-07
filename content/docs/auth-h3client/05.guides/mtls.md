---
title: mTLS Configuration
description: How to configure mutual TLS so every outbound connection from the module to the IAM service presents a client certificate and verifies the server certificate.
icon: i-lucide-file-badge
---

Mutual TLS (mTLS) adds client certificate authentication to every connection between the module and the IAM service. The server verifies that the client presents a certificate signed by the trusted CA, and the client verifies the server certificate against the same CA. This prevents unauthorized services from calling the IAM service even if they know the HMAC secret.

The module uses [Undici](https://undici.nodejs.org/) as the HTTP client. When SSL is enabled, `getAuthAgent` builds an Undici `Agent` configured with the certificate bundle and returns it for all outbound connections.

---

## Certificate setup

You need three files:

- A CA certificate (the root certificate that signs both the server and client certificates)
- A client certificate signed by the CA
- The private key corresponding to the client certificate

A minimal setup using OpenSSL:

```bash [Terminal]
# Generate a CA key and self-signed certificate
openssl genrsa -out ca.key 4096
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
  -subj "/CN=Internal CA"

# Generate a client key and certificate signing request
openssl genrsa -out client.key 4096
openssl req -new -key client.key -out client.csr \
  -subj "/CN=nuxt-gateway"

# Sign the client certificate with the CA
openssl x509 -req -days 365 -in client.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out client.crt
```

Place all files in a single directory and configure the paths relative to that directory:

```
certs/
├── ca.crt         # CA certificate (rootCertsPath)
├── client.crt     # Client certificate (clientCertsPath)
└── client.key     # Client private key (clientKeyPath)
```

The IAM service must be configured with the same CA certificate to verify the client certificate. 

::note
That should be configured in the proxy layer
::

---

## Configuration

Set `ssl.enableSSL` to `true` and provide the paths to your certificate files in the `ssl` block of the configuration:

```ts [server/plugins/auth.ts]
configuration({
  server: {
    auth_location: {
      serverOrDNS: 'iam.internal',
      port: 10000
    },
    hmac: {
      enableHmac: true,
      clientId: process.env.HMAC_CLIENT_ID!,
      sharedSecret: process.env.HMAC_SHARED_SECRET!
    },
    ssl: {
      enableSSL: true,
      mainDirPath: '/app/certs',
      rootCertsPath: 'ca.crt',
      clientCertsPath: 'client.crt',
      clientKeyPath: 'client.key'
    },
    cryptoCookiesSecret: process.env.AUTH_CRYPTO_COOKIES!
  },
  // ... rest of configuration
})
```

::field-group

::field{name="ssl.enableSSL" type="boolean" required}
Activates mTLS. When `true`, all outbound requests to the IAM service use the configured certificate bundle.
::

::field{name="ssl.mainDirPath" type="string"}
Absolute path to the directory containing the certificate files. All other paths are resolved relative to this directory.
::

::field{name="ssl.rootCertsPath" type="string"}
Filename of the CA certificate relative to `mainDirPath`.
::

::field{name="ssl.clientCertsPath" type="string"}
Filename of the client certificate relative to `mainDirPath`.
::

::field{name="ssl.clientKeyPath" type="string"}
Filename of the client private key relative to `mainDirPath`.
::

::

---

## How it works

`getAuthAgent(botDetector, ssl?)` builds the Undici agent. When called without arguments it reads the SSL configuration from the stored configuration object. Pass a `ProgrammaticSSL` object to override the file paths at call time.

```ts
const agent = getAuthAgent(false)
// Returns an Agent with the client certificate loaded,
// or undefined when SSL is disabled or paths are missing.

const botAgent = getAuthAgent(true)
// Returns an Agent with both the client certificate and
// high-throughput connection pool settings for bot detection polling.
```

The agent is used internally by `serviceToService` (the `sendToServer` function) for all calls from the module to the IAM service. You do not need to pass it manually.

---

## Verification

After configuring mTLS, verify the connection from outside the application:

```bash [Terminal]
curl --cert certs/client.crt \
     --key certs/client.key \
     --cacert certs/ca.crt \
     https://iam.internal:10000/health
```

A successful response confirms both sides are presenting and accepting certificates. A TLS handshake error indicates a mismatch in the certificate chain or an incorrect path in the configuration.

::tip
In a Docker environment, mount the certificate directory as a read-only volume and set `mainDirPath` to the container path. Do not bake certificates into the image.
::

See [Security: Inter-service Authentication](/docs/auth-h3client/security#inter-service-authentication) for how mTLS relates to HMAC signing and when to use each. See [HMAC guide](/docs/auth-h3client/guides/hmac) for the application-layer authentication layer that runs alongside mTLS. See [IAM Security: Network Isolation](/docs/iam/security#network-isolation) for the deployment topology mTLS is designed to protect.
