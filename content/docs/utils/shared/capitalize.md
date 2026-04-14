---
title: capitalize
description: String manipulation utilities for title-casing and sentence-casing.
icon: i-lucide-type
---

The `capitalize` class provides simple helpers to standardize text casing, often used for UI labels, headers, or normalizing user input.
 
## Methods

### `capitalize` 

Standardizes a string by making the first character uppercase and the rest lowercase.

**Definition:**
```ts [capitalize.ts]
export function capitalize(str: string): string
```

#### Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `str` | `string` | Yes | The target string you want to capitalize. |


### `capitalizeSentence`

Capitalizes every word in a sentence (Title Casting).
 
**Definition:**
```ts [capitalize.ts]
export function capitalizeSentence(str: string): string
```

#### Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `str` | `string` | Yes | The sentence you want to convert to title case. |

## Example Usage

```typescript [example.ts]
import { capitalize, capitalizeSentence } from '@riavzon/utils'

// 1. Single word normalization
console.log(capitalize('sErGiO')); // "Sergio"

// 2. Title casing a sentence
console.log(capitalizeSentence('hello world FROM nuxt')); // "Hello World From Nuxt"
```
