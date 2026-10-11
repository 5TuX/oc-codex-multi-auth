/** Stable model-pool identities for individual ChatGPT accounts and Business seats. */
import { extractAccountUserId } from "../auth/token-utils.js";
const BUSINESS_SEAT_PREFIX = "seat:";
/** True when a stored pool entry is already a member-scoped seat key. */
export function isSeatPoolKey(key) {
    return key.trim().startsWith(BUSINESS_SEAT_PREFIX);
}
export function getModelPoolAccountKey(account) {
    const accountId = account.accountId?.trim();
    // Same resolution order as every other member-id read in the codebase:
    // persisted value first, then the bearer token. Without the fallback a
    // record that never passed through the normalize backfill would silently
    // produce the workspace-wide key, which matches EVERY seat in that workspace.
    const accountUserId = account.accountUserId?.trim() ||
        extractAccountUserId(account.accessToken ?? account.access);
    if (accountUserId) {
        return `${BUSINESS_SEAT_PREFIX}${JSON.stringify([accountId ?? "", accountUserId])}`;
    }
    return accountId || undefined;
}
export function matchesModelPoolAccountKey(account, key) {
    const normalizedKey = key.trim();
    if (!normalizedKey)
        return false;
    if (getModelPoolAccountKey(account) === normalizedKey)
        return true;
    // Legacy pools stored only accountId, which intentionally matches every
    // Business seat in that workspace until the next pool mutation migrates it.
    return account.accountId?.trim() === normalizedKey;
}
export function expandLegacyModelPoolKeys(keys, accounts) {
    const expanded = [];
    for (const rawKey of keys) {
        const key = rawKey.trim();
        if (!key)
            continue;
        const matchingKeys = accounts
            .filter((account) => matchesModelPoolAccountKey(account, key))
            .map(getModelPoolAccountKey)
            .filter((candidate) => candidate !== undefined);
        expanded.push(...(matchingKeys.length > 0 ? matchingKeys : [key]));
    }
    return [...new Set(expanded)];
}
//# sourceMappingURL=pool-identity.js.map