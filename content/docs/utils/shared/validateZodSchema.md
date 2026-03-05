---
title: validateZodSchema
description: Validates data against a Zod schema with detailed logging and error reporting.
icon: i-lucide-shield-check
---

The `validateZodSchema` utility is a wrapper around [Zod](https://zod.dev/)'s `safeParse` method, integrated with [Pino](https://getpino.io/) for logging.

It simplifies the validation flow by automatically logging errors and transforming complex Zod issue arrays into a flat, friendly `errors` object. This makes it ideal for API request validation where you need to return clear error messages to the frontend while keeping detailed logs on the server.

## Definition

```ts [validateZodSchema.ts]
import { ZodType, ZodSafeParseSuccess } from 'zod';
import pino from 'pino';

interface CustomValidationError {
    valid: false;
    errors: Record<string, string>
}

export function validateZodSchema<T, Input>(
    schema: ZodType<T, Input>,
    data: Input,
    log: pino.Logger
): ZodSafeParseSuccess<T> | CustomValidationError
```

## Parameters
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `schema` | [`ZodType`](https://zod.dev/docs/introduction) | - | The Zod schema to validate the input against. |
| `data` | `Input` | - | The raw data object you want to validate. |
| `log` | `pino.Logger`| - | A Pino logger instance for auditing the validation process. |

## Return Structure

The utility returns one of two structures depending on the result:

- **Success**: Returns a standard `ZodSafeParseSuccess` object. You can access the validated data via `.data`.
- **Failure**: Returns a `CustomValidationError`.
  - `valid`: Always `false`.
  - `errors`: A flat `Record<string, string>` where keys are the field names (appended with " Error") and values are the human-readable error messages.

## Example Usage

```typescript [example.ts]
import { z } from 'zod'
import pino from 'pino'
import { validateZodSchema } from '@sergo/utils'

const logger = pino();

const UserSchema = z.object({
  username: z.string().min(3),
  age: z.number().positive()
});

const result = validateZodSchema(UserSchema, { username: "lo", age: -5 }, logger);

if ('valid' in result && !result.valid) {
  // result.errors will contain:
  // {
  //   "username Error": "String must contain at least 3 character(s)",
  //   "age Error": "Number must be greater than 0"
  // }
  console.log('Validation failed:', result.errors);
} else {
  // result is ZodSafeParseSuccess<T>
  console.log('Success!', result.data);
}
```
