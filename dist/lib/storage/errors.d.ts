/**
 * Storage-domain error re-export + platform-aware error hint formatting.
 *
 * RC-3 consolidation: `StorageError` now lives in `lib/errors.ts` alongside the
 * rest of the typed error hierarchy. This module re-exports it so every
 * existing import path (`./errors.js` from storage submodules,
 * `lib/storage.ts` public re-export) continues to work without changes.
 *
 * `formatStorageErrorHint` stays here because it is storage-specific presentation
 * and has no place in the generic error-class module.
 */
export { StorageError } from "../errors.js";
/**
 * Generate platform-aware troubleshooting hint based on error code.
 */
export declare function formatStorageErrorHint(error: unknown, path: string): string;
