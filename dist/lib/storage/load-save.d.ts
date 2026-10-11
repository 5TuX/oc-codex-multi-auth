/**
 * Account storage load/save pipeline.
 *
 * Split out of `lib/storage.ts` in RC-2. This module owns:
 *   - the `.gitignore` side-effect when writing into a project repo,
 *   - the legacy project + global storage migrations triggered on ENOENT,
 *   - the atomic write (temp file + rename + EEMPTY guard),
 *   - and the `withAccountStorageTransaction` read-modify-write primitive
 *     that every mutating caller above the storage layer uses.
 *
 * Scope pinning: `loadAccounts`/`saveAccounts`/`clearAccounts`/
 * `withAccountStorageTransaction` all run under `withPinnedStorageScope`, so
 * the location resolved at entry — including the path the filesystem
 * transaction lease is taken on — is the location every read, write, and
 * keychain key inside the call resolves. A `setStoragePath` scope flip that
 * lands mid-transaction can no longer redirect a persist to a different
 * project store while the lease still names the old one.
 *
 * The error-handling contract is subtle and load-bearing: forward-compat
 * (`UNSUPPORTED_SCHEMA_VERSION`), unknown-V2 (`UNKNOWN_V2_FORMAT`), and
 * invalid/unreadable existing files (`INVALID_STORAGE`) MUST reach the
 * caller. Swallowing any of them would overwrite future-schema credentials,
 * silently discard a user's V2 file, or replace an unreadable store with an
 * empty pool — exactly the class of bug the audit flagged. For the same
 * reason a project-scoped ENOENT NEVER falls back to the live global file:
 * reading the global pool and writing a copy into the project store
 * duplicated single-use refresh tokens across scopes, so the first rotation
 * in either pool stranded the other copy.
 */
import { type AccountStorageV3 } from "./migrations.js";
export declare function consumeLastWrittenAccountsDigest(path?: string): string | undefined;
export declare function __resetCollisionWarningThrottleForTests(): void;
/**
 * Pre-keychain-write retirement helper: if a legacy on-disk JSON file still
 * exists at `path`, rename it with a timestamped `.migrated-to-keychain.<ts>`
 * suffix instead of deleting it. Preserving the original file as a rollback
 * artefact is load-bearing: it is the user's explicit escape hatch if the
 * keychain backend turns out to be unreliable on their platform.
 *
 * Callers invoke this BEFORE the keychain write, not after it. Ordering the
 * rename first removes the crash window where the keychain already held the
 * new blob while the canonical JSON still held the old one: a kill between
 * the two steps now leaves marker + keychain at the same (old) state rather
 * than diverged, so a later `CODEX_KEYCHAIN` unset can never resurrect a
 * stale canonical file beside a fresh keychain entry.
 *
 * Shared by the main account store and the flagged sibling store, which gets
 * the same marker via `rewriteOnDisk` — the caller supplies the "refresh the
 * on-disk copy" half of the contract because each store serializes its own
 * document shape.
 *
 * Partial-failure handling (F1 post-merge HIGH finding): if the rename fails
 * (EACCES, EBUSY on Windows, disk full, parent dir permission drift) the file
 * at `path` would otherwise hold a stale-but-valid blob while the keychain
 * holds the authoritative fresh blob. This is safe while the opt-in is on
 * (keychain wins at load time) but silently resurrects stale credentials if
 * the user later unsets `CODEX_KEYCHAIN`. We resolve this by letting
 * `rewriteOnDisk` overwrite the file with the fresh normalized blob when the
 * rename fails so both sides agree, at the cost of losing that one rollback
 * artefact. This matches the "rollback invariant" documented in the F1
 * post-merge review (option (a)).
 */
export declare function migrateOnDiskJsonToKeychainBackup(path: string, rewriteOnDisk: () => Promise<void>): Promise<void>;
/**
 * Remove every `.migrated-to-keychain.<ts>` rollback artefact beside
 * `storagePath`. Clear operations call this so a "delete all credentials"
 * request cannot leave a plaintext copy of the full token set sitting next
 * to the (now removed) store — an artefact a future `codex-keychain
 * rollback` or a casual `cat` would otherwise expose.
 *
 * Returns the paths whose unlink failed. Callers surface a non-empty list
 * as an error: a stranded marker is both a plaintext leak and — via the
 * interrupted-migration load fallback — a resurrection path for the
 * credentials the clear was asked to destroy. Exported for the flagged
 * sibling store, whose clear shares the same contract.
 */
