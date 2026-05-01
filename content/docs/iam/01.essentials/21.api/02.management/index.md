---
title: Manage Tokens
description: Learn how to rotate, revoke, update and restrict new ip's and privileges.
icon: i-lucide-check-circle
---

The IAM service provide a full life cycle to manage api keys, getting metadata or setting new privileges to a token.

The actions that are available are:

- Revocation - Revoking a token
- Rotation - Revoking the provided token and generating a new one
- Update IP - Updating the ip restriction list to remove and address or add new one for the [verification process](/docs/iam/essentials/api/verification)
- Privilege - Updating the privilege for a given token.
- Metadata - Fetches extensive audit logs.
- List - Getting a list of tokens metadata and counts for a given user

For the service users, the actions is behind a full authentication flow, each needs to succeeded before an action can be performed: 

 - `requireAccessToken` Requires the access token header to be present
 - `requireRefreshToken` Requires the refresh token to be present
 - `getFingerPrint` Gets the finger prints for MFA
 - `checkForActiveMfa` MFA cache
 - `protectRoute` Enforces authentication, and perform the 9 mfa checks,
 - `contentType('application/json')` Enforces `application/json`,
 - `express.json` To limit the body size to 1kb
 - `apiTokensController` The actions happens here

If the client is not authenticate, cannot be found, have an active MFA, the actions will fail, with the appropriate response.


For the library users you call the `privateActionManager` for all actions except from the List actions, to enforce the same security as the routes. You can also however call it's underlying methods directly for custom use cases.

::caution
No authentication is enforces in these actions when you use the library.
::

::warning
Never pass untrusted data to these actions.
::

---

## Library

### The `privateActionManager`

The `privateActionManager` acts as the high-level coordinator for all dashboard driven token operations. It serves as a security layer between the user’s intent and the cryptographic operations required to modify or rotate API keys.

Instead of the client interacting with raw, hashed tokens directly, the manager uses a *Public Identifier*, a non sensitive key, to locate the correct record and ensure the authenticated user actually owns the resource they are trying to modify.

### Signature

```ts
async function privateActionManager(
    userId: number,
    tokenId: number,
    publicIdentifier: string,
    name: string,
    options: ActionArgs,
): Promise<ActionManagerResult>
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `userId` | `number` | The ID of the authenticated user. |
| `tokenId` | `number` | The internal database ID of the token being managed. |
| `publicIdentifier` | `string` | The public key used to identify the token safely. |
| `name` | `string` | The friendly name assigned to the token. |
| `options` | `ActionArgs` | An object containing the `action` type and any associated payload. |

### Behavior

The manager performs a three-step process before executing any action to prevent unauthorized access:

* Checksum Validation: It first validates the publicIdentifier format and checksum. If the identifier is malformed, the request is dropped before querying the database.

* It executes a query that requires five points of data to match: id, user_id, name, public_identifier, and a valid = 1 status.

Once identity is confirmed, it extracts the `api_token` hash from the database and dispatches it to the specific utility (revoke, rotate, etcetera).

### Supported Actions
The manager handles five distinct lifecycle actions through the options argument:

* revoke: Marks the token as invalid. No further requests using this key will be accepted by the verification process.

* rotate: An atomic *replace* operation. It generates a new raw key while inheriting the attributes of the old one. Same prefix, remaining expiry, and existing IP restrictions.

* metadata: Returns extensive audit data, including when the token was last used and total usage counts.

* ip-restriction-update: Updates the whitelist of IP addresses allowed to use the token.

* privilege-update: Modifies the privileges of the token.


### Return type

`privateActionManager` returns the response of the underlying functions, even it these actions fails. Explore the docs to learn more.

When `privateActionManager` its self fails, it returns the following:

Checksum validations failure:

```ts
{
  ok: false,
  date: new Date().toISOString(),
  reason: 'Invalid identity'
}
```
When the query resulted in 0 rows, or when the provided action is not found: 
```ts
{
 ok: false,
 date: new Date().toISOString(),
 reason: 'Bad Request'
}
```
Database failure:

```ts
{
  ok: false,
  date: new Date().toISOString(),
  reason: 'Server Error'
}

```

::warning
While the manager is the primary way to handle dashboard actions, it relies on the [BFF](/docs/iam/essentials/bff) (Backend for Frontend) to provide the correct publicIdentifier. This prevents the browser from ever needing to *know* or store internal token hashes.
::

::note
The `publicIdentifier` is generated with the api token in the [creation step](/docs/iam/essentials/api/creation).
::

## Service 

As mentioned above, to perform any action, your client needs to be fully authenticated, with a valid [refresh token](/docs/iam/essentials/refresh-tokens) a valid [access token](/docs/iam/essentials/access-tokens) and a [`canary_id`](/docs/iam/essentials/tokens) cookie.
The session also should not have any active [MFA](/docs/iam/essentials/mfa) or [anomaly](/docs/iam/essentials/anomalies) associated with it.

Each actions enforces the full [authentication](/docs/iam/essentials) life-cycle before it perform any actions.

How ever every endpoint haves a different path, rate limiters, methods and a different body shape for `POST` requests.

Explore the logs below to learn how to perform an action.

Some of the failure response are identical for all actions, which are the following:

If the body is not valid or missing required values 400 will be returned:

```http
HTTP/1.1 400 Bad request
Content-Type: application/json; charset=utf-8

{
  "ok": false,
  "date": "current date",
  "reason": "Bad Request"
}
```

If the body contains HTML:

```http
HTTP/1.1 403 Bad request
Content-Type: application/json; charset=utf-8

{
 "banned": true
}
```

Rate Limits:

```http
HTTP/1.1 429
Content-Type: application/json; charset=utf-8
Retry-After: number
{
  "error": "Too many requests",
  "retry": "number",
}
```


---

## Documentation

::UPageGrid{class="lg:grid-cols-3"}
  ::UPageCard
  ---
    title: Privilege
    description: Learn how to update the privilege for a given token.
    to: /docs/iam/essentials/api/management/privilege
    icon: i-lucide-shield
  ---
  ::

  ::UPageCard
  ---
    title: Revocation
    description: Permanently invalidate an API token to immediately block all future access.
    to: /docs/iam/essentials/api/management/revocation
    icon: i-lucide-trash-2
  ---
  ::

  ::UPageCard
  ---
    title: Rotation
    description: Securely cycle a token by revoking the existing key and generating a fresh one in a single atomic action.
    to: /docs/iam/essentials/api/management/rotation
    icon: i-lucide-refresh-cw
  ---
  ::

  ::UPageCard
  ---
    title: IP Restriction
    description: Update the whitelist of authorized IP addresses allowed to perform requests with a specific token.
    to: /docs/iam/essentials/api/management/ip-updates
    icon: i-lucide-globe
  ---
  ::

  ::UPageCard
  ---
  title: Extensive Metadata
  description: Fetch detailed audit logs, including full usage history and precise lifecycle timestamps.
  to: /docs/iam/essentials/api/management/metadata
  icon: i-lucide-file-search
  ---
  ::

  ::UPageCard
  ---
    title: Token Listing
    description: Retrieve a high-level overview of all active tokens, including their names and current usage counts for a given user.
    to: /docs/iam/essentials/api/management/list
    icon: i-lucide-list
  ---
  ::
::
 