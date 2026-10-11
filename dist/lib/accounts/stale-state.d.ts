/**
 * Account stale-state repair helpers used by `codex-doctor --fix`.
 *
 * Background (issue #171): after a successful token refresh, an account can
 * still be skipped by rotation because it carries stale account-health state
 * that nothing in the normal request path clears:
 *
 *  - an `auth-failure` / `network-error` cooldown left over from a transient
 *    failure that has since recovered, and/or
 *  - `rateLimitResetTimes` entries that point at a future reset that no longer
 *    reflects real quota (the user's own `--pure` requests succeed, proving the
 *    account is usable).
 *
 * A successful token refresh is strong, explicit evidence that the credential
 * is alive, so when the user runs the explicit `--fix` repair we clear that
 * stale state for the refreshed account. The next genuine 401/429 re-establishes
 * accurate state, so the blast radius of clearing is a single real retry.
 *
 * These helpers are intentionally pure (operate on a mutable record, return what
 * changed) so they can be unit-tested without the AccountManager or the plugin
 * runtime.
 */
/**
 * Subset of a stored account record this module mutates. Kept permissive so the
 * doctor can pass `AccountMetadataV3` records without coupling to the full
 * schema shape.
 */
export interface StaleStateAccount {
    coolingDownUntil?: number;
    cooldownReason?: string;
    rateLimitResetTimes?: Record<string, number | undefined>;
    quotaExhaustedUntil?: number;
    quotaExhaustedStampAt?: number;
    quotaExhaustedClearedAt?: number;
}
export interface ClearedStaleState {
    /** True when an active cooldown window was cleared. */
    clearedCooldown: boolean;
    /** Number of rate-limit reset entries removed. */
    clearedRateLimitKeys: number;
    /** True when an active account-wide quota-exhaustion stamp was cleared. */
    clearedQuotaExhaustion: boolean;
}
/**
 * Clear stale health state from an account that has just been proven healthy
 * (its token refresh succeeded this run).
 *
 * - Removes any cooldown (`coolingDownUntil` / `cooldownReason`). A successful
 *   refresh contradicts both `auth-failure` (auth just worked) and
 *   `network-error` (the network call just worked) cooldowns.
 * - Removes all `rateLimitResetTimes` entries. On an explicit repair, a stale
 *   future-dated reset is exactly the dark-state bug from #171; the next real
 *   429 re-sets it accurately.
 *
 * @returns what was cleared, so the caller can report it.
 */
export declare function clearRefreshedAccountStaleState(account: StaleStateAccount): ClearedStaleState;
export declare function clearUnchangedRecoveryState(account: StaleStateAccount, observed: StaleStateAccount): StaleStateAccount | undefined;
export interface StaleStateRepairSummary {
    /** Accounts that had an active cooldown cleared. */
    cooldownsCleared: number;
    /** Total rate-limit reset entries removed across all accounts. */
    rateLimitKeysCleared: number;
    /** Accounts that had an active quota-exhaustion stamp cleared. */
    quotaExhaustionsCleared: number;
}
/**
 * Apply {@link clearRefreshedAccountStaleState} across the given accounts and
 * return an aggregate summary. Only call this for accounts whose refresh
 * succeeded.
 */
export declare function clearRefreshedAccountsStaleState(accounts: StaleStateAccount[]): StaleStateRepairSummary;
/**
 * Subset of a stored account used for duplicate detection. Permissive on
 * purpose so callers can pass full `AccountMetadataV3` records.
 */
export interface DuplicateScanAccount {
    organizationId?: string;
    accountIdSource?: string;
    email?: string;
    enabled?: boolean;
}
/**
 * Detect disabled `token`-source duplicates that shadow an enabled,
 * org-backed real account sharing the same email (issue #171).
 *
 * A fresh host re-login can mint a `accountIdSource: "token"` entry from the
 * raw auth token instead of updating the matching `org`-source account. When
 * that token entry is left `enabled: false`, it is harmless for rotation but
 * pollutes diagnostics (account count, TUI quota cache index) and confuses
 * recovery. We only *flag* these — never auto-remove — because a `token`-source
 * and an `org`-source record are linked solely by email, and email-only merges
 * are exactly what multi-org handling (#64) must not collapse blindly. Removal
 * stays a user decision (`codex-remove`).
 *
 * @returns the 0-based indexes of disabled token-source duplicates.
 */
