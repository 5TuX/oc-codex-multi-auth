/**
 * Schema normalization, forward-compat guard, and V2 detection for account
 * storage files.
 *
 * Split out of `lib/storage.ts` in RC-2. This module does not touch disk: it
 * takes already-parsed JSON and returns a canonical `AccountStorageV3` (or
 * throws a typed `StorageError` for schemas we can't safely read).
 */
import { type AccountStorageV3 } from "./migrations.js";
/**
 * Normalizes and validates account storage data, migrating from v1 to v3 if needed.
 * Handles deduplication, index clamping, and per-family active index mapping.
 * @param data - Raw storage data (unknown format)
 * @param sourcePath - Optional origin path used for error diagnostics
 * @returns Normalized AccountStorageV3 or null if invalid
 * @throws StorageError (code `UNSUPPORTED_SCHEMA_VERSION`) when `data.version`
 *   is a finite number greater than the newest format this plugin understands.
 *   Throwing prevents a downgraded plugin from silently discarding future
 *   schemas that still contain valid credentials.
 */
export declare function normalizeAccountStorage(data: unknown, sourcePath?: string): AccountStorageV3 | null;
