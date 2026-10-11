/**
 * Shared token refresh persistence for the account-management tools.
 *
 * OpenAI refresh tokens are single-use and rotate on exchange. Production
 * refreshes flow through `coordinatePersistedRefresh()`, which owns the
 * authoritative reload, exchange, and durable commit under one lease.
 */
import type { AccountMetadataV3 } from "../storage.js";
export interface RefreshAccountIdentity {
    organizationId?: string;
    accountId?: string;
    accountUserId?: string;
    refreshToken: string;
}
export interface RefreshAccountInput {
    index: number;
    identity: RefreshAccountIdentity;
    enabled?: boolean;
}
export interface PersistedRefreshResult {
    index: number;
    identity: RefreshAccountIdentity;
    refreshToken: string;
    accessToken: string;
    expiresAt: number;
    rotatedAt?: number;
    persisted: boolean;
    persistError?: string;
}
export type AccountRefreshOutcome = {
    status: "skipped";
    index: number;
    identity: RefreshAccountIdentity;
} | {
    status: "failed";
    index: number;
    identity: RefreshAccountIdentity;
    error: string;
} | {
    status: "refreshed";
    index: number;
    result: PersistedRefreshResult;
};
export declare function findAccountIndexByIdentity(accounts: RefreshAccountIdentity[], identity: RefreshAccountIdentity): number;
/**
 * Refreshes one account and persists the rotated credential before reporting
 * success. Disabled standalone accounts are skipped: refreshing them is wrong
 * (they may intentionally retain a dead duplicate credential), while disabled
 * siblings sharing an enabled account's consumed token are still updated by
 * `coordinatePersistedRefresh()` so the shared credential remains consistent.
 *
 * `includeDisabled` opts back in for diagnostics that must validate a
 * retained credential — an auto-disabled sole account is otherwise a dead
 * end (#288). Validating is not re-enabling: the rotation persists onto the
 * record but `enabled` stays false.
 */
export declare function refreshAndPersistAccount(account: RefreshAccountInput, options?: {
    includeDisabled?: boolean;
}): Promise<AccountRefreshOutcome>;
export declare function buildRefreshInputs(accounts: AccountMetadataV3[]): RefreshAccountInput[];
