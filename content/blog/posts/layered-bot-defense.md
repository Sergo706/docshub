---
title: "Layered Bot Defense: How Shield Base, Bot Detector, and the IAM Canary Cookie Work Together"
description: "A complete walkthrough of the three-layer bot defense pipeline: from compiling IP intelligence databases with Shield Base, to running 17 checkers in two phases with Bot Detector, to fingerprinting sessions with the IAM canary cookie."
tags:
  - Security
  - Bot Detection
  - Infrastructure
image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80"
author: "Sergio"
authorImg: "https://github.com/Sergo706.png"
authorGithub: "https://github.com/Sergo706"
authorGithubUserName: "Sergo706"
featured: false
date: 2026-04-13
readingTime: "18 min read"
---

Most bot detection systems operate on a single layer: a rule list, a rate limiter, or a third-party API call. The problem with that model is that any single signal can be spoofed. A bot can rotate IPs, forge user-agent strings, and slow its request rate to look human. Defeating it requires combining signals from multiple independent layers so that evading one does not defeat the others.

The Riavzon stack addresses this with three coordinated components. Shield Base compiles IP intelligence from a dozen external sources into binary databases. Bot Detector runs those databases through a two-phase, 17-checker pipeline that scores every incoming request. The IAM canary cookie ties each browser session to a fingerprint that follows it through every subsequent request. This post walks through every layer in detail — how each one works, what data it uses, and what happens when a bot hits the stack.

---

## The Three Layers at a Glance

Before going deep on each component, it helps to understand how they relate to one another.

Shield Base is a build-time tool. You run it once to produce a set of binary database files, then run it again periodically to refresh them. It has no runtime presence — it just produces the files that the other layers consume.

Bot Detector is a runtime Express middleware. It reads the Shield Base databases at startup and holds them in memory. Every request passes through its pipeline, which scores the request across behavioral, fingerprint, and reputation dimensions. If the score reaches the ban threshold, the middleware short-circuits the request before it touches any application logic.

The canary cookie is a per-session identifier, issued on first contact and carried on every subsequent request. Bot Detector uses it to track session state across requests — storing timing patterns, path history, and reputation scores keyed on the cookie value. The IAM service uses the same cookie to bind authentication tokens to a specific visitor fingerprint, enabling anomaly detection during token rotation.

```
Shield Base (build time)
  └── Compiles MMDB + LMDB databases
        └── Bot Detector (runtime middleware)
              ├── Cheap phase: 10 synchronous checkers
              ├── Heavy phase: 7 async checkers
              └── Issues canary_id cookie on first request
                    └── IAM service
                          ├── Binds refresh tokens to canary fingerprint
                          └── Flags anomalies during rotation
```

---

## Shield Base: Compiling the Intelligence Layer

Shield Base is a CLI tool that downloads, processes, and compiles external threat intelligence into binary formats that Bot Detector can query in microseconds at runtime. It produces two kinds of output: MMDB files for IP-range lookups and LMDB files for hash-keyed pattern matching.

### Why Binary Databases

The raw data that feeds bot detection is enormous. BGP routing tables, geolocation datasets, Tor node lists, FireHOL threat feeds, and user-agent pattern databases together contain hundreds of millions of entries. Querying them naively at runtime is not practical. MMDB (MaxMind DB) encodes IP ranges into a binary trie that resolves any IP to its metadata in a single file seek. LMDB (Lightning Memory-Mapped Database) is a memory-mapped key-value store that delivers zero-copy reads with no serialization overhead. Both formats are loaded once at startup and kept in memory for the lifetime of the process.

### The 14 Data Sources

Shield Base downloads and compiles 14 distinct data sources, each targeting a different threat signal.

**IP reputation and routing**

| Database | Output | Source | What it contains |
|---|---|---|---|
| ASN routing | `asn.mmdb` | bgp.tools | Autonomous system numbers, ISP classification, network visibility |
| City geolocation | `city.mmdb` | MaxMind Geofeed | IP-to-city mappings with coordinates, timezone, and subdivision |
| Country/geography | `country.mmdb` | Sapics ip-location-db | IPv4-to-country with continent and subregion data |
| Proxy detection | `proxy.mmdb` | Custom proxy lists | Known VPN exit points and proxy server IPs |
| Tor nodes | `tor.mmdb` | Torproject Onionoo API | Active Tor relays classified by role: exit, guard, bad exit |
| Verified crawlers | `goodBots.mmdb` | Web crawler domain lists | IP ranges belonging to legitimate search engines and SEO crawlers |

**Threat intelligence (FireHOL)**

