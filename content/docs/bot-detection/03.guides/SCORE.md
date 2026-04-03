---
title: Score Modes and Reputation Healing
description: How setNewComputedScore and restoredReputationPoints interact to control how visitor risk scores evolve over time.
icon: i-lucide-chart-line
---

Every non-banned visitor carries a `suspicious_activity_score` in the `visitors` table. Two processes write to this score on every request: the **detector**, which computes a fresh risk score by running all checkers, and the **reputation healer**, which decrements the stored score after each clean request. The `setNewComputedScore` flag controls how these two processes cooperate.

---

## The Two Actors

**The detector** runs the 17-checker pipeline and produces a `botScore` for the current request. What it does with that score afterward depends on `setNewComputedScore`.

**The reputation healer** runs on every non-banned request. It reads the visitor's current score from cache (or from the database on a cache miss), then decrements it by `restoredReputationPoints` and writes the lower value back to cache and the database queue. This is the mechanism by which legitimate visitors with an accidentally elevated score recover over time.

Both actors run on every request. Their interaction is what `setNewComputedScore` controls.

---

## `setNewComputedScore: false` (default)

In this mode the detector writes its computed score to the database and cache **only on the first request** for a given canary cookie (or when the cache entry is missing or zero). After that, the healer owns the score and decrements it each request until it reaches zero or the cache expires.

The score only decreases between cache expirations. When the cache expires, the next request triggers a fresh detection cycle and the score is re-established from whatever the current pipeline computes.

**Example** with `banScore: 10`, `restoredReputationPoints: 1`:

| Request | Detector computes | Cache before healer | Healer writes | DB score |
| --- | --- | --- | --- | --- |
| R1 | 8 | no cache | 7 | 7 |
| R2 | 8 | 7 (hit) | 6 | 6 |
| R3 | 8 | 6 (hit) | 5 | 5 |
| R4 | 8 | 5 (hit) | 4 | 4 |

The detector recomputes 8 on every request but does not overwrite the cache once a non-zero entry exists. The score decays toward zero.

**When to use:** Most applications. Visitors who trigger a few cheap-phase signals due to a VPN or unusual network conditions gradually recover without requiring manual intervention.

---

## `setNewComputedScore: true`

In this mode the detector writes its computed score on **every request**, overwriting whatever the healer wrote on the previous request. The score oscillates: the detector pushes it up to the computed value, then the healer immediately decrements it by one heal step, then the detector pushes it back up on the next request.

**Example** with the same settings:

| Request | Detector computes | Detector writes | Healer writes | DB score |
| --- | --- | --- | --- | --- |
| R1 | 8 | 8 | 7 | 7 |
| R2 | 8 | 8 | 7 | 7 |
| R3 | 8 | 8 | 7 | 7 |

The DB score after each full request cycle is always `computed - restoredReputationPoints`, regardless of how many requests the visitor makes. The score never truly heals.

**When to use:** When you want the `visitors` table to always reflect the visitor's current computed risk, not a decayed snapshot. This is useful when you query the database for monitoring or review and need the scores to represent the live pipeline output rather than historical state.

::warning
With `setNewComputedScore: true`, a visitor whose network conditions consistently produce a non-zero score will never reach zero and can accumulate enough score to eventually be banned, even if their behavior is otherwise legitimate. Use this mode only when current-state visibility in the database is more important than natural score recovery.
::

---

## `restoredReputationPoints`

This setting controls how much score the healer subtracts per clean request. It applies in both modes.

```ts [server.ts]
await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
  setNewComputedScore: false,
  restoredReputationPoints: 10,
  banScore: 100,
})
```

With the defaults (`restoredReputationPoints: 10`, `banScore: 100`), a visitor at score `40` returns to zero after four clean requests.

Setting `restoredReputationPoints: 0` disables healing entirely. Scores accumulate permanently until you manually reset them with `updateIsBot`.

| Value | Effect |
| --- | --- |
| `0` | Healing disabled. Scores only increase. |
| `5` | Slow recovery. Useful when you want score history to persist longer. |
| `10` (default) | Moderate recovery. 10 clean requests recover from a full `banScore`. |
| `25` | Fast recovery. Suitable for environments with many false positives. |

---

## Configuration Reference

```ts [server.ts]
await defineConfiguration({
  store: { main: { driver: 'sqlite', name: './bot-detector.db' } },
  setNewComputedScore: false,      // default
  restoredReputationPoints: 10,    // default
  banScore: 100,                   // default
})
```

::field-group
::field{name="setNewComputedScore" type="boolean"}
When `false`, the detector writes its computed score only when no cache entry exists. The healer then owns the score and decrements it each request. When `true`, the detector overwrites the score on every request, causing the score to oscillate around the computed value. 

Default: `false`.
::

::field{name="restoredReputationPoints" type="number"}
Points subtracted from the visitor's stored score after each non-banned request. Set to `0` to disable healing. Default: `10`.
::
::

---

## Choosing a Mode

| Scenario | Recommended mode |
| --- | --- |
| Normal production traffic with occasional false positives | `false` - scores decay naturally |
| Dashboard or admin UI that needs live risk visibility | `true` - DB always shows current pipeline output |
| High false-positive environment (corporate proxies, VPNs) | `false` with higher `restoredReputationPoints` |
| Strict enforcement where score should never decay | `false` with `restoredReputationPoints: 0` |
