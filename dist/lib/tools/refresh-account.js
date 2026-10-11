/**
 * Shared token refresh persistence for the account-management tools.
 *
 * OpenAI refresh tokens are single-use and rotate on exchange. Production
 * refreshes flow through `coordinatePersistedRefresh()`, which owns the
 * authoritative reload, exchange, and durable commit under one lease.
 */
import { extractAccountUserId } from "../auth/token-utils.js";
import { findAccountIndexByIdentityKeys, toAccountIdentityKeys, } from "../storage/identity.js";
import { coordinatePersistedRefresh } from "../storage/coordinated-refresh.js";
export function findAccountIndexByIdentity(accounts, identity) {
    return findAccountIndexByIdentityKeys(accounts, toAccountIdentityKeys(identity));
}
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
export async function refreshAndPersistAccount(account, options) {
    const { index, identity } = account;
    if (account.enabled === false && options?.includeDisabled !== true) {
        return { status: "skipped", index, identity };
    }
    let refreshResult;
    try {
        refreshResult = await coordinatePersistedRefresh(identity);
    }
    catch (error) {
        return {
            status: "failed",
            index,
            identity,
            error: error instanceof Error ? error.message : String(error),
        };
    }
    if (refreshResult.type !== "success") {
        return {
            status: "failed",
            index,
            identity,
            error: refreshResult.message ?? refreshResult.reason ?? "token refresh failed",
        };
    }
    return {
        status: "refreshed",
        index,
        result: {
            index,
            identity,
            refreshToken: refreshResult.refresh,
            accessToken: refreshResult.access,
            expiresAt: refreshResult.expires,
            rotatedAt: refreshResult.rotatedAt,
            persisted: true,
        },
    };
}
export function buildRefreshInputs(accounts) {
    return accounts.map((account, index) => ({
        index,
        enabled: account.enabled,
        identity: {
            organizationId: account.organizationId,
            accountId: account.accountId,
            accountUserId: account.accountUserId?.trim() || extractAccountUserId(account.accessToken),
            refreshToken: account.refreshToken,
        },
    }));
}
//# sourceMappingURL=refresh-account.js.map