FireHOL maintains multiple threat list tiers. Shield Base compiles all of them into separate MMDB files, which Bot Detector queries independently so that the scoring system can assign different penalty weights to each tier.

| Level | File | What it tracks |
|---|---|---|
| L1 | `firehol_l1.mmdb` | Current attacks — minimum false positives, maximum severity |
| L2 | `firehol_l2.mmdb` | Attacks observed in the last 48 hours, including dynamic IPs |
| L3 | `firehol_l3.mmdb` | Attacks, spyware, and viruses tracked over the last 30 days |
| L4 | `firehol_l4.mmdb` | Aggressive tracking with a higher false-positive rate |
| Anonymous | `firehol_anonymous.mmdb` | Tor exit nodes, I2P, VPNs, and other anonymity relays |

**Pattern databases (LMDB)**

| Database | Directory | What it contains |
|---|---|---|
| User-agent patterns | `useragent-db/useragent.mdb` | Known bot, scraper, and tool user-agent signatures with severity ratings |
| Disposable emails | `email-db/disposable-emails.mdb` | Domain blocklist for temporary and disposable email providers |
| JA4+ fingerprints | `ja4-db/ja4.mdb` | TLS client fingerprints mapped to known tool signatures |

### Running Shield Base

The CLI accepts flags for individual sources or bulk compilation. The `--parallel` flag compiles all sources concurrently, which is the standard approach for periodic refreshes.

::code-group

```bash [pnpm]
# Compile all sources in parallel
pnpm shield-base --all --parallel

# Compile specific sources
pnpm shield-base --bgp --geo --tor --l1 --l2

# Compile only LMDB pattern databases
pnpm shield-base --useragent --email --ja4
```

```bash [npm]
# Compile all sources in parallel
npm run shield-base --all --parallel

# Compile specific sources
npm run shield-base --bgp --geo --tor --l1 --l2

# Compile only LMDB pattern databases
npm run shield-base --useragent --email --ja4
```

::

Internally, `executeAll` runs 10 compilation tasks in parallel. Each task downloads its source data, processes it into the intermediate format, and compiles it using either the `mmdbctl` binary (for MMDB) or the native LMDB Node.js bindings. The output files land in a configured output directory that Bot Detector reads from at startup.

::note
Shield Base requires a valid contact User-Agent for the BGP/ASN data fetch from bgp.tools. Configure this in your Shield Base settings before running the first compilation.
::

---

## Bot Detector: The Two-Phase Scoring Pipeline

Bot Detector is a middleware factory. You call `configuration(config)` once at startup to register your settings and mount the middleware on your Express router. From that point on, every request passes through the pipeline, accumulates a score, and either continues to the next handler or receives a ban response.

### Loading the Databases

The `DataSources` class loads all Shield Base outputs at initialization. It opens 11 MMDB readers (ASN, city, country, good bots, Tor, proxy, and all five FireHOL levels) and 2 LMDB readers (user-agent patterns and JA4 fingerprints). It also accepts optional banned and high-risk MMDB files for custom enforcement lists. All readers stay open and memory-resident for the lifetime of the process. There are no per-request file operations — every lookup is an in-memory binary search.

### Scoring Mechanics

Every request starts with a score of zero. Checkers increment the score when they detect anomalies. The pipeline compares the running total against `banScore` (default: 100) after the cheap phase and again after the heavy phase. Reaching `banScore` at any point ends the pipeline immediately and sends a ban response.

Between requests, a reputation healer decrements the stored score by `restoredReputationPoints` (default: 10) for every non-banned request. A visitor who accumulated a score of 35 on a suspicious-looking first request will recover to zero across three or four clean subsequent requests, assuming no new checkers fire.

```ts
// Default scoring configuration
await configuration({
  banScore: 100,
  maxScore: 100,
  restoredReputationPoints: 10,
  setNewComputedScore: false,
  // ...
})
```

Setting `setNewComputedScore: false` (the recommended default) means the detector writes the computed score to the database only when no prior record exists. On subsequent requests, the reputation healer decrements the stored score without recomputing. This prevents a bot that varies its signals slightly between requests from oscillating between high and low scores — it accumulates a record and decays from it.

### Phase One: The Cheap Checkers

The cheap phase runs 10 synchronous checks. These checks use only in-memory data — parsed request headers, pre-loaded database lookups, and cached session state. They run in microseconds. If the cumulative score reaches `banScore` at any point in this phase, the pipeline stops immediately.

**1. IP Validation** — confirms the request carries a parseable, routable IP address. Malformed or missing IPs score 10 points. This catches raw tool invocations that do not set a legitimate source address.

