---
title: RequireKeys
description: Makes specified keys of T required (opposite of Partial).
icon: i-lucide-key
---

The `RequireKeys<T, K>` utility type allows you to selectively enforce that specific optional properties within an interface or object type become required.

It effectively acts as a targeted counterpart to TypeScript's built-in `Partial` and `Required` utilities, giving you precise control over exactly which keys must be provided.

## Definition

```ts [RequireKeys.ts]
/**
 * Makes specified keys of T required (opposite of Partial).
 */
export type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] };
```

## Example Usage

This is incredibly useful when transforming an object through various stages of computation, where initially some properties are optional, but after validation or hydration, they are guaranteed to exist.

```typescript [example.ts]
import type { RequireKeys } from '@sergo/utils/types'

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

// Suppose we have a strict registration flow where email and name become mandatory,
// but phoneNumber remains optional.

type StrictUserProfile = RequireKeys<UserProfile, 'name' | 'email'>;

// Allowed: id, name, and email provided
const validProfile: StrictUserProfile = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};

// Error: Property 'email' is missing in type...
const invalidProfile: StrictUserProfile = {
  id: '123',
  name: 'John Doe'
};

function finalizeRegistration(user: StrictUserProfile) {
  // We can safely access name and email without checking for undefined
  console.log(`Sending confirmation to ${user.email}`); 
}
```
