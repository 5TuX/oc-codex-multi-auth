import type { AccountIdSource, TokenResult } from "../types.js";
/**
 * Fields that identify the two account records participating in a merge.
 * Kept permissive so callers can pass stored account records of any concrete
 * shape without coupling this helper to the full V3 schema.
 */
type MergeableAccountRecord = {
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: number;
    oauthScope?: string;
    lastUsed?: number;
    addedAt?: number;
    enabled?: boolean;
    accountId?: string;
    accountUserId?: string;
    organizationId?: string;
    accountIdSource?: AccountIdSource;
    accountLabel?: string;
    planType?: string;
    email?: string;
    lastSwitchReason?: string;
    rateLimitResetTimes?: Record<string, number | undefined>;
    coolingDownUntil?: number;
    quotaExhaustedUntil?: number;
    quotaExhaustedStampAt?: number;
    quotaExhaustedClearedAt?: number;
    cooldownReason?: string;
    tokenRotatedAt?: number;
};
/**
 * Pure merge function that combines two stored account records. `target` wins
 * for stable identity fields; token fields prefer the newer record (by
 * lastUsed/addedAt) but use nullish-coalescing so an explicitly empty newer
 * token does NOT silently fall back to the older value. Empty-string tokens
 * are treated as intentional clears — never resurrected from the older record.
 *
 * Exposed for targeted regression tests around the credential-merge semantics.
 */
export declare function mergeStoredAccountPair<T extends MergeableAccountRecord>(target: T, source: T): T;
type TokenSuccess = Extract<TokenResult, {
    type: "success";
}>;
export type TokenSuccessWithAccount = TokenSuccess & {
    accountIdOverride?: string;
    organizationIdOverride?: string;
    accountIdSource?: AccountIdSource;
    accountLabel?: string;
    planType?: string;
};
export type AccountSelectionResult = {
    primary: TokenSuccessWithAccount;
    variantsForPersistence: TokenSuccessWithAccount[];
};
export type PersistAccountSelections = (results: TokenSuccessWithAccount[], replaceAll: boolean) => Promise<void>;
export type AccountSelectionFallbacks = Pick<TokenSuccessWithAccount, "accountIdOverride" | "accountIdSource" | "organizationIdOverride" | "accountLabel">;
export declare function resolveAccountSelection(tokens: TokenSuccess): AccountSelectionResult;
export declare function applyAccountSelectionFallbacks(selection: AccountSelectionResult, fallbacks: AccountSelectionFallbacks): AccountSelectionResult;
/**
 * Persists the already-resolved selection through the caller's
 * `persistSelections` callback. Windows filesystem safety remains delegated to
 * that callback, so callers should use `persistAccountPool` or
 * `withAccountStorageTransaction` to keep the rename retry and serialized
 * read-modify-write behavior covered by `test/login-runner.test.ts`.
 * Callback failures are rethrown with a redacted message so callers can log the
 * wrapper safely without leaking token-file paths or account identifiers.
 */
export declare function persistResolvedAccountSelection(selection: AccountSelectionResult, options?: {
    persistSelections?: PersistAccountSelections;
    replaceAll?: boolean;
}): Promise<AccountSelectionResult>;
/**
 * Finalizes a resolved selection by delegating persistence to the caller's
 * `persistSelections` callback. Windows lock-retry and read-modify-write
 * serialization remain the callback's responsibility, so callers should route
 * through `persistAccountPool` or `withAccountStorageTransaction` to preserve
 * the guarantees covered by `test/login-runner.test.ts`.
 * Persistence callback failures are redacted inside
 * `persistResolvedAccountSelection()` before they propagate back to callers.
 */
export declare function resolveAndPersistAccountSelection(tokens: TokenSuccess, options?: {
    fallbacks?: AccountSelectionFallbacks;
    persistSelections?: PersistAccountSelections;
    replaceAll?: boolean;
}): Promise<AccountSelectionResult>;
/**
 * Persists login results through the shared storage transaction so overlapping
 * login retries serialize their read-modify-write cycle instead of racing stale
 * snapshots. `withAccountStorageTransaction` also routes the final rename
 * through the Windows lock retry path in `lib/storage.ts`; see
 * `test/login-runner.test.ts` for the concurrent persist regression coverage.
 */
export declare function persistAccountPool(results: TokenSuccessWithAccount[], replaceAll?: boolean): Promise<void>;
export {};