**2. Good and Bad Bot Verification** — checks the request's IP against `goodBots.mmdb`. If the IP belongs to a known crawler, the middleware performs a reverse DNS lookup to verify the IP actually belongs to the claimed crawler domain. A passing DNS check issues `GOOD_BOT_IDENTIFIED` and whitelists the request instantly — no further checks run. A failing DNS check (IP on the good-bot list but DNS does not verify) issues `BAD_BOT_DETECTED` at 100 points — an instant ban. This checker handles the common impersonation pattern where a bot claims a Google or Bing user-agent from an unrelated hosting IP.

**3. Browser and Device Fingerprint** — parses the `User-Agent` header and applies penalties for impossible or implausible combinations.

| Signal | Penalty |
|---|---|
| CLI tool or HTTP library (curl, Python requests, etc.) | 100 |
| Internet Explorer | 100 |
| Kali Linux OS | 10 |
| Impossible browser/OS combination | 30 |
| Unknown browser type or name | 10 |
| Desktop device without detectable OS | 10 |
| Unknown device vendor | 10 |
| Unknown browser version | 10 |
| Unknown device model | 5 |

**4. Locale Map Verification** — compares the `Accept-Language` header against the IP's geolocation country. A browser claiming `fr-FR` language from an IP geolocated to South Korea is suspicious. Missing or malformed `Accept-Language` headers score 20 points. A confirmed mismatch between language and geo scores an additional 20 points.

**5. Known Threats (FireHOL)** — queries all five FireHOL MMDB files against the request IP. Each tier scores independently, so an IP appearing on multiple lists accumulates points from each.

| FireHOL tier | Penalty |
|---|---|
| Anonymity network (Tor, VPN, I2P) | 20 |
| L1 — critical current threats | 40 |
| L2 — attacks in last 48 hours | 30 |
| L3 — attacks in last 30 days | 20 |
| L4 — aggressive tracking | 10 |

**6. ASN Classification** — queries `asn.mmdb` to determine the Autonomous System the IP belongs to. Hosting and datacenter ASNs score 20 points. An ASN with unusually low visibility (few routes announced, below 15% of expected) scores an additional 10 points. The combination of hosting classification and low visibility scores a further 20 — this pattern is characteristic of freshly provisioned bot infrastructure.

**7. Tor Node Analysis** — queries `tor.mmdb` to classify the specific role of any Tor node. Different node types carry different penalties because they represent different risk profiles.

| Tor node type | Penalty |
|---|---|
| Active running node | 15 |
| Exit node (base) | 20 |
| Exit node (exit probability multiplier, up to +30) | dynamic |
| Web-capable exit node | 15 |
| Guard node | 10 |
| Bad exit (flagged by Tor directory) | 40 |
| Obsolete version | 10 |

A high-probability exit node that is also flagged as a bad exit and running an obsolete version can accumulate 90 points from Tor analysis alone — enough to ban when combined with even minor signals from other checkers.

**8. Timezone Consistency** — compares the `Timezone` request header against the timezone inferred from the IP's geolocation. A browser reporting a Central European timezone from an IP geolocated to Hong Kong scores 20 points.

**9. Honeypot** — checks the request path against a configurable list of trap URLs. Any request to a honeypot path scores an immediate ban. Legitimate users never visit URLs that are not linked anywhere in the application. Only crawlers following harvested or guessed paths hit them.

**10. Known Bad IPs** — queries optional `banned.mmdb` and `highRisk.mmdb` files you maintain independently. Previously banned IPs score an instant ban. High-risk IPs score 30 points. This checker enables you to carry forward enforcement decisions across restarts and import external blocklists.

### Phase Two: The Heavy Checkers

The heavy phase runs only if the cheap phase did not trigger a ban. These seven checks require async operations — cache reads, timing calculations, database queries, and header analysis. They are deferred to the second phase because they are more expensive.

**11. Behavior Rate Verification** — counts requests from this `canary_id` within a sliding window (default: 60 seconds, threshold: 30 requests). Exceeding the threshold scores 60 points. Unlike a simple IP-based rate limiter, this checker tracks per-session request rates. A bot that uses many IPs but reuses the same session cookie still triggers it.

**12. Proxy, ISP, and Cookie Verification** — combines several signals into a single checker.

| Signal | Penalty |
|---|---|
| Missing `canary_id` cookie | 80 |
| Proxy detected (from `proxy.mmdb`) | 40 |
| Multi-source proxy confirmation (2-3 sources) | +10 |
| Multi-source proxy confirmation (4+ sources) | +20 |
| Hosting provider detected | 50 |
| Unknown ISP | 10 |
| Unknown ORG | 10 |

