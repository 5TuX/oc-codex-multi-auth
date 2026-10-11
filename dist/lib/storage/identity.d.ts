/**
 * Account identity + dedup helpers.
 *
 * Split out of `lib/storage.ts` in RC-2. This module is pure and synchronous:
 * it owns the identity-key hierarchy (`organizationId` + `accountId` +
 * `accountUserId`, then `refreshToken`) and the dedup + merge rules used by `normalizeAccountStorage`
 * and the import transaction.
 *
 * The two public exports that were already re-exported from `lib/storage.ts`
 * (`deduplicateAccounts`, `deduplicateAccountsByEmail`) keep their original
 * shape so external callers can import them via either the barrel or this
 * submodule.
 */
import type { AccountMetadataV3 } from "./migrations.js";
export type AccountLike = {
    organizationId?: string;
    accountId?: string;
    accountUserId?: string;
    accountIdSource?: AccountMetadataV3["accountIdSource"];
    accountLabel?: string;
    email?: string;
    refreshToken: string;
    addedAt?: number;
    lastUsed?: number;
    enabled?: boolean;
};
export declare function getWorkspaceIdentityKey(account: {
    organizationId?: string;
    accountId?: string;
    accountUserId?: string;
    refreshToken: string;
}): string;
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function clampIndex(index: number, length: number): number;
export declare function toAccountIdentityKeys(account: Pick<AccountMetadataV3, "organizationId" | "accountId" | "accountUserId" | "refreshToken">): string[];
export declare function toAccountIdentityKey(account: Pick<AccountMetadataV3, "organizationId" | "accountId" | "accountUserId" | "refreshToken">): string | undefined;
export declare function extractActiveKeys(accounts: unknown[], activeIndex: number): string[];
export declare function findAccountIndexByIdentityKeys(accounts: Pick<AccountMetadataV3, "organizationId" | "accountId" | "accountUserId" | "refreshToken">[], identityKeys: string[]): number;
/**
 * Removes duplicate accounts, keeping the most recently used entry for each unique key.
 * Deduplication identity hierarchy: workspace + member identity, then refreshToken.
 * @param accounts - Array of accounts to deduplicate
 * @returns New array with duplicates removed
 */
export declare function deduplicateAccounts<T extends {
    organizationId?: string;
    accountId?: string;
    accountUserId?: string;
    refreshToken: string;
    lastUsed?: number;
    addedAt?: number;
}>(accounts: T[]): T[];
/**
 * Removes duplicate legacy accounts by email, keeping the most recently used entry.
 * Accounts with organizationId/accountId are never merged by email to avoid collapsing workspace variants.
 * Accounts without email are always preserved.
 * @param accounts - Array of accounts to deduplicate
 * @returns New array with email duplicates removed
 */
export declare function deduplicateAccountsByEmail<T extends {
    organizationId?: string;
    accountId?: string;
    email?: string;
    lastUsed?: number;
    addedAt?: number;
}>(accounts: T[]): T[];
/**
 * Applies storage deduplication semantics used by normalize/import paths.
 * 1) Dedupe only exact workspace/member identity duplicates, then refreshToken,
 *    preserving distinct workspace variants that share a refresh token.
 * 2) Then apply legacy email dedupe only for entries that still do not have organizationId/accountId.
 */
export declare function deduplicateAccountsForStorage<T extends AccountLike & {
    email?: string;
}>(accounts: T[]): T[];
