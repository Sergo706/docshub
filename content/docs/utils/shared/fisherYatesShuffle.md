---
title: fisherYatesShuffle
description: Shuffles an array using the highly efficient Fisher-Yates algorithm.
icon: i-lucide-shuffle
---

The `fisherYatesShuffle<T>` utility provides a highly efficient and unbiased way to shuffle an array. It implements the [Fisher-Yates shuffle algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle), ensuring every permutation of the array is equally likely.

To preserve immutability, this utility returns a brand new shuffled array without modifying the original input.

## Definition

```ts [fisherYatesShuffle.ts]
/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Returns a new array to preserve immutability.
 *
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function fisherYatesShuffle<T>(array: T[]): T[]
```

## Behavior
- It clones the original array to maintain immutability.
- It iterates through the array from the last element to the first.
- In each step, it picks a random element from the unshuffled portion and swaps it with the current element.

## Example Usage

This utility is perfect for scenarios where you need to randomize the order of a list, such as shuffling a deck of cards or randomizing a list of search results.

```typescript [example.ts]
import { fisherYatesShuffle } from '@riavzon/utils'

const input = [1, 2, 3, 4, 5];
const shuffled = fisherYatesShuffle(input);

console.log('Original:', input); // [1, 2, 3, 4, 5] (unchanged)
console.log('Shuffled:', shuffled); // e.g. [3, 1, 5, 2, 4]
```