The `canary_id` cookie check is the single highest-penalty individual signal in the pipeline at 80 points. Any request that does not carry a cookie is one triggering event away from a ban. This matters because the cookie is set on the very first request — a missing cookie on a subsequent request means either the client is rejecting cookies (a strong bot signal) or the request is coming from a tool that does not preserve session state.

**13. Session Coherence** — uses the `canary_id` to retrieve the session's last known path from the session cache, then validates the incoming request's `Referer` header.

| Signal | Penalty |
|---|---|
| Missing `Referer` on a same-origin request (`Sec-Fetch-Site: same-origin`) | 20 |
| `Referer` domain does not match the application domain | 30 |
| `Referer` path does not match the recorded last path | 10 |

Real browsers send a `Referer` header when navigating within the same origin. Tools and scrapers that issue requests directly do not. A bot that correctly spoofs headers but does not correctly maintain session path history fails this check across multiple requests.

**14. Velocity Fingerprinting** — collects timestamps for the last 10 requests from this session (minimum 5 required to evaluate) and computes the coefficient of variation (CV) of the inter-request intervals. The CV measures the relative variability of a set of values — a CV near zero means all intervals are nearly identical, which is characteristic of programmatic request scheduling.

```
CV = standard deviation / mean

CV < 0.1 → timing too regular → penalty: 40
```

Human browsing intervals are naturally irregular. Page load times, reading time, and click latency all vary. A bot that fires requests on a fixed timer — even a slow one — produces a CV far below the 0.1 threshold.

**15. User-Agent and Header Analysis** — extends the cheap-phase fingerprint check with deeper inspection.

| Signal | Penalty |
|---|---|
| Headless browser detected (Puppeteer, Selenium, Playwright, PhantomJS) | 100 |
| User-agent shorter than 10 characters | 80 |
| TLS fingerprint mismatch (JA4 check) | 60 |
| Header anomaly score too high | variable |
| Path traversal attempt detected | variable |
| XSS scripting attempt detected | variable |

The TLS fingerprint check queries `ja4.mdb` to compare the client's TLS handshake fingerprint against the user-agent it claims. A request claiming to be Chrome 120 but presenting the TLS fingerprint of a Node.js `https` client scores 60 points immediately. This is one of the hardest signals for bots to spoof because it requires intercepting and rewriting the TLS layer.

**16. Geolocation Validation** — penalizes missing geolocation data across nine dimensions: country, region, city, latitude/longitude, timezone, subregion, phone prefix, district, and continent. Each missing dimension scores 10 points. A request from an IP with no geolocation coverage can accumulate up to 90 points from this checker alone, making it trivially over the ban threshold when combined with any other signal. The checker also supports a configurable banned-country list.

**17. Known Bad User-Agents** — queries `useragent.mdb` against the full user-agent string. The LMDB database stores patterns compiled from community-maintained lists of bot and scraper signatures, each rated by severity.

| Severity | Penalty |
|---|---|
| Critical | 100 |
| High | 80 |
| Medium | 30 |
| Low | 10 |

---

## The Canary Cookie: Bridging Sessions

The `canary_id` cookie is issued by the `canaryCookieChecker` middleware on the very first request from any browser. Its value is a 64-character hex string generated from 32 cryptographically random bytes.

```ts
randomBytes(32).toString('hex')
// Example: "a3f8e2c1d4b7a90f..."  (64 hex characters)
```

The cookie itself is opaque — it carries no embedded data and cannot be decoded. All the meaningful state lives server-side, keyed on the cookie value.

### Cookie Attributes

```
name:      canary_id
httpOnly:  true
sameSite:  lax
secure:    true
path:      /
maxAge:    7,776,000,000 ms  (90 days)
```

The `httpOnly` attribute prevents JavaScript from reading the cookie, blocking the class of attacks where a page script exfiltrates the cookie and reuses it from a different client. The 90-day maxAge matches the outer boundary for legitimate long-running sessions.

### What the Server Stores

When Bot Detector issues a `canary_id`, it begins building a persistent record keyed on that value. This record accumulates across every subsequent request.

**Visitor record (database, persistent):**

```ts
{
  visitorId: UUID,
  cookie: canary_id,
  userAgent: string,
  ipAddress: string,
  device_type: string,
  browser: string,
  is_bot: boolean,
  first_seen: timestamp,
  last_seen: timestamp,
  request_count: number,
  deviceVendor: string,
  deviceModel: string,
  browserType: string,
  browserVersion: string,
  os: string,
  activity_score: number,
  country: string,
  region: string,
  city: string,
  timezone: string,
  // ...additional geolocation fields
}
```

