---
title: Path Resolver
description: Server-side utilities for locating the project root and resolving absolute paths to data files across deployment layouts.
icon: i-lucide-folder-search
---

The path resolver module provides two functions for reliably locating files on disk in Node.js environments. They solve a common problem in monorepos and bundled deployments: the working directory at runtime may differ from where source files live, making relative paths fragile.

`getRoot` walks up the filesystem to find the project root. `resolvePath` searches a prioritized list of directories under that root to find a specific file.

## `getRoot`

### Definition

```ts [pathResolver.ts]
export function getRoot(
  currentDir?: string,
  marker?: string
): string
```

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `currentDir` | `string` | Module directory | Starting directory for the upward search. |
| `marker` | `string` | `'package.json'` | Filename whose presence signals the project root. |

`getRoot` throws an `Error` when the filesystem root is reached without finding the marker file.

### Example Usage

```typescript [server/setup.ts]
import { getRoot } from '@riavzon/utils/server'

// Find the nearest ancestor directory that contains a package.json.
const root = getRoot()

// Start the search from a specific directory with a custom marker.
const root2 = getRoot(import.meta.dirname, 'tsconfig.json')
```

---

## `resolvePath`

### Definition

```ts [pathResolver.ts]
export function resolvePath(
  fileName: string,
  searchDirs: string[],
  optionalFiles?: string[],
  root?: string
): string
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `fileName` | `string` | Yes | Bare filename to look for (for example, `"config.json"`). |
| `searchDirs` | `string[]` | Yes | Directories to search relative to `root`, tried in order. |
| `optionalFiles` | `string[]` | No | Filenames allowed to be absent. Returns `""` instead of throwing when not found. |
| `root` | `string` | No | Project root to resolve `searchDirs` against. Defaults to the result of `getRoot()`. |

`resolvePath` throws an `Error` when the file is not found and is not listed in `optionalFiles`.

### Example Usage

```typescript [server/setup.ts]
import { resolvePath } from '@riavzon/utils/server'

// Resolve a required file, searching two directories in priority order.
const schemaPath = resolvePath(
  'schema.json',
  ['assets', 'dist/assets']
)
 
// Resolve an optional file. Returns "" when the file does not exist.
const localConfigPath = resolvePath(
  'local.config.json',
  ['config', 'dist/config'],
  ['local.config.json']
)
  
if (localConfigPath) {
  console.log('Local config found at', localConfigPath)
}
```

::note
`searchDirs` are resolved relative to the project root in the order provided. The first directory containing a matching file wins, so list higher-priority directories first.
::

::warning
Both functions are designed for server-side use only. They rely on `fs.existsSync` and `path.resolve` from Node.js built-ins and will not work in browser or edge environments.
::