export declare function findDisabledTokenSourceDuplicates(accounts: DuplicateScanAccount[]): number[];
export interface BusinessMemberCredentialScanAccount {
    accountId?: string;
    accountUserId?: string;
    organizationId?: string;
    accessToken?: string;
    email?: string;
}
/**
 * Find records whose OAuth tokens resolve to the same member of the same
 * Business workspace. Such records cannot consume separate quotas and must be
 * re-authenticated independently. Records that differ only by organizationId
 * are legitimate workspace variants of a single grant and are not reported.
 */
export declare function findConflictingBusinessMemberCredentials(accounts: BusinessMemberCredentialScanAccount[]): number[][];
/**
 * Subset of a stored account used for the read-only stale-state diagnostic.
 */
export interface StaleStateScanAccount {
    enabled?: boolean;
    coolingDownUntil?: number;
    cooldownReason?: string;
    rateLimitResetTimes?: Record<string, number | undefined>;
    quotaExhaustedUntil?: number;
}
/**
 * Identify enabled accounts that are currently blocked ONLY by a future-dated
 * cooldown and/or future-dated rate-limit reset — i.e. the exact dark state from
 * issue #171 that `codex-doctor --fix` can recover (a successful token refresh
 * proves the credential is alive, so the block is stale).
 *
 * A future-dated `quotaExhaustedUntil` is deliberately NOT flagged here: unlike
 * the legacy blanket `rateLimitResetTimes` stamps, quota exhaustion is written
 * only by authoritative sources (the usage poller and quota-429 response
 * headers with horizon guards), so a future stamp is real, not stale #171
 * state. Quota-blocked accounts are surfaced separately through
 * {@link findQuotaExhaustedAccounts} so diagnostics do not tell a user with a
 * genuine week-long block that the block is stale.
 *
 * This is read-only (it mutates nothing) so both `codex-health` and the
 * non-`--fix` `codex-doctor` path can surface the finding and point the user at
 * the repair. Expired cooldowns / rate-limits are ignored because the normal
 * request path already clears those.
 *
 * @returns the 0-based indexes of accounts blocked by recoverable stale state.
 */
export declare function findStaleRecoverableAccounts(accounts: StaleStateScanAccount[], now?: number): number[];
/**
 * Identify enabled accounts carrying an active (future-dated) account-wide
 * quota-exhaustion stamp. These blocks are authoritative, not stale #171
 * state — they are written only by the usage poller or a quota 429 response
 * and re-establish themselves after being cleared — so diagnostics must label
 * them as quota exhaustion rather than "recoverable stale state".
 *
 * Read-only: mutates nothing. `codex-doctor --fix` still clears these stamps
 * after a successful token verification (an explicit user action), which is
 * why they are worth surfacing, but the next quota 429 or usage poll simply
 * re-stamps the account.
 *
 * @returns the 0-based indexes of enabled accounts blocked by quota exhaustion.
 */
export declare function findQuotaExhaustedAccounts(accounts: StaleStateScanAccount[], now?: number): number[];
/**
 * Subset of a stored account used for the absorbed-credential diagnostic.
 */
export interface FreshCredentialScanAccount {
    enabled?: boolean;
    expiresAt?: number;
    accessToken?: string;
}
/**
 * Identify accounts that are DISABLED yet carry a fresh (unexpired) access
 * token — the fingerprint of a user-disabled account that absorbed a newer
 * enabled re-login during dedup (issue #171).
 *
 * The merge is intentionally fail-closed: a user-disabled record stays disabled
 * even after it absorbs a fresh credential. That is correct, but it is silent —
 * the absorbing record is org-source AND disabled, so it is skipped by every
 * other #171 diagnostic and the user gets no hint that a fresh login they just
 * performed landed on a deliberately-disabled slot. This read-only detector
 * surfaces that case so tooling can suggest re-enabling the account if intended.
 *
 * Read-only: mutates nothing, and never re-enables (that stays a user decision).
 *
 * @returns the 0-based indexes of disabled accounts holding a fresh credential.
 */
export declare function findDisabledAccountsWithFreshCredential(accounts: FreshCredentialScanAccount[], now?: number): number[];