**In-memory caches (fast lookup per request):**

| Cache | Key | What it holds |
|---|---|---|
| `visitorCache` | `canary_id` | `{ banned, visitor_id }` — fast ban lookup |
| `sessionCache` | `canary_id` | `{ lastPath }` — session coherence tracking |
| `rateCache` | `canary_id` | `{ score, timestamp, request_count }` — behavioral rate |
| `timingCache` | `canary_id` | Array of last 10 request timestamps — velocity fingerprint |
| `reputationCache` | `canary_id` | `{ isBot, score }` — reputation healer state |
| `dnsCache` | IP | `{ ip, trustedBot }` — verified crawler result |

The split between the persistent database record and the in-memory caches is intentional. The database record survives restarts and is queryable for analytics. The in-memory caches are ephemeral but fast — they hold exactly the data the pipeline needs per request, without deserializing a full database row.

### The Canary Cookie in the IAM Service

The IAM service runs Bot Detector as part of its own middleware chain. Every request to the IAM service — login, logout, token rotation, MFA — passes through the same 17-checker pipeline before reaching any authentication logic.

When Bot Detector passes a request through, the IAM service reads the `canary_id` cookie and stores it alongside the refresh token family for that session. The `strangeThings()` anomaly detection function, which runs during every token rotation attempt, includes a `canary_id` binding check as one of its nine sequential verifications.

If the `canary_id` on a rotation request does not match the one recorded when the session was originally created, the anomaly detector triggers. Depending on the severity, it either sends an MFA challenge to the user's email or revokes the session entirely. This means an attacker who steals a valid refresh token but makes the rotation request from a different device — one with a different `canary_id` — cannot complete the rotation without also accessing the user's email.

---

## Walking Through a Bot Request

To make the pipeline concrete, here is what happens when a credential-stuffing bot attempts a login.

The bot sends a `POST /auth/user/login` request with a valid email and password combination. It uses a Python `requests` library with a spoofed user-agent string, from a residential proxy pool. It sends one request every 4 seconds on a fixed timer.

**Cheap phase results:**

- IP Validation: passes (valid IPv4).
- Good/Bad Bot: IP is not on the good-bot list. No instant ban.
- Browser and Device Fingerprint: The user-agent parses as Chrome, but the library headers are subtly wrong — no `sec-ch-ua` header family, no `sec-fetch-*` headers. Unknown browser type: +10. Impossible header combination: +30. Running total: 40.
- Locale Map: The `Accept-Language` header is missing. +20. Running total: 60.
- Known Threats: The residential proxy IP happens to appear on the FireHOL L3 list (a 30-day tracked threat). +20. Running total: 80.
- ASN Classification: The proxy's ASN is classified as hosting with low visibility. +20 + +10. Running total exceeds 100.

**The pipeline stops at the cheap phase.** The request receives a 403 response before the login handler runs. No database query for the user record. No password check. No rate limiter on the login endpoint needs to absorb the request.

Now consider a more sophisticated bot — one that uses a real browser, a real residential IP, and carefully spoofs all headers. The cheap phase may score only 10-20 points.

**Heavy phase results:**

- Behavior Rate: The bot fires at exactly 4-second intervals. After 5 requests, the velocity fingerprint computes CV = 0.02. +40. Running total: 50-60.
- Session Coherence: The bot navigates directly to `/auth/user/login` without going through the home page first. The `Referer` header is absent on what looks like same-origin navigation. +20. Running total: 70-80.
- User-Agent and Header Analysis: The JA4 TLS fingerprint matches Python's `urllib3` library, not Chrome. +60. Running total: 130+.

**The pipeline stops at the heavy phase.** Even a well-configured bot that passes the cheap phase reveals itself through timing regularity, navigation patterns, and TLS fingerprinting.

---

## Configuration

A realistic Bot Detector configuration that enables the full pipeline looks like this:

