---
title: MFA
description: How the module detects MFA challenges from the IAM service, verifies magic links and codes, rotates tokens on success, and supports custom step-up flows for sensitive actions.
icon: i-lucide-shield-check
---

The module supports email-based Multi-Factor Authentication as a secondary verification layer. MFA is not something you enable in the gateway: the [IAM service](/docs/iam/essentials/anomalies) decides when a session requires additional proof based on anomaly detection. The gateway detects the `202` response, surfaces it to your frontend, and provides the handlers and composables needed to complete the verification.

Two paradigms are available:

1. **Built-in MFA**: triggered automatically by the IAM service during token rotation when it detects anomalies such as a new device, idle session, IP range change, or elevated risk score. The user receives an email with a magic link and a 7-digit code. The gateway ships ready-to-use routes that verify the link and code without any custom server code.

2. **Custom MFA**: initiated by your application code for sensitive actions like password changes, email updates, or account deletion. You call `askForMfaFlow` with a reason and a cryptographic buffer, the IAM service sends the verification email, and you wrap your action handler with `defineMfaCodeVerifierHandler` or `defineVerifiedMagicLinkGetHandler`.

---

## How MFA is triggered

During [token rotation](/docs/auth-h3client/essentials/session#token-rotation), the gateway calls the IAM [`/auth/user/refresh-session`](/docs/iam/essentials/tokens#token-rotation) endpoint. When the IAM service runs its [anomaly detection](/docs/iam/essentials/anomalies) checks and determines the session needs verification, it returns HTTP `202` with `{ mfa: true, message: "..." }` instead of rotating the tokens.

The gateway propagates this response through three layers:

| Detection point | What happens |
|---|---|
| `ensureValidCredentials` | Returns `{ text: 'MFA required', message }` with status 202 |
| `getCachedUserData` | Returns `{ type: 'ERROR', reason: 'MFA', status: 202 }` |
| `defineAuthenticatedEventHandler` | Returns `{ mfaRequired: 'MFA required' }` to the client |

On the client side, you should implement a method to detect that `202` status or `{ mfaRequired: 'MFA required' }` response, and render a proper ui for the user.

If you use the Nuxt module [`useAuthData`](/docs/auth-h3client/client/use-auth-data) handles that for you, and sets `mfaRequired: true` on the reactive auth state. Your frontend should checks this field and redirects to the verification page.

---

## Verification flow

Regardless of whether MFA was triggered by the built-in flow or a custom flow, verification follows the same pattern:

1. The user receives an email containing a magic link and a 7-digit numeric code.
2. The magic link points to a bounce URL on the gateway, which redirects to your frontend verification page with `token`, `random`, `reason`, and `visitor` query parameters.
3. The frontend calls `useMagicLink()` or the appropriate path to validate the link parameters against the server.
4. The user enters the 7-digit code in your UI and submits it. The server verifies the code with the IAM service, rotates both tokens, and returns success.

---

## Token rotation on success

Successful MFA verification always triggers a full token rotation. The IAM service:

- Marks the old refresh token as consumed
- Generates a new access token and refresh token pair
- Updates `users.last_mfa_at` to record when MFA was last completed
- Returns the new tokens in the response

The gateway applies the rotation result by setting the `__Secure-a`, `a-iat`, and `session` cookies on the response. This invalidates the pre-MFA session and ensures subsequent requests use fresh credentials.

---

## Session binding

MFA verification is bound to the existing session through three cookies:

| Cookie | Role |
|---|---|
| `canary_id` | Ties the verification to the device fingerprint tracked by the [bot detector](/docs/bot-detection) |
| `session` | Identifies the refresh token that initiated the flow |
| `__Secure-a` | Provides the access token for the signed request to the IAM service |

If any of these cookies are missing, the gateway rejects the verification request with HTTP 401.

---

## Rate limiting

The IAM service applies rate limits at multiple levels during MFA flows: per IP, per user ID, per session, and per JTI. When the limit is exceeded, the gateway receives HTTP 429 and forwards the `Retry-After` header to the client. See [IAM Rate Limiting](/docs/iam/essentials/rate-limiting) for the specific limits.

---

## Built-in flows

The module ships ready-to-use server routes for the three standard verification flows. Each flow registers its own GET and POST handlers through `magicLinksRouter`:

| Flow | Trigger | Pages |
|---|---|---|
| [Built-in MFA](/docs/auth-h3client/mfa/built-in-flow) | Anomaly detection during token rotation | Verify magic link, submit code |
| [Password Reset](/docs/auth-h3client/mfa/password-reset) | User requests password reset | Initiate, verify link, submit new password |
| [Email Change](/docs/auth-h3client/mfa/email-change) | User requests email change | Initiate, verify link, submit new email |

## Custom flows

For sensitive actions beyond the built-in flows, you create your own endpoints using the MFA utilities:

| Utility | Purpose |
|---|---|
| [`askForMfaFlow`](/docs/auth-h3client/mfa/custom-flow#initiating-the-flow) | Sends verification email for a custom reason |
| [`defineVerifiedMagicLinkGetHandler`](/docs/auth-h3client/mfa/custom-flow#magic-link-verification) | Wraps a GET handler with magic link verification |
| [`defineMfaCodeVerifierHandler`](/docs/auth-h3client/mfa/custom-flow#code-verification) | Wraps a POST handler with code verification and token rotation |

See [Custom MFA Flow](/docs/auth-h3client/mfa/custom-flow) for the full implementation guide.

## Client-side integration

The `useMagicLink` composable handles the frontend verification page. It parses the URL query parameters, routes to the correct server endpoint based on the `reason` field, and returns the verified data for your UI to render the appropriate form. See [Client-Side MFA](/docs/auth-h3client/mfa/client-side) for usage details.
