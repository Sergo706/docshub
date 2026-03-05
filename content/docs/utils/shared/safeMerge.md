---
title: safeObjectMerge
description: Merges objects while protecting specified reserved keys from being overwritten.
icon: i-lucide-git-merge
---

The `safeObjectMerge` utility is a specialized merge helper designed to protect core data during object updates. It allows you to merge properties from a source object into a target object while explicitly guarding "reserved" keys that should remain immutable if they already contain a value.

Unlike a standard shallow merge (`{...target, ...src}`), this utility gives you granular control over conflict resolution and ensures that sensitive fields (like IDs or Roles) aren't accidentally overwritten by untrusted input.

## Definition

```ts [safeMerge.ts]
type MergeMode = "drop" | "throw";

export function safeObjectMerge(
  target: Record<string, unknown>,
  src: Record<string, unknown>,
  opts: {
    mode?: MergeMode;
    onConflict?: (key: string, incoming: unknown, existing: unknown) => void
  } = {},
  defaultToReserve: Array<string>,
  extraReserved?: Set<string>
): Record<string, unknown>
```

## Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `Record` | - | The object to merge into. **Note: This object is modified directly.** |
| `src` | `Record` | - | The source object containing new properties to merge. |
| `opts.mode` | `"drop" \| "throw"` | `"drop"` | Determines behavior on conflict. `"drop"` ignores the change, while `"throw"` raises an Error. |
| `opts.onConflict` | `Function` | - | Optional callback triggered when an attempt is made to overwrite a reserved key. |
| `defaultToReserve`| `string[]` | - | An array of keys that must be protected from overwriting. |
| `extraReserved` | `Set<string>` | - | An optional additional set of keys to protect. |

## Conflict Resolution Logic

1. **Reserved & Populated**: If a key is in the reserved list AND the `target` already has a non-null/undefined value, the `src` value is rejected according to the `mode`.
2. **Reserved & Empty**: If a key is in the reserved list but is currently `null` or `undefined` in the `target`, it **will be populated** from the `src`.
3. **Unreserved**: All other keys are merged normally, overwriting the `target` if they exist.

## Example Usage

```typescript [example.ts]
import { safeObjectMerge } from '@sergo/utils'

const user = { id: 1, name: "Alice", role: "guest" };
const update = { id: 999, role: "admin", bio: "Developer" };

// We want to allow updating the 'bio', but protect 'id' and 'role'
safeObjectMerge(
  user,
  update,
  {
    mode: "drop",
    onConflict: (key) => console.warn(`Prevented overwrite of reserved key: ${key}`)
  },
  ["id", "role"]
);

console.log(user);
// Output: { id: 1, name: "Alice", role: "guest", bio: "Developer" }
// 'id' remained 1, and 'role' remained "guest" because they were reserved and populated.
```
