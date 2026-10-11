/**
 * Flagged-account storage: load/save/clear + transactional update.
 *
 * Split out of `lib/storage.ts` in RC-2. Flagged accounts live in a sibling
 * file next to the main accounts file and follow the same mutex, temp-file +
 * rename, and legacy-file migration pattern — just with a simpler V1-only
 * schema and different legacy filenames (flagged-accounts.json and the
 * older blocked-accounts.json).
 */
import type { AccountMetadataV3 } from "./migrations.js";
export interface FlaggedAccountMetadataV1 extends AccountMetadataV3 {
    flaggedAt: number;
    flaggedReason?: string;
    lastError?: string;
}
export interface FlaggedAccountStorageV1 {
    version: 1;
    accounts: FlaggedAccountMetadataV1[];
}
export declare function getFlaggedAccountsPath(): string;
export declare function normalizeFlaggedStorage(data: unknown, sourcePath?: string): FlaggedAccountStorageV1;
export declare function loadFlaggedAccounts(): Promise<FlaggedAccountStorageV1>;
/**
 * Executes a read-modify-write transaction for flagged account storage under the
 * shared storage lock so concurrent callers cannot lose updates.
 *
 * The transaction runs under `withPinnedStorageScope` with the same contract
 * as the main store's transaction: the flagged path captured at entry is the
 * path the filesystem lease covers, and a mid-transaction `setStoragePath`
 * scope flip cannot redirect this transaction's load/persist to a sibling
 * file the lease does not cover.
 */
export declare function withFlaggedAccountStorageTransaction<T>(handler: (current: FlaggedAccountStorageV1, persist: (storage: FlaggedAccountStorageV1) => Promise<void>) => Promise<T>): Promise<T>;
export declare function saveFlaggedAccounts(storage: FlaggedAccountStorageV1): Promise<void>;
/**
 * Deletes the flagged account storage file from disk, and — when the keychain
 * opt-in is enabled — the flagged keychain entry as well.
 *
 * Ordering mirrors `clearAccounts` (F1 post-merge MEDIUM finding, applied to
 * the sibling store): unlink the on-disk JSON FIRST, then delete the keychain
 * entry. Clearing the keychain first while the unlink failed would let a
 * subsequent load take the "no keychain entry, fall back to JSON" branch of
 * `loadFlaggedAccountsUnlocked` and resurrect the flagged records from the
 * still-present file — and vice versa, which is the resurrection this
 * ordering exists to prevent. A partial failure therefore leaves both sides
 * present so the caller can retry, and the operation stays best-effort
 * (never throws) apart from the test-home guard.
 *
 * When `options.keepFlaggedAtOrAfter` is given, the handler first inspects
 * the store under the same lease: records flagged at or after the cutoff
 * were written by a runtime concurrent with the caller's wipe decision and
 * outlive it — the clear then degrades to persisting just those survivors
 * through the normal keychain- and marker-aware save instead of deleting
 * the store. A blind delete would silently destroy a flag written in the
 * gap between the caller's snapshot and this lock.
 *
 * @throws StorageError (code `TEST_HOME_ESCAPE`) - see `clearAccounts`; the
 *   guard refuses the deletion, so absorbing it would report a clear that
 *   deliberately did not happen.
 */
export declare function clearFlaggedAccounts(options?: {
    keepFlaggedAtOrAfter?: number;
}): Promise<void>;
