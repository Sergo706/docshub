---
title: JA4 TLS Fingerprint
description: Set up Caddy to extract JA4 fingerprints and write a custom checker that queries the ja4.mdb database.
icon: i-lucide-fingerprint
---

[JA4+](https://github.com/FoxIO-LLC/ja4) is a suite of TLS and network fingerprinting methods developed by FoxIO. A JA4 fingerprint is computed from the TLS ClientHello: the cipher suites, extensions, and elliptic curve parameters a client advertises when opening a connection. Because these parameters are determined by the TLS library and version, not by the application layer, they expose bots that spoof their `User-Agent` header but cannot change how their TLS stack behaves.

::note
A JA4 checker is one of the must valuable checker you could implement for your application.
::
`bot-detector` ships with a compiled [`ja4.mdb`](/docs/bot-detection/data-sources#behavioral-fingerprinting) LMDB database mapping JA4 hashes to known application and library identifiers, sourced from [ja4db.com](https://ja4db.com). No built-in checker reads it automatically. JA4 fingerprinting requires the proxy or load balancer in front of your Node.js process to extract the fingerprint from the TLS handshake and forward it as a request header. Node.js cannot do this from inside its own HTTP server.

This guide covers [Caddy](https://caddyserver.com/) as the proxy, since its module system makes the wiring straightforward.

::note
The TLS check built into `enableUaAndHeaderChecks` (`tlsCheckFailed`) is separate from JA4. It inspects the `x-client-cipher` and `x-client-tls-version` headers for basic cipher and protocol consistency. JA4 is a richer signal requiring the setup described here.
::
  
---

## What We Building

By the end of this guide you will have:

- A Caddy instance that extracts the JA4 fingerprint from every TLS handshake and adds it as an `X-JA4` request header before proxying to your Express app.
- A custom checker that reads `X-JA4`, queries `ja4.mdb`, and applies a penalty when the fingerprint identifies a known automation library or tool that contradicts the declared `User-Agent`.

---

## Prerequisites

- Caddy installed via [`xcaddy`](https://github.com/caddyserver/xcaddy), or access to a Caddy build with a JA4 fingerprinting module.
- `bot-detector init` already run so that `ja4.mdb` exists in the data directory.
- `defineConfiguration()` called and awaited before importing your checker file.

---

## Part 1: Caddy Setup

Caddy does not extract JA4 fingerprints in its standard distribution. You need to build Caddy with a module that hooks into the TLS handshake. The build process uses `xcaddy`.

::steps{level="3"}

### Install xcaddy

```bash [Terminal]
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
```

### Build Caddy with a JA4 module

Community modules provide JA4 extraction for Caddy. Check the [FoxIO JA4 integrations list](https://github.com/FoxIO-LLC/ja4/blob/main/INTEGRATIONS.md) for the current recommended Caddy module and its import path. Build Caddy with it using [`xcaddy`](https://github.com/caddyserver/xcaddy):

```bash [Terminal]
xcaddy build --with github.com/<author>/<caddy-ja4-module>@latest

# OR
xcaddy build --with github.com/matt-/caddy-ja4
```

The resulting binary includes the JA4 extraction capability. Replace the `github.com/...` path with the actual module from the integrations list.

::tip
If you manage Caddy through a package manager or container image, check whether your distribution already includes a fingerprinting module or whether a pre-built binary with JA4 support is available from the module author.
::

### Configure the Caddyfile

The [module](https://github.com/matt-/caddy-ja4) adds a placeholder that you insert into a request header before the reverse proxy forwards the request.

```caddy [Caddyfile]
{
    servers {
        listener_wrappers {
            ja4
            tls
        }
    }
    order ja4 before reverse_proxy
}

example.com {
    ja4 {
        request_header X-JA4
        var_name ja4
    }
    reverse_proxy localhost:8080 {
        header_up X-JA4 {http.vars.ja4}
    }
}
```

With this in place, every request that reaches your Express app includes an `X-JA4` header carrying the fingerprint of the TLS handshake that opened the connection.

::note
If your application sits behind multiple proxies, ensure the `X-JA4` header is set at the outermost TLS-terminating proxy and is not overwritten or stripped by intermediaries before it reaches your app.
::

::warning
Only trust `X-JA4` when it is set by infrastructure you control. If clients can reach your Node.js server directly (bypassing Caddy), a malicious client could inject a fake `X-JA4` header. Restrict direct access to your app port to localhost or your internal network.
::

::

---

## Part 2: Understanding the Database

The `ja4.mdb` LMDB database maps fingerprint hash strings to records sourced from [ja4db.com](https://ja4db.com). Each record corresponds to one known application, library, or device. Multiple JA4 variant fields (`ja4_fingerprint`, `ja4h_fingerprint`, `ja4s_fingerprint`, etc.) are each stored as separate keys pointing to the same record, so you can look up any JA4 variant directly by its hash string.

A record looks like this:

```ts
interface JA4Record {
  application: string | null;         // e.g. "Chrome", "curl", "python-requests"
  library: string | null;             // e.g. "OpenSSL", "BoringSSL"
  device: string | null;              // e.g. "Desktop", "Mobile"
  os: string | null;                  // e.g. "Windows", "Linux"
  user_agent_string: string | null;   // representative User-Agent string
  certificate_authority: string | null;
  observation_count: number | null;
  verified: boolean | null;
  notes: string | null;
  ja4_fingerprint: string | null;
  ja4_fingerprint_string: string | null;
  ja4s_fingerprint: string | null;
  ja4h_fingerprint: string | null;
  ja4x_fingerprint: string | null;
  ja4t_fingerprint: string | null;
  ja4ts_fingerprint: string | null;
  ja4tscan_fingerprint: string | null;
  date: string;
  comment: string;
}
```

The most useful fields for bot detection are `application` (the browser or tool name) and `library` (the TLS library it uses). An `application` value of `"curl"`, `"python-requests"`, or `"Go-http-client"` in a request claiming to be Chrome is a clear contradiction.

---

## Part 3: The Checker

The checker reads the `X-JA4` header set by Caddy, queries `ja4.mdb`, and scores the result. It runs in the **cheap** phase because the LMDB lookup is synchronous and reads from a pre-loaded in-memory database.

Create a new file for the checker:

```ts [ja4-checker.ts]
import { CheckerRegistry, getDataSources } from '@riavzon/bot-detector';
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

// Known automation libraries and CLI tools that should never appear
// as the fingerprint for a request claiming to be a browser.
const BAD_LIBRARIES = new Set([
  'openssl', 'python', 'go', 'java', 'ruby', 'php',
  'curl', 'wget', 'libcurl', 'requests', 'aiohttp',
]);

const BAD_APPLICATIONS = new Set([
  'curl', 'wget', 'python-requests', 'go-http-client',
  'httpie', 'insomnia', 'postman', 'axios',
]);

export const ja4CheckerConfig = {
  penalty: 60,
};

class Ja4FingerprintChecker implements IBotChecker<'JA4_MISMATCH' | 'JA4_BAD_LIBRARY'> {
  name = 'JA4FingerprintChecker';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig): boolean {
    return true;
  }

  run(ctx: ValidationContext, _config: BotDetectorConfig) {
    const reasons: ('JA4_MISMATCH' | 'JA4_BAD_LIBRARY')[] = [];
    let score = 0;

    const ja4Hash = ctx.req.get('x-ja4');
    if (!ja4Hash) return { score, reasons };

    const db = getDataSources().getJa4Lmdb();
    const record = db.get(ja4Hash);
    if (!record) return { score, reasons };

    // Check if the TLS library is one used by automation tools, not browsers.
    const library = (record.library ?? '').toLowerCase();
    if (library && BAD_LIBRARIES.has(library)) {
      score += ja4CheckerConfig.penalty;
      reasons.push('JA4_BAD_LIBRARY');
      return { score, reasons };
    }

    // Check if the fingerprinted application contradicts the User-Agent.
    const application = (record.application ?? '').toLowerCase();
    if (application && BAD_APPLICATIONS.has(application)) {
      score += ja4CheckerConfig.penalty;
      reasons.push('JA4_MISMATCH');
      return { score, reasons };
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new Ja4FingerprintChecker());
```

Register the checker by importing the file after `defineConfiguration()` resolves:

```ts [server.ts]
import { defineConfiguration, detectBots } from '@riavzon/bot-detector';
import './ja4-checker.js';

await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
});

app.use(detectBots());
```

::note
`getDataSources()` is called inside `run()`, not at module level. The data sources are not available until `defineConfiguration()` resolves, so calling it at the top of the module would throw.
::

---

## Going Further

The checker above covers the most common case: an obvious mismatch between the JA4 fingerprint's application and the declared `User-Agent`. The `ja4.mdb` database and the JA4+ suite support more nuanced analysis.

**Cross-reference with `ctx.parsedUA`**: Instead of checking against a fixed list of bad applications, compare `record.application` against the browser name from `ctx.parsedUA.browser`. A request with a Chrome User-Agent and a JA4 record that maps to `"curl"` is a strong spoofing signal.

```ts [ja4-checker.ts]
const declaredBrowser = (ctx.parsedUA.browser ?? '').toLowerCase();
const fingerprintedApp = (record.application ?? '').toLowerCase();

if (fingerprintedApp && declaredBrowser && !fingerprintedApp.includes(declaredBrowser)) {
  score += ja4CheckerConfig.penalty;
  reasons.push('JA4_MISMATCH');
}
```

**Use the `verified` flag**: Records with `verified: true` have been confirmed by the ja4db community. You can apply a higher penalty for verified mismatches and a lower one for unverified entries.

**JA4H (HTTP fingerprint)**: The JA4 suite includes a JA4H fingerprint that captures HTTP/2 header ordering. If your Caddy module also forwards `X-JA4H`, you can look it up the same way using the same `ja4.mdb` database, since JA4H hashes are stored alongside JA4 hashes in the same LMDB.

---
::caution
This is an extremely simplified guide, misconfiguration can cause serious security risks in your app and network, make sure you fully understand the subject before applying the guide.

Start with the Blog posts by the creators below.
::

## Resources

| Resource | URL |
| --- | --- |
| FoxIO JA4+ specification | [github.com/FoxIO-LLC/ja4](https://github.com/FoxIO-LLC/ja4) |
| JA4+ integrations list | [github.com/FoxIO-LLC/ja4/blob/main/INTEGRATIONS.md](https://github.com/FoxIO-LLC/ja4/blob/main/INTEGRATIONS.md) |
| JA4 fingerprint database | [ja4db.com](https://ja4db.com) |
| A blog post from FoxIO to help you understand JA4+ Network Fingerprinting better | [Network Fingerprinting](https://foxio.io/blog/ja4-network-fingerprinting) |
| TCP Fingerprinting | [JA4T: TCP Fingerprinting](https://foxio.io/blog/ja4t-tcp-fingerprinting)
| DHCP Fingerprinting | [JA4D and JA4D6: DHCP Fingerprinting](https://foxio.io/blog/ja4d-and-ja4d6-dhcp-fingerprinting)
| xcaddy build tool | [github.com/caddyserver/xcaddy](https://github.com/caddyserver/xcaddy) |
| Custom checker guide | [Custom Checkers](/docs/bot-detection/guides/custom) |