```ts
import { configuration } from 'bot-detector'

await configuration({
  store: {
    main: { driver: 'sqlite', name: './bot-detector.db' }
  },

  banScore: 100,
  maxScore: 100,
  restoredReputationPoints: 10,
  setNewComputedScore: false,

  whiteList: ['203.0.113.0/24'],

  checkers: {
    enableIpChecks: { enable: true, penalties: 10 },

    enableGoodBotsChecks: {
      enable: true,
      banUnlistedBots: true,
      penalties: 100
    },

    enableBrowserAndDeviceChecks: { enable: true },

    localeMapsCheck: { enable: true },

    enableKnownThreatsDetections: {
      enable: true,
      penalties: {
        anonymityNetwork: 20,
        fireholL1: 40,
        fireholL2: 30,
        fireholL3: 20,
        fireholL4: 10
      }
    },

    enableAsnClassification: { enable: true },

    enableTorAnalysis: { enable: true },

    enableTimezoneConsistency: { enable: true },

    honeypot: {
      enable: true,
      paths: ['/admin', '/.env', '/wp-login.php', '/xmlrpc.php']
    },

    enableKnownBadIpsCheck: { enable: true },

    enableBehaviorRateCheck: {
      enable: true,
      behavioral_window: 60_000,
      behavioral_threshold: 30,
      penalties: 60
    },

    enableProxyIspCookiesChecks: { enable: true },

    enableSessionCoherence: { enable: true },

    enableVelocityFingerprint: {
      enable: true,
      cvThreshold: 0.1
    },

    enableUaAndHeaderChecks: { enable: true },

    enableGeoChecks: {
      enable: true,
      bannedCountries: []
    },

    knownBadUserAgents: { enable: true }
  }
})
```

::tip
Start with the cheap-phase checkers at conservative penalty values and raise them after observing traffic patterns. The FireHOL L4 level and ASN low-visibility penalties are the most likely to produce false positives on legitimate traffic from cloud-heavy regions.
::

---

## Extending the Pipeline: Custom Checkers

Every built-in checker follows the same interface, and you can add your own with the exact same mechanism. The pipeline does not distinguish between built-in and custom checkers at runtime — they share the same scoring accumulation, the same short-circuit logic, and the same `ValidationContext`.

### The `IBotChecker` Interface

A checker is a class that implements `IBotChecker`. It declares which phase it belongs to, a condition that enables or disables it, and a `run` method that returns a numeric score and an array of reason codes.

```ts
interface IBotChecker<Code, TCustom = Record<string, never>> {
  name: string;
  phase: 'cheap' | 'heavy';
  isEnabled(config: BotDetectorConfig): boolean;
  run(ctx: ValidationContext<TCustom>, config: BotDetectorConfig):
    | Promise<{ score: number; reasons: Code[] }>
    | { score: number; reasons: Code[] };
}
```

The `run` method can be synchronous or async. Phase assignment is the only routing decision you make — everything else is handled by the pipeline.

### What the Pipeline Gives You

Before your `run` method executes, the pipeline has already resolved every expensive lookup. All of this is available on `ctx` at zero cost:

| Field | Contents |
|---|---|
| `ctx.req` | Full Express request (headers, path, cookies, method) |
| `ctx.ipAddress` | Resolved client IP |
| `ctx.cookie` | `canary_id` value, or `undefined` on first request |
| `ctx.geoData` | Merged country, city, ASN, and proxy data |
| `ctx.tor` | Tor relay classification from `tor.mmdb` |
| `ctx.bgp` | ASN routing data: `asn_id`, `asn_name`, `classification`, `hits` |
| `ctx.threatLevel` | Highest FireHOL tier matched (`1`–`4`), or `null` |
| `ctx.anon` | `true` if IP is in the anonymity network database |
| `ctx.parsedUA` | Parsed user-agent: browser, OS, device, `browserType`, bot flags |
| `ctx.proxy` | `{ isProxy, proxyType }` from proxy MMDB |
| `ctx.custom` | Your own per-request data, populated by `buildCustomContext` |

`ctx.bgp.classification` is worth highlighting. The value `"Content"` means the ASN is classified as a hosting or CDN network. `"Eyeballs"` means residential or business internet. This single field lets a custom checker apply completely different logic for datacenter traffic versus consumer traffic without any additional lookup.

### A Minimal Cheap Checker

The example below penalises requests from a datacenter ASN that carry no `Accept-Language` header — a pattern common in automated clients that partially spoof browser headers but miss the locale details.

```ts [datacenter-locale-checker.ts]
import { CheckerRegistry } from '@riavzon/bot-detector';
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

type Code = 'DATACENTER_NO_LOCALE' | 'BAD_BOT_DETECTED';

class DatacenterLocaleChecker implements IBotChecker<Code> {
  name = 'DatacenterLocaleChecker';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig): boolean {
    return true;
  }

  run(ctx: ValidationContext, _config: BotDetectorConfig) {
    const reasons: Code[] = [];
    let score = 0;

    const isHosting = ctx.bgp.classification === 'Content';
    const hasLocale = Boolean(ctx.req.get('Accept-Language'));

    if (isHosting && !hasLocale) {
      score += 25;
      reasons.push('DATACENTER_NO_LOCALE');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new DatacenterLocaleChecker());
```

