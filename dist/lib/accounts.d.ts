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
import type { Auth } from "@opencode-ai/sdk";
import { type AccountStorageV3, type CooldownReason } from "./storage.js";
import type { HybridSelectionOptions } from "./rotation.js";
import type { RotationStrategy } from "./config.js";
import type { CustomSelectionRequest } from "./custom-rotation/selection.js";
import type { OAuthAuthDetails } from "./types.js";
import type { ModelFamily } from "./prompts/codex.js";
import { type AccountSelectionExplainability, type ManagedAccount } from "./accounts/state.js";
import { type RateLimitReason } from "./accounts/rate-limits.js";
export type { AccountSelectionExplainability, ManagedAccount } from "./accounts/state.js";
export { extractAccountId, extractAccountEmail, getAccountIdCandidates, selectBestAccountCandidate, shouldUpdateAccountIdFromToken, resolveRequestAccountId, sanitizeEmail, type AccountIdCandidate, } from "./auth/token-utils.js";
export { parseRateLimitReason, getQuotaKey, clampNonNegativeInt, clearExpiredRateLimits, isRateLimitedForQuotaKey, isRateLimitedForFamily, formatWaitTime, type QuotaKey, type BaseQuotaKey, type RateLimitReason, type RateLimitState, type RateLimitedEntity, } from "./accounts/rate-limits.js";
export { lookupCodexCliTokensByEmail, type CodexCliTokenCacheEntry, } from "./accounts/recovery.js";
export declare class AccountManager {
    private readonly state;
    private readonly persistence;
    private readonly rotation;
    private readonly recovery;
    /**
     * Alias to `state.authFailuresByRefreshToken`. Preserved as a property on
     * the orchestrator so that pre-split tests and diagnostics that reach in
     * via `Reflect.get(manager, "authFailuresByRefreshToken")` continue to see
     * the live map without edits. Internal use only.
     */
    private get authFailuresByRefreshToken();
    constructor(authFallback?: OAuthAuthDetails, stored?: AccountStorageV3 | null);
    static loadFromDisk(authFallback?: OAuthAuthDetails): Promise<AccountManager>;
    hasRefreshToken(refreshToken: string): boolean;
    getAccountCount(): number;
    getActiveIndex(): number;
    getActiveIndexForFamily(family: ModelFamily): number;
    getAccountsSnapshot(): ManagedAccount[];
    /** The live account at this index, for a caller that chose it from the selection explainability. */
    getAccountAt(index: number): ManagedAccount | null;
    getSelectionExplainability(family: ModelFamily, model?: string | null, now?: number): AccountSelectionExplainability[];
    setActiveIndex(index: number): ManagedAccount | null;
    getCurrentAccount(): ManagedAccount | null;
    getCurrentAccountForFamily(family: ModelFamily): ManagedAccount | null;
    shouldShowAccountToast(accountIndex: number, debounceMs?: number): boolean;
    markToastShown(accountIndex: number): void;
    updateFromAuth(account: ManagedAccount, auth: OAuthAuthDetails): void;
    toAuthDetails(account: ManagedAccount): Auth;
    markSwitched(account: ManagedAccount, reason: "rate-limit" | "initial" | "rotation", family: ModelFamily): void;
    removeAccount(account: ManagedAccount): boolean;
    removeAccountByIndex(index: number): boolean;
    disableAccountsWithSameRefreshToken(account: ManagedAccount): number;
    disableAccountsByWorkspaceIdentity(account: ManagedAccount): number;
    setAccountEnabled(index: number, enabled: boolean): ManagedAccount | null;
    isAccountCoolingDown(account: ManagedAccount): boolean;
    clearAccountCooldown(account: ManagedAccount): void;
    getCustomCandidates(request: CustomSelectionRequest): readonly ManagedAccount[];
    acceptCustomCandidate(account: ManagedAccount, request: CustomSelectionRequest): ManagedAccount | null;
    getCurrentOrNext(): ManagedAccount | null;
    getCurrentOrNextForFamily(family: ModelFamily, model?: string | null): ManagedAccount | null;
    getNextForFamily(family: ModelFamily, model?: string | null): ManagedAccount | null;
    getCurrentOrNextForFamilyHybrid(family: ModelFamily, model?: string | null, options?: HybridSelectionOptions): ManagedAccount | null;
    getCurrentOrNextForFamilySticky(family: ModelFamily, model?: string | null): ManagedAccount | null;
    /**
     * Strategy-aware account selection (issue #183). Routes to the configured
     * load-balancing algorithm. `hybrid` is the historical default and is
     * behavior-identical to calling {@link getCurrentOrNextForFamilyHybrid}
     * directly, so existing callers/tests are unaffected.
     */
    getAccountForStrategy(strategy: RotationStrategy, family: ModelFamily, model?: string | null, options?: HybridSelectionOptions, preferredAccountIds?: readonly string[], poolMode?: "preferred" | "strict", excludedIndices?: ReadonlySet<number>): ManagedAccount | null;
    recordSuccess(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    recordRateLimit(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    recordFailure(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    consumeToken(account: ManagedAccount, family: ModelFamily, model?: string | null): boolean;
    refundToken(account: ManagedAccount, family: ModelFamily, model?: string | null): boolean;
    markRateLimited(account: ManagedAccount, retryAfterMs: number, family: ModelFamily, model?: string | null): void;
    markRateLimitedWithReason(account: ManagedAccount, retryAfterMs: number, family: ModelFamily, reason: RateLimitReason, model?: string | null): void;
    /**
     * Block an account until a fully-spent quota window resets. See
     * {@link AccountRotation.markQuotaExhausted}.
     *
     * @returns true when a new (or longer) block was written.
     */
    markQuotaExhausted(account: ManagedAccount, resetAtMs: number, family: ModelFamily, model?: string | null): boolean;
    markAccountCoolingDown(account: ManagedAccount, cooldownMs: number, reason: CooldownReason): void;
    markAccountsWithRefreshTokenCoolingDown(refreshToken: string, cooldownMs: number, reason: CooldownReason): number;
    getMinWaitTime(): number;
    getMinWaitTimeForFamily(family: ModelFamily, model?: string | null, accountIds?: readonly string[]): number;
    saveToDisk(): Promise<void>;
    saveToDiskDebounced(delayMs?: number): void;
    flushPendingSave(): Promise<void>;
    disposeShutdownHandler(externalReload?: boolean, clearedSnapshots?: Readonly<AccountStorageV3["accounts"]>): void;
    incrementAuthFailures(account: ManagedAccount): Promise<number>;
    getAuthFailures(account: ManagedAccount): number;
    clearAuthFailures(account: ManagedAccount): void;
    removeAccountsWithSameRefreshToken(account: ManagedAccount): number;
    removeAccountsByWorkspaceIdentity(account: ManagedAccount): number;
}
export declare function formatAccountLabel(account: {
    email?: string;
    accountId?: string;
    accountUserId?: string;
    accountLabel?: string;
} | undefined, index: number, options?: {
    maskEmail?: boolean;
    peerAccounts?: readonly ({
        accountUserId?: string;
    } | undefined)[];
}): string;
export declare function formatCooldown(account: {
    coolingDownUntil?: number;
    cooldownReason?: string;
}, now?: number): string | null;
