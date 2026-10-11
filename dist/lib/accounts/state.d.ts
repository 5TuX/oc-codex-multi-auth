/**
 * In-memory account registry for {@link AccountManager}.
 *
 * Owns the mutable account list, per-family cursors/active indices, and
 * auxiliary in-memory state (toast debounce, auth-failure counters).
 * Other account services (persistence, rotation, recovery) receive a reference
 * to an `AccountState` instance and mutate it through this narrow surface.
 */
import { type ModelFamily } from "../prompts/codex.js";
import type { AccountIdSource, OAuthAuthDetails } from "../types.js";
import { type RateLimitReason } from "./rate-limits.js";
import type { AccountStorageV3, CooldownReason, RateLimitStateV3 } from "../storage.js";
export interface ManagedAccount {
    index: number;
    accountId?: string;
    accountUserId?: string;
    organizationId?: string;
    accountIdSource?: AccountIdSource;
    accountLabel?: string;
    planType?: string;
    accountTags?: string[];
    accountNote?: string;
    email?: string;
    refreshToken: string;
    enabled?: boolean;
    access?: string;
    expires?: number;
    oauthScope?: string;
    /** When the refresh token was last rotated (ms since epoch); see AccountMetadataV3. */
    tokenRotatedAt?: number;
    addedAt: number;
    lastUsed: number;
    lastSwitchReason?: "rate-limit" | "initial" | "rotation";
    lastRateLimitReason?: RateLimitReason;
    rateLimitResetTimes: RateLimitStateV3;
    quotaExhaustedUntil?: number;
    /** When the quota-exhaustion stamp was written; see AccountMetadataV3. */
    quotaExhaustedStampAt?: number;
    /** Doctor-clear tombstone; see AccountMetadataV3. */
    quotaExhaustedClearedAt?: number;
    coolingDownUntil?: number;
    cooldownReason?: CooldownReason;
}
export interface AccountSelectionExplainability {
    index: number;
    enabled: boolean;
    isCurrentForFamily: boolean;
    eligible: boolean;
    reasons: string[];
    healthScore: number;
    tokensAvailable: number;
    rateLimitedUntil?: number;
    quotaExhaustedUntil?: number;
    coolingDownUntil?: number;
    cooldownReason?: CooldownReason;
    lastUsed: number;
}
export declare function hasMissingScopeReauthNote(accountNote: string | undefined): boolean;
/**
 * Removes a re-auth note this class previously appended, preserving any
 * operator-authored text that came before it. `appendReauthNote` always appends
 * its sentence last, so everything from the marker onward is ours to drop.
 */
export declare function stripReauthNote(accountNote: string | undefined): string | undefined;
/**
 * Markers plugin code writes onto records it disables itself, so an
 * `enabled: false` it produced stays distinguishable from the operator's own
 * choice — which the load/repair paths honor as intentional (#288). A bare
 * `enabled: false` had meant "operator did it", leaving auto-disabled
 * accounts unexplainable in diagnostics and unreachable except via the TUI.
 * Re-enabling strips the marker; operator text around it survives.
 */
export declare const AUTH_FAILURE_DISABLE_NOTE_MARKER = "Disabled automatically after repeated authentication failures.";
export declare const WORKSPACE_DEACTIVATED_NOTE_MARKER = "Disabled automatically after workspace deactivation.";
declare const AUTO_DISABLE_NOTE_MARKERS: readonly ["Disabled automatically after repeated authentication failures.", "Disabled automatically after workspace deactivation."];
export declare function hasAuthFailureDisableNote(accountNote: string | undefined): boolean;
export declare function hasAutoDisableNote(accountNote: string | undefined): boolean;
/** Reason string for the selection explainability `reasons` list. */
export declare function describeDisabledReason(accountNote: string | undefined): string;
export declare function appendAutoDisableNote(accountNote: string | undefined, marker: (typeof AUTO_DISABLE_NOTE_MARKERS)[number]): string;
/**
 * Removes only the auto-disable sentence, wherever it sits — operator text
 * before it and a later re-auth sentence after it both survive, unlike the
 * cut-to-end semantics `stripReauthNote` gets away with by always appending
 * last.
 */
