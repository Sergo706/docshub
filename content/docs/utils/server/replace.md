---
title: File Replacements
description: Server-side utilities for performing atomic file and directory updates with built-in rollback protection.
icon: i-lucide-file-sync
---

The file replacement module provides a robust way to update local files without risking corruption. By using an atomic-swap strategy, these functions ensure that a destination file is never left in a partial or corrupted state if a write operation is interrupted or fails.

Instead of writing directly to a target, the logic stages changes in temporary files and keeps timestamped backups. This is particularly useful for sensitive files or configuration assets where uptime and integrity are non negotiable.


::caution 
Do not pass untrusted paths or contents to these utilities
::

---

## `replaceFile`

This is the core atomic primitive. When called, it resolves both paths and ensures the destination's parent directory exists. It then copies the existing file to a `.bak` extension. The new content is staged in a `.tmp` file using a combination of a timestamp and a random hash to avoid collisions.

If the operation succeeds, both the source (`newFile`) and the backup are purged. If an error occurs, it automatically attempts to copy the backup back to the original destination, ensuring the system returns to its last known good state.

::warning
Upon a successful replacement, the newFile source is permanently deleted from the filesystem. Do not point newFile to a file you intend to keep.
::

### Definition

```ts
/**
 * Executes a safe file replacement by using an atomic swap strategy to preserve 
 * data integrity. The process begins by creating a timestamped backup of the target file 
 * and staging the new content in a unique temporary location within the same directory. 
 * Once staged, it performs an atomic `rename` to finalize the replacement. If the operation 
 * succeeds, both the source and the backup are purged; if any step fails, the function 
 * attempts to restore the original file from the backup before propagating the error.
 * @param existentFile - The path to the file for replacement.
 * @param newFile - The source path providing the updated content.
 * @throws An error if the swap fails or if the rollback procedure cannot be completed.
 */
export async function replaceFile(existentFile: string, newFile: string): Promise<void>
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `existentFile` | `string` | Yes | The target file path to be replaced. |
| `newFile` | `string` | Yes | The source file containing the updated content. |

---

## `replaceDirContent`

This utility extends atomic safety to entire directory trees. It walks the source directory recursively, replicating the folder structure in the destination as it goes. For every file encountered, it triggers `replaceFile`.


Because directory synchronization can involve hundreds of files, the utility halts immediately upon the first failure. 

::note
Rollbacks occur strictly on a per-file basis. If a failure occurs midway through a directory sync, the currently processing file is rolled back, but previously successful file replacements in that run are preserved.
::

### Definition

```ts
/**
 * Synchronizes directory content by recursively traversing the source path and applying 
 * atomic updates to the destination. It ensures that the target's internal structure 
 * mirrors the source by creating nested directories as they are encountered. 
 * Replacement happens on a per-file basis; if an individual file swap fail, 
 * that specific file is rolled back and the entire process halts immediately to 
 * prevent inconsistent states across the directory tree.
 * @param existentDir - The target directory whose contents will be updated or created.
 * @param newDir - The source directory containing the new versions of the files and folders.
 * @throws An error if any single file replacement fails or if directory traversal is interrupted.
 */
export async function replaceDirContent(existentDir: string, newDir: string): Promise<void>
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `existentDir` | `string` | Yes | The target directory to be updated. |
| `newDir` | `string` | Yes | The source directory containing new files/folders. |

---

## `exists`

This utility simplifies path verification by wrapping `fs.access`. Rather than requiring the caller to handle caught exceptions, it returns a boolean. It is designed to verify both presence and the current process's permission to interact with the file or directory.

### Definition

```ts
/**
 * Determines the presence and accessibility of a filesystem path by attempting to reach it 
 * via the access API. This function returns a simple boolean to indicate 
 * whether the path is reachable by the current process, effectively swallowing 
 * any access-related errors into a false result.
 * @param path - The absolute or relative filesystem path to verify.
 * @returns A promise that resolves to true if the path is accessible, or false otherwise.
 */
export async function exists(path: string): Promise<boolean>
```

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | `string` | Yes | The target `path` to check. |

---

## Example Usage

### Atomic File Swap

This example demonstrates a safe way to update a single configuration file.

```ts [example.ts]
import { replaceFile } from '@riavzon/utils/server'

async function updateConfig() {
  try {
    // Stages new-config.json, renames it to config.json, and rolls back if it fails
    await replaceFile('./config.json', './new-config.json')
    console.log('Config updated.')
  } catch (err) {
    console.error('failed: Original config preserved.')
  }
}
```
### Recursive Directory Sync

Useful for deploying new data sets or static assets while maintaining a nested structure.

```ts [example.ts]
import { replaceDirContent } from '@riavzon/utils/server'

async function deployDataSources() {
  const currentDir = './data/active'
  const stagingDir = './data/staging-v2'

  try {
    // Replicates ./data/staging-v2/ into ./data/active/
    // including all nested subdirectories like active/dir/file.txt
    await replaceDirContent(currentDir, stagingDir)
  } catch (err) {
    // Process halted on the first file failure to prevent state mismatch
    console.error('Sync failed:', err)
  }
}
```

::note
The temporary files and backups created during these operations include high-resolution timestamps. While they are automatically cleaned up on success or successful rollback, you should ensure your application has write permissions in the target directory to allow these sidecar files to be created.
::
