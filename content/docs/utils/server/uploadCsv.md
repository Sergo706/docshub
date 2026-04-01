---
title: uploadCsv
description: Bulk loads data from a CSV file directly into a MySQL or PostgreSQL table using native database bulk-load commands.
icon: i-lucide-database
---

The `uploadCsv` utility bulk loads a CSV file into a MySQL or PostgreSQL table using each database's native bulk-load mechanism. For MySQL it issues a `LOAD DATA LOCAL INFILE` statement; for PostgreSQL it uses `COPY ... FROM`. Both paths return a standardized `Results` object so the caller handles success and failure uniformly.

An optional `limit` parameter restricts how many data rows are inserted. When specified, the function streams the file through Node.js `readline` to slice it. No Unix shell tools are required, so this works on all platforms including Windows.

::callout{icon="i-lucide-alert-triangle" color="error"}
**MySQL**: The `mysql2/promise` pool **must** be configured with `flags: ['+LOCAL_FILES']` or the query will hang indefinitely.

**PostgreSQL**: The database user requires the `pg_read_server_files` privilege for the `COPY ... FROM` command.
::

## Definition

```ts [uploadCsv.ts]
import type { Results } from '@riavzon/utils'

export async function uploadCsv(
  paths: string,
  tableName: string,
  pool: unknown,
  dialect: 'mysql' | 'pg',
  limit?: number,
  timeoutMs?: number
): Promise<Results>
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `paths` | `string` | Yes | Relative or absolute path to the CSV file. Resolves from `process.cwd()`. |
| `tableName` | `string` | Yes | The exact name of the target database table. |
| `pool` | `unknown` | Yes | A configured `mysql2/promise` or `pg` connection pool. |
| `dialect` | `'mysql' \| 'pg'` | Yes | The database dialect to use for the bulk-load command. |
| `limit` | `number` | No | Maximum number of data rows to insert (header row excluded). |
| `timeoutMs` | `number` | No | Abort the upload after this many milliseconds. |

## Example Usage

### MySQL

```ts [db/seed.ts]
import { uploadCsv } from '@riavzon/utils/server'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Required for LOAD DATA LOCAL INFILE
  flags: ['+LOCAL_FILES'],
})
 
const result = await uploadCsv('./seed/records.csv', 'records', pool, 'mysql')

if (result.ok) {
  console.log('Upload successful')
} else {
  console.error('Upload failed:', result.reason)
}
```

### PostgreSQL

```ts [db/seed.ts]
import { uploadCsv } from '@riavzon/utils/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const result = await uploadCsv('./seed/records.csv', 'records', pool, 'pg')

if (!result.ok) {
  console.error('Upload failed:', result.reason)
}
```

### With Row Limit and Timeout

```ts [db/seed.ts]
// Insert at most 500 rows, abort if the upload takes longer than 20 seconds.
const result = await uploadCsv(
  './seed/records.csv',
  'records',
  pool,
  'pg',
  500,
  20_000
)
```

::callout{icon="i-lucide-info" color="info"}
When `limit` is set, the file is sliced in memory using Node.js `readline`. No Unix shell commands are invoked, making this fully cross-platform.
::
