---
title: Checkers
description: Overview of all 17 detection checkers, their detection phases, and what signals they evaluate.
icon: i-lucide-shield-check
---

The bot detector pipeline runs 17 independent checkers against every incoming request. Each checker evaluates a specific signal, assigns a numeric score, and attaches reason codes when it fires. The middleware accumulates scores across all checkers and bans the visitor when the total reaches `banScore`.

Checkers run in two phases. The **cheap phase** runs first and consists of synchronous, in-memory lookups against pre-loaded MMDB databases. If the cheap-phase score reaches `banScore`, the pipeline stops. The **heavy phase** only runs when the cheap phase does not ban the visitor. It includes behavioral checks and async database or cache operations.

All checkers are enabled by default. Each can be disabled independently by setting `enable: false`, or tuned by adjusting its penalty values.

--- 

## Cheap Phase Checkers

These checkers run on every request before any database I/O.

| Checker | Config key | Signal |
| --- | --- | --- |
| [IP Validation](./ip-validation) | `enableIpChecks` | Malformed or invalid client IP |
| [Good / Bad Bot Verification](./good-bots) | `enableGoodBotsChecks` | Legitimate vs. malicious crawler identity |
| [Browser & Device Fingerprint](./browser-device) | `enableBrowserAndDeviceChecks` | Impossible UA combinations, CLI tools, IE |
| [Locale Map](./locale-map) | `localeMapsCheck` | Accept-Language / geolocation mismatch |
| [Known Threats (FireHOL)](./known-threats) | `enableKnownThreatsDetections` | IPs in threat intelligence feeds |
| [ASN Classification](./asn-classification) | `enableAsnClassification` | Hosting/datacenter ASN, low-visibility network |
| [Tor Analysis](./tor-analysis) | `enableTorAnalysis` | Tor relay, exit node, guard node |
| [Timezone Consistency](./timezone-consistency) | `enableTimezoneConsistency` | Timezone header / geolocation mismatch |
| [Honeypot](./honeypot) | `honeypot` | Request to configured trap paths |
| [Known Bad IPs](./known-bad-ips) | `enableKnownBadIpsCheck` | Previously banned or high-risk IP |

---

## Heavy Phase Checkers

These checkers run only when the cheap phase score stays below `banScore`.

| Checker | Config key | Signal |
| --- | --- | --- |
| [Behavior Rate](./behavior-rate) | `enableBehaviorRateCheck` | Too many requests in a sliding time window |
| [Proxy / ISP / Cookie](./proxy-isp-cookies) | `enableProxyIspCookiesChecks` | Proxy IP, hosting network, missing canary cookie |
| [Session Coherence](./session-coherence) | `enableSessionCoherence` | Missing or broken Referer header sequence |
| [Velocity Fingerprint](./velocity-fingerprint) | `enableVelocityFingerprint` | Unnaturally regular inter-request timing |
| [UA & Header Analysis](./ua-header) | `enableUaAndHeaderChecks` | Headless browser, TLS mismatch, header anomalies |
| [Geolocation](./geolocation) | `enableGeoChecks` | Banned country, incomplete geo data |
| [Known Bad User-Agents](./known-bad-ua) | `knownBadUserAgents` | UA matched against known scraper/scanner patterns |

---

## Disabling a Checker

Every checker follows the same discriminated union shape. Set `enable: false` to turn it off entirely.

```ts [server.ts]
await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
  checkers: {
    enableTorAnalysis: { enable: false },
    enableGeoChecks: { enable: false },
  },
})
```

::tip
Disabling a checker removes it from the pipeline entirely. The remaining checkers still run and still accumulate score. Only disable checkers that consistently produce false positives for your traffic.
::

---

## Reason Codes

Every checker attaches one or more reason codes to the detection result when it fires. These codes appear in the visitor record stored in the database. The following codes cause immediate action regardless of the current score:

- `BAD_BOT_DETECTED`: stops the pipeline and bans the visitor instantly.
- `GOOD_BOT_IDENTIFIED`: stops the pipeline and allows the visitor through.

All other reason codes contribute their configured penalty to the cumulative score. See each checker page for the full list of codes it can produce.