export declare function stripAutoDisableNote(accountNote: string | undefined): string | undefined;
export declare class AccountState {
    accounts: ManagedAccount[];
    cursorByFamily: Record<ModelFamily, number>;
    currentAccountIndexByFamily: Record<ModelFamily, number>;
    lastToastAccountIndex: number;
    lastToastTime: number;
    authFailuresByRefreshToken: Map<string, number>;
    /**
     * Per-refresh-token promise chain used to serialize concurrent
     * `incrementAuthFailures` calls. Prevents lost updates when two org-variant
     * accounts that share a refresh token observe an auth failure at once — see
     * the lost-update fix for shared-refresh-token accounts.
     */
    incrementAuthFailuresChain: Map<string, Promise<number>>;
    /**
     * Set when `initializeFromStorage` re-enabled an account that an earlier
     * build had wrongly disabled for missing scopes. The repair happens in
     * memory, so it must be flushed to disk or every surface that reads storage
     * directly keeps showing the stale disabled state and re-auth note.
     * `consumeScopeRepairs()` clears it, so the extra write happens once.
     */
    private scopeRepairsPending;
    /**
     * Identity keys of accounts this manager pushed in memory that no persisted
     * record is known to carry yet — the host OAuth credential bootstrap is the
     * main one. A live save takes membership from the on-disk store, so without
     * this marker the very save meant to persist such an account would drop it.
     * Persistence consumes the keys once the merged write carries the account.
     */
    private readonly addedAccountIdentities;
    markAccountAdded(account: ManagedAccount): void;
    peekAddedAccountIdentities(): ReadonlySet<string>;
    consumeAddedAccountIdentities(): void;
    consumeScopeRepairs(): boolean;
    initializeFromStorage(authFallback: OAuthAuthDetails | undefined, stored: AccountStorageV3 | null | undefined): void;
    hasRefreshToken(refreshToken: string): boolean;
    getAccountCount(): number;
    getActiveIndexForFamily(family: ModelFamily): number;
    getAccountsSnapshot(): ManagedAccount[];
    getSelectionExplainability(family: ModelFamily, model?: string | null, now?: number): AccountSelectionExplainability[];
    setActiveIndex(index: number): ManagedAccount | null;
    getCurrentAccountForFamily(family: ModelFamily): ManagedAccount | null;
    shouldShowAccountToast(accountIndex: number, debounceMs?: number): boolean;
    markToastShown(accountIndex: number): void;
    updateFromAuth(account: ManagedAccount, auth: OAuthAuthDetails): void;
    /**
     * After a refresh rotates the refresh token on `account`, update every OTHER
     * account that still holds the pre-rotation token so the shared credential
     * stays consistent across org-variant siblings.
     */
    private propagateRotatedRefreshTokenToSiblings;
    toAuthDetails(account: ManagedAccount): OAuthAuthDetails;
    markSwitched(account: ManagedAccount, reason: "rate-limit" | "initial" | "rotation", family: ModelFamily): void;
    removeAccount(account: ManagedAccount): boolean;
    removeAccountByIndex(index: number): boolean;
    setAccountEnabled(index: number, enabled: boolean): ManagedAccount | null;
    /**
     * Check whether a cooldown window is still active for the given account.
     * Clears expired cooldowns as a side-effect so that stale `coolingDownUntil`
     * timestamps do not leak into snapshots or persistence.
     */
    isAccountCoolingDown(account: ManagedAccount): boolean;
    clearAccountCooldown(account: ManagedAccount): void;
    /**
     * Shared predicate used by rotation and diagnostic paths: is this account
     * usable for the given family/model right now? Combines enabled flag,
     * rate-limit expiry, and cooldown.
     */
    isEligibleForFamily(account: ManagedAccount, family: ModelFamily, model?: string | null): boolean;
}
export {};
