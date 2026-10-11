/**
 * Module-scoped storage state and the single shared mutex that serializes
 * every read-modify-write against the accounts files.
 *
 * Split out of `lib/storage.ts` in RC-2 so the identity helpers, normalize,
 * load/save, flagged, and export-import modules can all share the same
 * resolved path and the same lock without creating circular imports.
 *
 * Invariants this module preserves:
 *   - `currentStoragePath` is either `null` (use global fallback) or an
 *     absolute path to a project-scoped accounts file.
 *   - `currentProjectRoot` is only non-null when `currentStoragePath` is
 *     project-scoped; `setStoragePathDirect` deliberately clears it so
 *     ad-hoc overrides (tests, one-off CLI paths) never look like a real
 *     project.
 *   - `withStorageLock` chains every critical section through a single
 *     promise so nothing can interleave between a load and its paired save.
 */
/**
 * Serializes storage I/O to keep account file reads/writes lock-step and avoid
 * cross-request races during migration/seeding flows.
 */
export declare function withStorageLock<T>(fn: () => Promise<T>): Promise<T>;
/** V2 hosts multiple locations in one process. Timers inherit their owner's scope. */
export declare function createStorageScope(): <T>(operation: () => T) => T;
/**
 * Pin the current storage location for the duration of `operation`.
 *
 * Every path getter (`getStoragePath`, `getCurrentStoragePath`,
 * `getCurrentProjectRoot`, `getCurrentLegacyProjectStoragePath`,
 * `getCurrentProjectStorageKey`, and anything derived from them such as
 * `getFlaggedAccountsPath`) resolves the location captured at entry, so all
 * reads, writes, keychain keys, snapshot paths, and transaction leases inside
 * the operation agree on one concrete file. A `setStoragePath` call made
 * inside the pin still applies — but to the real scope, where it takes effect
 * only after the pin is released.
 */
export declare function withPinnedStorageScope<T>(operation: () => T): T;
/** Listen only for path changes in the current storage scope. */
export declare function subscribeToStoragePathChanges(listener: () => void): () => void;
/** Select project-scoped account files, or clear the selection for global storage. */
export declare function setStoragePath(projectPath: string | null): void;
/** Override the active file without assigning a project identity (e.g. CLI/tests). */
export declare function setStoragePathDirect(path: string | null): void;
/**
 * Returns the file path for the account storage JSON file.
 * @returns Absolute path to the accounts.json file
 */
export declare function getStoragePath(): string;
/** Return the current location's explicit accounts path, if one is selected. */
export declare function getCurrentStoragePath(): string | null;
/** Return the legacy project file path used for seeding, if configured. */
export declare function getCurrentLegacyProjectStoragePath(): string | null;
/** Return the resolved project root for the active storage location. */
export declare function getCurrentProjectRoot(): string | null;
/**
 * Returns the project storage key (e.g. `my-project-abc123def456`) that the
 * active project storage path is rooted under, or `null` when no per-project
 * root is active (global storage is in use). Used by the opt-in keychain
 * backend as the account identifier so each project's credentials live
 * under a distinct (service, account) pair in the OS keychain.
 *
 * When `setStoragePathDirect` overrode the path to something outside the
 * standard per-project layout (tests, custom CLI override), we fall back to
 * `null` because there is no meaningful project identity to key off.
 */
export declare function getCurrentProjectStorageKey(): string | null;