export declare function retireKeychainMigrationArtifacts(storagePath: string): Promise<string[]>;
/**
 * List `.migrated-to-keychain.<ts>` markers beside `storagePath`, newest
 * first. Loads use this as a recovery source: a process that died between
 * the pre-keychain rename and the keychain write leaves NO canonical file
 * while the marker still holds the last good store. Falling through to an
 * empty pool in that state would lose the accounts on the next save.
 *
 * Sorting is by `mtimeMs` (not the timestamp embedded in the name) so it
 * matches "most recently written" exactly; the filename is the tiebreaker
 * for the rare identical-mtime case so the order stays deterministic.
 */
export declare function listKeychainMigrationMarkers(storagePath: string): Promise<string[]>;
/**
 * Keep the freshest `.migrated-to-keychain` marker in lockstep with the blob
 * just written to the keychain. The marker doubles as the interrupted-
 * migration load fallback AND the opt-out restore source: if it stayed at
 * the migration-time pool while the keychain blob advanced (rotations,
 * removals), a later keychain outage or opt-out would resurrect consumed
 * refresh tokens and deleted accounts. Rewriting the newest marker with the
 * post-save blob keeps the fallback current; the older markers are retired
 * because a stale marker strictly dominates no-marker as a resurrection
 * hazard — it holds full plaintext credentials that only look authoritative.
 *
 * Called only after a SUCCESSFUL keychain write. A refresh or unlink
 * failure is warned loudly rather than absorbed silently: the save itself
 * already landed in the keychain, so a stranded stale marker is an
 * operator-visible integrity gap, not a save failure.
 */
export declare function syncKeychainMigrationMarkers(storagePath: string, blob: string): Promise<void>;
/**
 * Loads OAuth accounts from disk storage.
 * Automatically migrates v1 storage to v3 format if needed.
 * @returns AccountStorageV3 if file exists and is valid, null otherwise
 * @throws StorageError (code `UNSUPPORTED_SCHEMA_VERSION`) when the on-disk
 *   `version` field is greater than the newest format this plugin understands.
 *   Surfacing the error stops a downgraded plugin from overwriting the user's
 *   future-schema credentials with a stale or empty payload.
 */
export declare function loadAccounts(): Promise<AccountStorageV3 | null>;
/**
 * Executes a read-modify-write transaction under the storage lock and exposes
 * an unlocked persist callback so nested save operations do not deadlock.
 *
 * The whole transaction — lease acquisition, load, handler, and every persist
 * callback the handler invokes — runs under `withPinnedStorageScope`, so the
 * location captured at entry (which is also the path the filesystem lease is
 * taken on) is the only location the transaction can touch. A `setStoragePath`
 * scope flip issued mid-transaction applies to the real scope but cannot
 * redirect this transaction's writes: they stay on the file the lease covers.
 */
export declare function withAccountStorageTransaction<T>(handler: (current: AccountStorageV3 | null, persist: (storage: AccountStorageV3) => Promise<void>) => Promise<T>): Promise<T>;
/**
 * Persists account storage to disk using atomic write (temp file + rename).
 * Creates the .opencode directory if it doesn't exist.
 * Verifies file was written correctly and provides detailed error messages.
 * @param storage - Account storage data to save
 * @throws StorageError with platform-aware hints on failure
 */
export declare function saveAccounts(storage: AccountStorageV3): Promise<void>;
/**
 * Deletes the account storage file from disk.
 * Silently ignores if file doesn't exist.
 *
 * Ordering (F1 post-merge MEDIUM finding): unlink the on-disk JSON FIRST,
 * then delete the keychain entry. If we cleared the keychain first and the
 * unlink failed for a non-ENOENT reason (EACCES, EBUSY, filesystem drift),
 * a subsequent load with opt-in still on would take the "no keychain entry,
 * fall back to JSON" branch (see `loadAccountsInternal`) and resurrect the
 * credentials from the still-present JSON file. Callers typically run
 * `clearAccounts` to recover from a compromised token, so a silent
 * resurrection is a meaningful failure mode.
 *
 * Fail-safe invariant: if the JSON unlink fails (non-ENOENT), we skip the
 * keychain delete and log at `error`. Both copies remain in sync so the
 * caller can retry safely. The operation is still best-effort (never
 * throws) to preserve the existing contract above the storage layer.
 *
 * @throws StorageError (code `TEST_HOME_ESCAPE`) - the single exception to
 *   best-effort, and inert outside vitest. The guard refuses the deletion, so
 *   absorbing it would return success for a clear that never happened.
 */
export declare function clearAccounts(): Promise<void>;
