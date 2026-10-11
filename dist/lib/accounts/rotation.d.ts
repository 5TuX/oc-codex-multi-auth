/**
 * Rotation + rate-limit + cooldown surface for {@link AccountManager}.
 *
 * Pure logic module: all state mutations land on a shared {@link AccountState}
 * reference. Integrates with the health and token-bucket trackers in
 * `lib/rotation.ts` (note: that file is the hybrid selection algorithm; this
 * module is the manager-facing wrapper that wires it to `AccountState`).
 */
import type { ModelFamily } from "../prompts/codex.js";
import { type HybridSelectionOptions } from "../rotation.js";
import type { CooldownReason } from "../storage.js";
import { type RateLimitReason } from "./rate-limits.js";
import type { AccountState, ManagedAccount } from "./state.js";
import type { CustomSelectionRequest } from "../custom-rotation/selection.js";
export declare class AccountRotation {
    private readonly state;
    constructor(state: AccountState);
    getCustomCandidates(request: CustomSelectionRequest): readonly ManagedAccount[];
    acceptCustomCandidate(account: ManagedAccount, request: CustomSelectionRequest): ManagedAccount | null;
    /**
     * Whether an account can serve a request for this (family, model) right now:
     * enabled, not rate-limited (real server 429s tracked in rateLimitResetTimes),
     * not cooling down, AND its in-memory local token bucket has a token.
     *
     * The token-bucket check is what keeps a locally-depleted account out of
     * selection. It is intentionally evaluated here (in-memory, per-process)
     * rather than by writing a synthetic window into the persisted
     * rateLimitResetTimes — that would leak a per-process proactive-limiter
     * signal into the cross-process accounts file and spuriously rate-limit
     * server-healthy accounts in other processes.
     */
    private isSelectable;
    private getPreferredSelectableIndices;
    private isInSelectionPool;
    getCurrentOrNextForFamily(family: ModelFamily, model?: string | null, preferredAccountIds?: readonly string[], strictPreferredPool?: boolean, excludedIndices?: ReadonlySet<number>): ManagedAccount | null;
    getNextForFamily(family: ModelFamily, model?: string | null): ManagedAccount | null;
    /**
     * Health/token/freshness-weighted selection. The historical default.
     *
     * When at least one account is selectable this returns the best-scoring one.
     * When NONE is — every account disabled, rate-limited, quota-exhausted or
     * cooling down — `selectHybridAccount` deliberately falls back to the
     * least-recently-used account instead of returning null, because retrying a
     * blocked account beats refusing to send anything (a single-account pool has
     * nowhere to fail over to, and a persisted block can outlive the limit that
     * caused it).
     *
     * So a returned account is NOT a promise that it is selectable. Callers that
     * need that guarantee must consult `getSelectionExplainability`, which is
     * what `codex-doctor` does. {@link getCurrentOrNextForFamilySticky} and
     * {@link getCurrentOrNextForFamily} return null in the same situation.
     *
     * The request path overrides this last-resort behavior: when the fallback
     * account is marked ineligible in the selection explainability, the request
     * loop discards it instead of sending it upstream, so an all-blocked pool
     * waits out (or fails on) the block rather than retrying it — which is also
     * what allows model fallback to degrade the model when every account is
     * blocked. The last-resort retry still applies to callers that do not
     * re-check eligibility (for example `codex-doctor` probing).
     */
    getCurrentOrNextForFamilyHybrid(family: ModelFamily, model?: string | null, options?: HybridSelectionOptions, preferredAccountIds?: readonly string[], strictPreferredPool?: boolean, excludedIndices?: ReadonlySet<number>): ManagedAccount | null;
    /**
     * Drain-first ("sticky") selection for issue #183.
     *
     * Stays on the current account for the family while it remains healthy
     * (not disabled, not rate-limited for this family/model, not cooling down).
     * When the current account is unavailable, it picks the *lowest-indexed*
     * available account rather than spreading load. This concentrates traffic
     * on as few accounts as possible so the remaining accounts keep their
     * quota in reserve — staggering weekly-quota cooldowns instead of
     * exhausting every account simultaneously (the round-robin failure mode the
     * issue describes).
     *
     * Returns null when no account is available (every account disabled,
     * rate-limited, or cooling down), like `getCurrentOrNextForFamily`, so the
     * request loop's wait/retry logic is unchanged.
     *
     * Note this is NOT the whole-pool-blocked behaviour of
     * {@link getCurrentOrNextForFamilyHybrid}: that selector deliberately falls
     * back to the least-recently-used account rather than hard-failing, on the
     * grounds that retrying a blocked account beats refusing to send anything at
     * all — which matters most for a single-account pool, where there is nothing
     * to fail over to. The two strategies disagree here on purpose; an earlier
     * version of this comment claimed they agreed.
     */
    getCurrentOrNextForFamilySticky(family: ModelFamily, model?: string | null, preferredAccountIds?: readonly string[], strictPreferredPool?: boolean, excludedIndices?: ReadonlySet<number>): ManagedAccount | null;
    recordSuccess(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    recordRateLimit(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    recordFailure(account: ManagedAccount, family: ModelFamily, model?: string | null): void;
    consumeToken(account: ManagedAccount, family: ModelFamily, model?: string | null): boolean;
    /**
     * Refund a token consumed within the refund window (30 seconds).
     * Use this when a request fails due to network errors (not rate limits).
     * @returns true if refund was successful, false if no valid consumption found
     */
    refundToken(account: ManagedAccount, family: ModelFamily, model?: string | null): boolean;
    markRateLimited(account: ManagedAccount, retryAfterMs: number, family: ModelFamily, model?: string | null): void;
    /**
     * The quota keys a (family, model) block covers: the family-wide key, plus
     * the model-scoped one when a model is named.
     */
    private getBlockedQuotaKeys;
    /**
     * Write a rate-limit reset for `key`, keeping whichever block runs longer.
     *
     * Every writer goes through here so a later, shorter block can never shorten
     * an existing one: a concurrent in-flight request that lands a plain 429 with
     * a 30s retry-after must not pull a week-long weekly-quota block forward
     * (issue #218). A stale past value can never win, because any reset written
     * here is at or after `nowMs()`, and expired entries are dropped by
     * `clearExpiredRateLimits` on the next selection pass anyway.
     *
     * @returns true when the stored reset moved later.
     */
    private extendRateLimitReset;
    markRateLimitedWithReason(account: ManagedAccount, retryAfterMs: number, family: ModelFamily, reason: RateLimitReason, model?: string | null): void;
    /**
     * Block an account until a quota window the backend reported as fully spent
     * resets (issue #218).
     *
     * Primary/secondary subscription windows are account-wide, irrespective of
     * the request's family/model. Keep their absolute reset monotonically in
     * `quotaExhaustedUntil`, persisted separately from transient server 429s and
     * expired by `clearExpiredQuotaExhaustion`. Legacy family/model arguments
     * remain accepted, but cannot narrow the subscription block's scope.
     * Reject implausible timestamps using the parser's horizon guard so a bad
     * header cannot strand an account indefinitely.
     *
     * @returns true when a new (or longer) block was written.
     */
    markQuotaExhausted(account: ManagedAccount, resetAtMs: number, _family: ModelFamily, _model?: string | null): boolean;
    markAccountCoolingDown(account: ManagedAccount, cooldownMs: number, reason: CooldownReason): void;
    /**
     * Mark every in-memory account sharing a refresh token as cooling down.
     * @returns Number of live accounts updated.
     */
    markAccountsWithRefreshTokenCoolingDown(refreshToken: string, cooldownMs: number, reason: CooldownReason): number;
    getMinWaitTimeForFamily(family: ModelFamily, model?: string | null, accountIds?: readonly string[]): number;
}