Registration happens at module load time. A side-effect import in your server entry point is enough to activate the checker. Import order controls execution order within each phase.

```ts [server.ts]
import { defineConfiguration, detectBots } from '@riavzon/bot-detector';
import './datacenter-locale-checker.js'; // registers on import

await defineConfiguration({ /* ... */ });
app.use(detectBots());
```

### Passing Application Context Into Checkers

The `buildCustomContext` function runs once per request before any checker executes. It receives the raw Express request and returns the `ctx.custom` object. Passing the generic type through to `IBotChecker` and `ValidationContext` gives full IntelliSense on `ctx.custom` inside `run`.

```ts [server.ts]
interface MyContext {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  isInternal: boolean;
}

app.use(
  detectBots<MyContext>((req) => ({
    userId:     req.user?.id   ?? 'anonymous',
    plan:       req.user?.plan ?? 'free',
    isInternal: req.ip === '127.0.0.1',
  }))
);
```

```ts [plan-abuse-checker.ts]
import type { IBotChecker, ValidationContext, BotDetectorConfig, BanReasonCode } from '@riavzon/bot-detector';
import type { MyContext } from './myContext.js';

class PlanAbuseChecker implements IBotChecker<BanReasonCode, MyContext> {
  name = 'PlanAbuseChecker';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig) { return true; }

  run(ctx: ValidationContext<MyContext>, _config: BotDetectorConfig) {
    if (ctx.custom.isInternal) return { score: 0, reasons: [] };

    if (ctx.custom.plan === 'free' && ctx.geoData.proxy) {
      return { score: 20, reasons: ['PROXY_DETECTED'] };
    }

    return { score: 0, reasons: [] };
  }
}
```

This pattern lets you apply business logic — plan tier, user role, internal traffic bypass — inside the same scoring pipeline that handles IP reputation and behavioral analysis, without any special wiring.

### Triggering an Instant Ban

Returning `'BAD_BOT_DETECTED'` in the reasons array causes the pipeline to throw `BadBotDetected` immediately. No further checkers run, and the reputation healer does not execute. The visitor is banned without waiting for score accumulation.

```ts
run(ctx: ValidationContext, _config: BotDetectorConfig) {
  if (isDefinitelyABot(ctx)) {
    return { score: 0, reasons: ['BAD_BOT_DETECTED'] };
  }
  return { score: 0, reasons: [] };
}
```

The mirror is `'GOOD_BOT_IDENTIFIED'`, which whitelists the request instantly. The built-in good-bot DNS verifier uses this same mechanism.

### Heavy Checkers and the Built-In Storage

Checkers that require I/O — database queries, external API calls, cache reads — declare `phase: 'heavy'`. The heavy phase only runs when the cheap phase score stays below `banScore`. Call `getStorage()` to access the same storage instance Bot Detector uses internally, keeping all cache I/O in one place.

```ts [my-async-checker.ts]
import { getStorage, CheckerRegistry } from '@riavzon/bot-detector';
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

class MyAsyncChecker implements IBotChecker<'MY_REASON'> {
  name = 'MyAsyncChecker';
  phase = 'heavy' as const;

  isEnabled(_config: BotDetectorConfig): boolean { return true; }

  async run(ctx: ValidationContext, _config: BotDetectorConfig) {
    if (!ctx.cookie) return { score: 0, reasons: [] };

    const storage = getStorage();
    const cacheKey = `custom:${ctx.cookie}`;

    const cached = await storage.getItem<number>(cacheKey);
    if (cached !== null) {
      return { score: cached, reasons: cached > 0 ? ['MY_REASON' as const] : [] };
    }

    const result = await myDb.query('SELECT ...', [ctx.ipAddress]);
    const score = result.isSuspicious ? 30 : 0;

    await storage.setItem(cacheKey, score, { ttl: 300 });
    return { score, reasons: score > 0 ? ['MY_REASON' as const] : [] };
  }
}

CheckerRegistry.register(new MyAsyncChecker());
```

::tip
Use a namespaced key prefix for your cache entries (for example `custom:`) to avoid collisions with the built-in cache keys that share the same storage instance.
::

---

## Automatic Threat Compilation: The Generator

The `Known Bad IPs` checker — checker 10 in the cheap phase — queries two optional MMDB files: `banned.mmdb` and `highRisk.mmdb`. These files do not come from Shield Base. Bot Detector generates them itself from its own accumulated traffic history.

### What Gets Compiled

Running `bot-detector generate` reads two tables from Bot Detector's database and compiles each into an MMDB file. Both compilations run in parallel.

