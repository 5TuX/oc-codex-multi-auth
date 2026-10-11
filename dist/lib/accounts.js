/**
 * AccountManager — slim orchestrator that composes four domain services:
 *
 *  - {@link AccountState}       — in-memory account registry + per-family indices
 *  - {@link AccountPersistence} — debounced disk saves, shutdown-flush lifecycle
 *  - {@link AccountRotation}    — selection, rate-limit and cooldown management
 *  - {@link AccountRecovery}    — auth-failure tracking, Codex CLI hydration,
 *                                  merge-safe removal
 *
 * This module preserves the public API that existed before the RC-7 split so
 * that `new AccountManager(...)` and every instance method keeps working for
 * external callers (`index.ts`, `lib/tools/*`, `lib/parallel-probe.ts`, etc.).
 */
import { loadAccounts } from "./storage.js";
import { AccountPersistence, } from "./accounts/persistence.js";
import { AccountRecovery } from "./accounts/recovery.js";
import { AccountRotation } from "./accounts/rotation.js";
import { AccountState, } from "./accounts/state.js";
import { formatWaitTime } from "./accounts/rate-limits.js";
import { nowMs } from "./utils.js";
import { logWarn } from "./logger.js";
import { formatSeatSuffix, resolveDisplayEmail } from "./account-display.js";
export { extractAccountId, extractAccountEmail, getAccountIdCandidates, selectBestAccountCandidate, shouldUpdateAccountIdFromToken, resolveRequestAccountId, sanitizeEmail, } from "./auth/token-utils.js";
export { parseRateLimitReason, getQuotaKey, clampNonNegativeInt, clearExpiredRateLimits, isRateLimitedForQuotaKey, isRateLimitedForFamily, formatWaitTime, } from "./accounts/rate-limits.js";
export { lookupCodexCliTokensByEmail, } from "./accounts/recovery.js";
export class AccountManager {
    state;
    persistence;
    rotation;
    recovery;
    /**
     * Alias to `state.authFailuresByRefreshToken`. Preserved as a property on
     * the orchestrator so that pre-split tests and diagnostics that reach in
     * via `Reflect.get(manager, "authFailuresByRefreshToken")` continue to see
     * the live map without edits. Internal use only.
     */
    get authFailuresByRefreshToken() {
        return this.state.authFailuresByRefreshToken;
    }
    constructor(authFallback, stored) {
        this.state = new AccountState();
        this.persistence = new AccountPersistence(this.state);
        this.rotation = new AccountRotation(this.state);
        this.recovery = new AccountRecovery(this.state, this.persistence);
        this.state.initializeFromStorage(authFallback, stored);
    }
    static async loadFromDisk(authFallback) {
        const stored = await loadAccounts();
        const manager = new AccountManager(authFallback, stored);
        await manager.recovery.hydrateFromCodexCli();
        // `initializeFromStorage` repairs accounts an earlier build wrongly
        // disabled for missing scopes, but only in memory. Flush it once so the
        // TUI, the CLI, and any other direct storage reader stop reporting the
        // stale disabled state and re-auth note (issue #213). A failed write is
        // not fatal: the in-memory repair still holds for this process, and the
        // next load repeats it.
        if (manager.state.consumeScopeRepairs()) {
            try {
                await manager.persistence.saveToDisk(true);
            }
            catch (error) {
                logWarn(`Failed to persist OAuth scope repair: ${error?.message ?? String(error)}`);
            }
        }
        return manager;
    }
    // ----- state delegations -----
    hasRefreshToken(refreshToken) {
        return this.state.hasRefreshToken(refreshToken);
    }
    getAccountCount() {
        return this.state.getAccountCount();
    }
    getActiveIndex() {
        return this.state.getActiveIndexForFamily("codex");
    }
    getActiveIndexForFamily(family) {
        return this.state.getActiveIndexForFamily(family);
    }
    getAccountsSnapshot() {
        return this.state.getAccountsSnapshot();
    }
    /** The live account at this index, for a caller that chose it from the selection explainability. */
    getAccountAt(index) {
        return this.state.accounts[index] ?? null;
    }
    getSelectionExplainability(family, model, now = nowMs()) {
        return this.state.getSelectionExplainability(family, model, now);
    }
    setActiveIndex(index) {
        return this.state.setActiveIndex(index);
    }
    getCurrentAccount() {
        return this.state.getCurrentAccountForFamily("codex");
    }
    getCurrentAccountForFamily(family) {
        return this.state.getCurrentAccountForFamily(family);
    }
    shouldShowAccountToast(accountIndex, debounceMs = 30000) {
        return this.state.shouldShowAccountToast(accountIndex, debounceMs);
    }
    markToastShown(accountIndex) {
        this.state.markToastShown(accountIndex);
    }
    updateFromAuth(account, auth) {
        this.state.updateFromAuth(account, auth);
    }
    toAuthDetails(account) {
        return this.state.toAuthDetails(account);
    }
    markSwitched(account, reason, family) {
        this.state.markSwitched(account, reason, family);
    }
    removeAccount(account) {
        return this.state.removeAccount(account);
    }
    removeAccountByIndex(index) {
        return this.state.removeAccountByIndex(index);
    }
    disableAccountsWithSameRefreshToken(account) {
        return this.recovery.disableAccountsWithSameRefreshToken(account);
    }
    disableAccountsByWorkspaceIdentity(account) {
        return this.recovery.disableAccountsByWorkspaceIdentity(account);
    }
    setAccountEnabled(index, enabled) {
        return this.state.setAccountEnabled(index, enabled);
    }
    isAccountCoolingDown(account) {
        return this.state.isAccountCoolingDown(account);
    }
    clearAccountCooldown(account) {
        this.state.clearAccountCooldown(account);
    }
    // ----- rotation delegations -----
    getCustomCandidates(request) {
        return this.rotation.getCustomCandidates(request);
    }
    acceptCustomCandidate(account, request) {
        return this.rotation.acceptCustomCandidate(account, request);
    }
    getCurrentOrNext() {
        return this.rotation.getCurrentOrNextForFamily("codex");
    }
    getCurrentOrNextForFamily(family, model) {
        return this.rotation.getCurrentOrNextForFamily(family, model);
    }
    getNextForFamily(family, model) {
        return this.rotation.getNextForFamily(family, model);
    }
    getCurrentOrNextForFamilyHybrid(family, model, options) {
        return this.rotation.getCurrentOrNextForFamilyHybrid(family, model, options);
    }
    getCurrentOrNextForFamilySticky(family, model) {
        return this.rotation.getCurrentOrNextForFamilySticky(family, model);
    }
    /**
     * Strategy-aware account selection (issue #183). Routes to the configured
     * load-balancing algorithm. `hybrid` is the historical default and is
     * behavior-identical to calling {@link getCurrentOrNextForFamilyHybrid}
     * directly, so existing callers/tests are unaffected.
     */
    getAccountForStrategy(strategy, family, model, options, preferredAccountIds, poolMode = "preferred", excludedIndices) {
        switch (strategy) {
            case "custom": {
                const request = { family, model, preferredAccountIds, poolMode, excludedIndices };
                const candidate = this.rotation.getCustomCandidates(request)[0];
                return candidate ? this.rotation.acceptCustomCandidate(candidate, request) : null;
            }
            case "sticky":
                return this.rotation.getCurrentOrNextForFamilySticky(family, model, preferredAccountIds, poolMode === "strict", excludedIndices);
            case "round-robin":
                return this.rotation.getCurrentOrNextForFamily(family, model, preferredAccountIds, poolMode === "strict", excludedIndices);
            default:
                return this.rotation.getCurrentOrNextForFamilyHybrid(family, model, options, preferredAccountIds, poolMode === "strict", excludedIndices);
        }
    }
    recordSuccess(account, family, model) {
        this.rotation.recordSuccess(account, family, model);
    }
    recordRateLimit(account, family, model) {
        this.rotation.recordRateLimit(account, family, model);
    }
    recordFailure(account, family, model) {
        this.rotation.recordFailure(account, family, model);
    }
    consumeToken(account, family, model) {
        return this.rotation.consumeToken(account, family, model);
    }
    refundToken(account, family, model) {
        return this.rotation.refundToken(account, family, model);
    }
    markRateLimited(account, retryAfterMs, family, model) {
        this.rotation.markRateLimited(account, retryAfterMs, family, model);
    }
    markRateLimitedWithReason(account, retryAfterMs, family, reason, model) {
        this.rotation.markRateLimitedWithReason(account, retryAfterMs, family, reason, model);
    }
    /**
     * Block an account until a fully-spent quota window resets. See
     * {@link AccountRotation.markQuotaExhausted}.
     *
     * @returns true when a new (or longer) block was written.
     */
    markQuotaExhausted(account, resetAtMs, family, model) {
        return this.rotation.markQuotaExhausted(account, resetAtMs, family, model);
    }
    markAccountCoolingDown(account, cooldownMs, reason) {
        this.rotation.markAccountCoolingDown(account, cooldownMs, reason);
    }
    markAccountsWithRefreshTokenCoolingDown(refreshToken, cooldownMs, reason) {
        return this.rotation.markAccountsWithRefreshTokenCoolingDown(refreshToken, cooldownMs, reason);
    }
    getMinWaitTime() {
        return this.rotation.getMinWaitTimeForFamily("codex");
    }
    getMinWaitTimeForFamily(family, model, accountIds) {
        return this.rotation.getMinWaitTimeForFamily(family, model, accountIds);
    }
    // ----- persistence delegations -----
    async saveToDisk() {
        await this.persistence.saveToDisk();
    }
    saveToDiskDebounced(delayMs = 500) {
        this.persistence.saveToDiskDebounced(delayMs);
    }
    async flushPendingSave() {
        await this.persistence.flushPendingSave();
    }
    disposeShutdownHandler(externalReload = false, clearedSnapshots) {
        this.persistence.disposeShutdownHandler(externalReload, clearedSnapshots);
    }
    // ----- recovery delegations -----
    async incrementAuthFailures(account) {
        return this.recovery.incrementAuthFailures(account);
    }
    getAuthFailures(account) {
        return this.recovery.getAuthFailures(account);
    }
    clearAuthFailures(account) {
        this.recovery.clearAuthFailures(account);
    }
    removeAccountsWithSameRefreshToken(account) {
        return this.recovery.removeAccountsWithSameRefreshToken(account);
    }
    removeAccountsByWorkspaceIdentity(account) {
        return this.recovery.removeAccountsByWorkspaceIdentity(account);
    }
}
export function formatAccountLabel(account, index, options = {}) {
    const accountLabel = account?.accountLabel?.trim();
    const email = resolveDisplayEmail(account?.email, options.maskEmail ?? false);
    const accountId = account?.accountId?.trim();
    const idSuffix = accountId
        ? accountId.length > 6
            ? accountId.slice(-6)
            : accountId
        : null;
    // `accountId` names the workspace, which every member of a Business
    // workspace shares. Without the seat, four distinct members printed one
    // identical `id:` string (see `formatSeatSuffix`).
    const seatSuffix = formatSeatSuffix(account?.accountUserId, options.peerAccounts?.map((peer) => peer?.accountUserId));
    const details = [];
    if (accountLabel)
        details.push(accountLabel);
    if (email)
        details.push(email);
    if (idSuffix) {
        // The id has always rendered bare when it is the only thing known about
        // an account. Once a seat sits beside it, an unprefixed pair of suffixes
        // would not say which is which, so the prefix goes back on.
        const idIsOnlyDetail = !accountLabel && !email && !seatSuffix;
        details.push(idIsOnlyDetail ? idSuffix : `id:${idSuffix}`);
    }
    if (seatSuffix)
        details.push(`seat:${seatSuffix}`);
    if (details.length === 0)
        return `Account ${index + 1}`;
    return `Account ${index + 1} (${details.join(", ")})`;
}
export function formatCooldown(account, now = nowMs()) {
    if (typeof account.coolingDownUntil !== "number")
        return null;
    const remaining = account.coolingDownUntil - now;
    if (remaining <= 0)
        return null;
    const reason = account.cooldownReason ? ` (${account.cooldownReason})` : "";
    return `${formatWaitTime(remaining)}${reason}`;
}
//# sourceMappingURL=accounts.js.map