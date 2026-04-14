---
title: Disposable Emails
description: Plain-text blocklist of disposable and temporary email domain providers, compiled into an LMDB database keyed by domain name.
icon: i-lucide-mail-x
---

This source downloads a plain-text blocklist of disposable and temporary email domain providers from [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains). Use it to reject registrations and form submissions from throwaway email addresses. All domains are lowercased before compilation.

**Output file:** `email-db/disposable-emails.mdb`

---

## Data Source

- Disposable email blocklist: [disposable-email-domains/disposable-email-domains](https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf)

::note
A `disposable-emails.mdb-lock` file is generated automatically alongside the database. This file is required for concurrent access.
::

---

## Usage

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base --email
```

```bash [yarn]
yarn dlx @riavzon/shield-base --email
```

```bash [npm]
npx @riavzon/shield-base --email
```

```bash [bun]
bunx @riavzon/shield-base --email
```
```ts [Programmatic]
import { getDisposableEmailLmdbList } from '@riavzon/shield-base';

// Compile into LMDB
await getDisposableEmailLmdbList('./out');

// Or download the raw plain-text list without compiling
import { getDisposableEmailList } from '@riavzon/shield-base';
await getDisposableEmailList('./out'); // outputs disposable_email_blocklist.txt
```
::

---

## Record Structure

```ts
interface EmailListRecord {
  domain: string;  // e.g. "0-mail.com"
  date: string;    // Compilation timestamp
  comment: string; // Attribution and source URL
}
```

---

## Reading the Database

Use the `lm-read` subcommand to inspect records from the command line:

::code-group
```bash [pnpm]
pnpm dlx @riavzon/shield-base lm-read --path ./out/email-db/disposable-emails.mdb --name email --operation get --key "0-mail.com"
```

```bash [yarn]
yarn dlx @riavzon/shield-base lm-read --path ./out/email-db/disposable-emails.mdb --name email --operation get --key "0-mail.com"
```

```bash [npm]
npx @riavzon/shield-base lm-read --path ./out/email-db/disposable-emails.mdb --name email --operation get --key "0-mail.com"
```

```bash [bun]
bunx @riavzon/shield-base lm-read --path ./out/email-db/disposable-emails.mdb --name email --operation get --key "0-mail.com"
```
```ts [Programmatic]
import { getByKey, doesExist } from '@riavzon/shield-base';
import type { EmailListRecord } from '@riavzon/shield-base';

const record = getByKey<EmailListRecord>(
  './out/email-db/disposable-emails.mdb',
  'email',
  '0-mail.com'
);

const isDisposable = doesExist(
  './out/email-db/disposable-emails.mdb',
  'email',
  'tempmail.com'
);
```
::

```json
{
  "domain": "0-mail.com",
  "date": "2026-03-24T23:23:16.866Z",
  "comment": "Maintained by https://github.com/disposable-email-domains/disposable-email-domains transformed by Shield-Base"
}
```
