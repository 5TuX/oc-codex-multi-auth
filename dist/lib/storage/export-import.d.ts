/**
 * Account export / import / preview pipeline.
 *
 * Split out of `lib/storage.ts` in RC-2. All three public functions here are
 * thin wrappers around `withAccountStorageTransaction` so they inherit the
 * same mutex + atomic-write guarantees as ordinary saves. The pre-import
 * backup path is delegated to `./backup.ts`.
 */
/**
 * Backup policy for `importAccounts`.
 *
 * - `none`: do not create a pre-import backup (destructive; opt-in only).
 * - `timestamped`: create a timestamped pre-import backup, continue on failure.
 *   This is the default: an import must never destroy existing accounts.
 * - `best-effort`: legacy alias for `timestamped`, retained for callers that
 *   were written against the prior enum.
 * - `required`: backup must succeed or the import aborts.
 */
export type ImportBackupMode = "none" | "timestamped" | "best-effort" | "required";
export interface ImportAccountsOptions {
    /**
     * Optional prefix used for pre-import backup file names.
     * Only applied when backupMode is not "none".
     */
    preImportBackupPrefix?: string;
    /**
     * Backup policy before import apply. Defaults to `"timestamped"` so that the
     * prior on-disk state is preserved unless the caller explicitly opts out via
     * `{ backupMode: "none" }`.
     */
    backupMode?: ImportBackupMode;
}
export type ImportBackupStatus = "created" | "skipped" | "failed";
export interface ImportAccountsResult {
    imported: number;
    total: number;
    skipped: number;
    backupStatus: ImportBackupStatus;
    backupPath?: string;
    backupError?: string;
}
export interface ImportPreviewResult {
    imported: number;
    total: number;
    skipped: number;
}
/**
 * Import preview/apply analysis is pure in-memory work: it does not touch disk
 * and it does not log token or workspace values. The surrounding
 * `withAccountStorageTransaction` caller keeps Windows lock-retry and
 * serialized read-modify-write behavior; see `test/storage.test.ts` for the
 * overlapping transaction regression and pre-import backup lock coverage.
 */
export declare function previewImportAccounts(filePath: string): Promise<ImportPreviewResult>;
/**
 * Exports current accounts to a JSON file for backup/migration.
 *
 * Safety default:
 * `force` defaults to `false` so an existing export file is never silently
 * overwritten. Callers that need the prior destructive behaviour must opt in
 * via `exportAccounts(path, true)`.
 *
 * @param filePath - Destination file path.
 * @param force - If true, overwrite any existing file at `filePath`. Defaults to
 *   `false`; when false and the file exists, a `StorageError` is thrown.
 * @throws StorageError if the file already exists and `force` is `false`.
 * @throws Error if there are no accounts to export.
 */
export declare function exportAccounts(filePath: string, force?: boolean): Promise<void>;
/**
 * Imports accounts from a JSON file, merging with existing accounts.
 * Deduplicates by identity key first (organizationId -> accountId -> refreshToken),
 * then applies legacy email dedupe only to entries without organizationId/accountId.
 *
 * Safety default:
 * `options.backupMode` defaults to `"timestamped"` so a pre-import snapshot of
 * the existing accounts file is always written before apply. Callers that need
 * the prior destructive default must pass `{ backupMode: "none" }` explicitly.
 *
 * @param filePath - Source file path
 * @param options - Import options: `backupMode` (`timestamped` | `best-effort` | `none`)
 *   and `preImportBackupPrefix` for the pre-import snapshot filename
 * @returns An `ImportAccountsResult` summarizing imported, skipped, and merged accounts
 * @throws Error if file is invalid or would exceed MAX_ACCOUNTS
 */
export declare function importAccounts(filePath: string, options?: ImportAccountsOptions): Promise<ImportAccountsResult>;
