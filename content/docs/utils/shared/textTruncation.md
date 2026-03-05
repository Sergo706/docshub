---
title: textTruncation
description: Simple utility to truncate strings that exceed a maximum length.
icon: i-lucide-scissors
---

The `textTruncation` utility cleanly shortens long strings to a specific character limit and automatically appends an ellipsis (`...`) if the text was modified.

## Definition

```ts [textTruncation.ts]
/**
 * Truncates a string if it exceeds the specified maximum length.
 *
 * @param text - The string to truncate.
 * @param maxLength - The maximum length of the string after truncation (excluding ellipsis).
 * @returns The truncated string with an ellipsis if it was truncated, otherwise the original string.
 */
export default function textTruncation(text: string, maxLength: number): string
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | `string` | Yes | The source string to be evaluated. |
| `maxLength` | `number` | Yes | The character limit. Ellipsis is added *after* this limit. |

## Example Usage

```typescript [example.ts]
import { textTruncation } from '@sergo/utils'

const title = "Welcome to the Website";

console.log(textTruncation(title, 10)); // "Welcome to..."
console.log(textTruncation(title, 50)); // "Welcome to the Website"
```
