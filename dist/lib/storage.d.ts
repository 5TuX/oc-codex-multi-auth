/**
 * Barrel for the account-storage layer.
 *
 * RC-2 split the original 1400-line `lib/storage.ts` into focused modules
 * under `lib/storage/`. This file exists to keep the public surface stable
 * so every consumer that imports from `./storage` / `../storage` resolves
 * exactly as it did before the refactor.
 *
 * Split into `lib/storage/` submodules so each concern (paths, migrations,
 * keychain, backups, import/export) stays independently reviewable.
 */
export type { CooldownReason, RateLimitStateV3, AccountMetadataV1, AccountStorageV1, AccountMetadataV3, AccountStorageV3, } from "./storage/migrations.js";
export { StorageError, formatStorageErrorHint } from "./storage/errors.js";
export { setStoragePath, setStoragePathDirect, getStoragePath, withStorageLock, } from "./storage/state.js";
export { getWorkspaceIdentityKey, deduplicateAccounts, deduplicateAccountsByEmail, } from "./storage/identity.js";
export { normalizeAccountStorage } from "./storage/normalize.js";
export { loadAccounts, saveAccounts, clearAccounts, withAccountStorageTransaction, } from "./storage/load-save.js";
export type { FlaggedAccountMetadataV1, FlaggedAccountStorageV1, } from "./storage/flagged.js";
export { getFlaggedAccountsPath, loadFlaggedAccounts, saveFlaggedAccounts, clearFlaggedAccounts, withFlaggedAccountStorageTransaction, } from "./storage/flagged.js";
export { createTimestampedBackupPath } from "./storage/backup.js";
export type { ImportBackupMode, ImportBackupStatus, ImportAccountsOptions, ImportAccountsResult, ImportPreviewResult, } from "./storage/export-import.js";
export { exportAccounts, importAccounts, previewImportAccounts, } from "./storage/export-import.js";
