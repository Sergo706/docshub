---
title: uploadCsv
description: Bulk loads data from a CSV file directly into a MySQL table using `LOAD DATA LOCAL INFILE`.
icon: i-lucide-database
---

The `uploadCsv` utility is a highly optimized server-side function designed to bulk load data from a CSV file directly into a MySQL table.

It leverages MySQL's native `LOAD DATA LOCAL INFILE` command and automatically handles file path resolution, ensures the target table uses the `InnoDB` engine with `utf8mb4` encoding, and cleans up temporary files if row limits are applied.

::callout{icon="i-lucide-alert-triangle" color="error"}
**Warning**: The `mysql2/promise` connection pool passed to this function **MUST** be configured with `flags: ['+LOCAL_FILES']` to allow local file reading. If this is omitted, the query will hang indefinitely.
::

## Definition

```ts [uploadCsv.ts]
import type { Pool } from "mysql2/promise";
import type { Results } from "@sergo/utils/types";

export async function uploadCsv(
  paths: string,
  tableName: string,
  pool: Pool,
  limit?: number,
  timeoutMs?: number
): Promise<Results>
```

## Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `paths` | `string` | Yes | The relative or absolute file path to the CSV data. Resolves from the current working directory. |
| `tableName` | `string` | Yes | The exact name of the MySQL table where the data will be inserted. |
| `pool` | `Pool` | Yes | A configured `mysql2/promise` connection pool (must have `+LOCAL_FILES` enabled). |
| `limit` | `number` | No | The maximum number of data rows to insert. Relies on the Unix `head` command (*will fail on native Windows without WSL/Bash*). |
| `timeoutMs` | `number` | No | The maximum time in milliseconds the database query or shell command is allowed to run before aborting. |

## Example Usage

### Standard Upload

```ts [example.ts]
import { uploadCsv } from '@sergo/utils/server'
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp',
  // CRITICAL for LOAD DATA LOCAL INFILE
  flags: ['+LOCAL_FILES']
});

// Upload the entire file
const result = await uploadCsv('./data/users.csv', 'users_table', pool);

if (result.ok) {
  console.log('Successfully uploaded users!');
} else {
  console.error('Failed to upload users:', result.reason);
}
```

### Upload with Limit and Timeout

```ts [example-advanced.ts]
// Abort if the upload takes longer than 30 seconds (30000ms),
// and only insert the first 1000 rows.
const result = await uploadCsv('./data/movies.csv', 'movies', pool, 1000, 30000);

if (!result.ok) {
  console.error('Upload failed or timed out:', result.reason);
}
```