**`banned.mmdb`** — every row in the `banned` table with a non-null `ip_address` gets compiled into this file. Each entry stores the IP, score, country, user-agent, and reason codes from the original ban event. On subsequent visits, the Known Bad IPs checker matches the IP in microseconds in the cheap phase and issues `BAD_BOT_DETECTED` immediately — the full 17-checker pipeline never runs for a confirmed repeat offender.

**`highRisk.mmdb`** — every row in the `visitors` table where `suspicious_activity_score` is at or above `generator.scoreThreshold` (default `70`) is compiled into this file. These are visitors who accumulated significant suspicion scores but were never pushed over `banScore`. On their next visit, they receive the `highRiskPenalty` (default `30` points) in the cheap phase, meaning far less effort from other checkers is needed to reach a ban.

```ts
generator: {
  scoreThreshold: 70,   // minimum score to include in highRisk.mmdb
  deleteAfterBuild: false,  // if true, removes compiled rows from DB after build
  mmdbctlPath: 'mmdbctl',   // path to mmdbctl binary
  generateTypes: false,     // emit TypeScript type definitions alongside MMDB files
}
```

The `scoreThreshold` tradeoff is worth understanding. Lowering it to `40` catches visitors with moderate suspicious history but risks false positives. Keeping it at `70` or higher limits the file to visitors with strong behavioral evidence.

| Threshold | Effect |
|---|---|
| `40` | Broader net — includes visitors with moderate accumulated scores |
| `70` (default) | Balanced — strong suspicious history required |
| `90` | Conservative — only the most suspicious non-banned visitors included |

### Hot Reload

Both MMDB files are opened with `watchForUpdates: true`. When a new file is written to disk after a generation run, the MMDB reader reloads it automatically within seconds — no application restart, no traffic interruption. You can run generation against a live service and the updated databases take effect immediately.

### Running Generation

::code-group

```bash [pnpm]
pnpm dlx @riavzon/bot-detector generate
```

```bash [yarn]
yarn dlx @riavzon/bot-detector generate
```

```bash [npm]
npx @riavzon/bot-detector generate
```

```bash [bun]
bunx @riavzon/bot-detector generate
```

::

For programmatic use — for example, triggering generation immediately after a bulk ban operation — call `runGeneration()` directly:

```ts [admin-script.ts]
import { updateBannedIP, runGeneration } from '@riavzon/bot-detector';
import type { BannedInfo } from '@riavzon/bot-detector';

for (const ip of badIps) {
  const info: BannedInfo = { score: 100, reasons: ['PREVIOUSLY_BANNED_IP'] };
  await updateBannedIP('', ip, 'us', '', info);
}

// Compile updated MMDB files immediately so the next request from these IPs
// hits the cheap-phase known-bad-IPs check rather than the full pipeline.
await runGeneration();
```

### Scheduling Generation

The right generation frequency depends on traffic volume. A nightly run is a reasonable default. For higher-traffic applications where bans accumulate quickly, hourly generation keeps the banned MMDB current and prevents repeat offenders from absorbing pipeline capacity.

```cron [crontab]
# Nightly at 2:00 AM
0 2 * * * cd /app && npx bot-detector generate >> /var/log/bot-detector-generate.log 2>&1

# Hourly for high-traffic deployments
0 * * * * cd /app && npx bot-detector generate >> /var/log/bot-detector-generate.log 2>&1
```

The generate command emits structured log lines including the entry count for each compiled database. Monitoring this output over time makes it easy to detect when ban volume spikes — a sudden increase in `banned.mmdb` entries typically indicates a coordinated attack campaign starting.

---

## Summary

Each of the three layers closes a gap that the others cannot. Shield Base provides static intelligence — historical threat reputation, network classification, and behavioral pattern databases — that no runtime analysis can replicate. Bot Detector performs dynamic behavioral analysis — velocity, session coherence, timing regularity — that static blocklists cannot catch. The canary cookie ties both together across sessions, making it impossible to reset accumulated behavioral signals simply by rotating IPs or changing headers.

A bot that evades Shield Base's IP reputation checks still faces 17 behavioral checkers. A bot that passes all 17 checkers on a single request still accumulates a session history that degrades its score over time. A bot that steals an authenticated session still cannot complete token rotation without matching the canary cookie fingerprint that was established on the original device.

The layered approach trades complexity for resilience. Each layer is effective in isolation. Together, they make the cost of a successful bot attack high enough that most attackers move on to easier targets.

::read-more{to="/docs/bot-detection"}
Read the full Bot Detector reference
::

::read-more{to="/docs/shield-base"}
Read the full Shield Base reference for database compilation options
::
