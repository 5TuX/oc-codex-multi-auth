import { type CreditsBalance } from "./codex-credits.js";
import { type QuotaDisplayMode } from "./quota-display.js";
import { type AccountMetadataV3, type AccountStorageV3 } from "./storage.js";
export type UsageWindow = {
    used_percent?: number;
    limit_window_seconds?: number;
    reset_at?: number;
    reset_after_seconds?: number;
} | null;
export type LimitWindow = {
    usedPercent?: number;
    windowMinutes?: number;
    resetAtMs?: number;
    /** Set only when true; see {@link isUsageWindowNotStarted}. */
    notStarted?: boolean;
};
export type UsageRateLimit = {
    primary_window?: UsageWindow;
    secondary_window?: UsageWindow;
} | null;
export type UsageCredits = {
    has_credits?: boolean;
    unlimited?: boolean;
    balance?: string | null;
} | null;
export type UsageResetCredits = {
    available_count?: number | null;
    applicable_available_count?: number | null;
} | null;
export type UsagePayload = {
    plan_type?: string;
    rate_limit?: UsageRateLimit;
    code_review_rate_limit?: UsageRateLimit;
    additional_rate_limits?: Array<{
        limit_name?: string;
        metered_feature?: string;
        rate_limit?: UsageRateLimit;
    }> | null;
    credits?: UsageCredits;
    rate_limit_reset_credits?: UsageResetCredits;
};
export type UsageLimitPayload = {
    name: string;
    windowMinutes: number | null;
    usedPercent: number | null;
    leftPercent: number | null;
    resetAtMs: number | null;
    /** Nothing drawn yet, so `resetAtMs` is only "now plus the window". */
    notStarted: boolean;
    summary: string;
};
export type AdditionalUsageLimit = {
    name: string;
    window: LimitWindow;
};
export type ResetCreditCounts = {
    available: number;
    /** `null` when the server stated a count this code cannot read. */
    applicableNow: number | null;
};
export type CodexUsageSummary = {
    planType: string | null;
    credits: string | null;
    /** The same balance as {@link credits}, structured for decisions. */
    creditsBalance: CreditsBalance | null;
    resetCredits: ResetCreditCounts | null;
    primary: LimitWindow;
    secondary: LimitWindow;
    codeReview: LimitWindow;
    additionalLimits: AdditionalUsageLimit[];
    limits: UsageLimitPayload[];
};
export type EnsureCodexUsageAccessTokenResult = {
    accessToken: string;
    refreshed: boolean;
    persisted: boolean;
};
export type UsageAccountSelection = {
    index: number;
    account: AccountMetadataV3;
};
export declare function getUsageLeftPercent(usedPercent: number | undefined): number | undefined;
export declare function formatUsageWindowLabel(windowMinutes: number | undefined): string;
export declare function formatUsageReset(resetAtMs: number | undefined): string | undefined;
/**
 * Whether a window has not been drawn from since it last reset.
 *
 * A rolling window only starts counting at its first request, so an untouched
 * one reports `reset_after_seconds` equal to its full length and a `reset_at`
 * of "now plus the window" that moves forward on every read. Printing that as
 * a renewal date states a moment nothing is scheduled for. A window used even
 * fractionally - `used_percent` can round to `0` - has a countdown shorter
 * than its length and is started.
 */
export declare function isUsageWindowNotStarted(window: UsageWindow | undefined, nowMs?: number): boolean;
export declare function mapUsageWindow(window: UsageWindow | undefined): LimitWindow;
/**
 * `2026-10-03 14:26:48` in local time. Seconds are printed only when the
 * timestamp is whole seconds, which is what `reset_at` carries; a reset derived
 * from `reset_after_seconds` inherits the request's latency, so its seconds
 * digit would claim a precision nobody measured.
 */
export declare function formatUsageResetTimestamp(resetAtMs: number): string | undefined;
/**
 * `6d 21h`, `4h 12m`, `1d 30m`, `35m`: the two largest non-zero units,
 * floored, so a countdown never claims more time remains than does. Under a
 * minute still reads `1m`, because a reset that has not happened yet is not
 * zero away.
 */
export declare function formatUsageCountdown(ms: number): string | undefined;
export declare function formatUsageLimitTitle(windowMinutes: number | undefined, fallback?: string): string;
export declare function formatUsageLimitSummary(window: LimitWindow, mode?: QuotaDisplayMode): string;
export declare function toUsageLimitPayload(name: string, window: LimitWindow, mode?: QuotaDisplayMode): UsageLimitPayload;
export declare function formatUsageCredits(credits: UsageCredits): string | undefined;
/**
 * The `Credits` line for an account: its balance, or null when it has none to
 * spend. Like the `Resets` line it is left out rather than printed as zero, so
 * the accounts that can still pay for a turn stand out.
 */
export declare function formatSpendableUsageCredits(balance: CreditsBalance | null | undefined): string | null;
/**
 * The `credits` field of `limits --json`: the balance in the raw form the
 * endpoint stated and `codex-limits` already emits (`"62500"`, `unlimited`,
 * `available`), or null when the account has none to spend. Display grouping
 * stays out of it - callers parse the field as a number.
 */
export declare function spendableUsageCreditsValue(balance: CreditsBalance | null | undefined): string | null;
/**
 * Read the redeemable rate-limit resets the usage response already carries.
 *
 * These are a different currency from `credits`, and an account routinely
 * holds both readings at once: a spent purchase balance alongside banked
 * resets. Reporting only `credits` therefore says "you have nothing" while a
 * full reset is waiting to be redeemed.
 *
 * `applicable_available_count` is the subset redeemable right now, which is
 * smaller than the banked count whenever no window is exhausted yet. A
 * response that omits it predates the field rather than reporting zero, so it
 * defaults to the banked count - defaulting to zero would report every banked
 * reset as unusable. Omitted means absent OR null: this endpoint sends a
 * literal JSON null for a field it has no value for, which is how
 * `secondary_window` arrives on every single-window plan.
 *
 * A count the server did state and this code cannot read is a different thing,
 * and defaulting it would invent an answer. A negative, fractional,
 * non-numeric or larger-than-banked applicable count therefore reports
 * `applicableNow: null`, because over-reporting sends someone to redeem a
 * credit that is not there.
 *
 * Only `applicableNow` goes unknown, not the whole reading: the banked count
 * is a separate field that arrived intact, and dropping it would print
 * "Credits: 0" while a full reset waits to be redeemed - the exact failure
 * this function exists to fix. `codex-reset` reads the same banked total from
 * the list endpoint, so discarding it here would also make the two surfaces
 * disagree about the same account in the same session.
 */
export declare function parseUsageResetCredits(source: UsageResetCredits | undefined): ResetCreditCounts | null;
export declare function formatResetCredits(counts: ResetCreditCounts): string;
export declare function formatAdditionalUsageLimitName(name: string | undefined): string;
/**
 * A window reported with a length of zero is disabled for the plan (e.g. the
 * 5-hour window on plans where OpenAI has switched it off), not a window whose
 * length is merely unknown. It still reports `used_percent: 0`, so it has to be
 * rejected on the explicit zero length or it renders as a full quota.
 */
export declare function hasUsageWindow(window: LimitWindow): boolean;
/**
 * One account's contribution to a pool total: its plan, and the two windows
 * that govern ordinary model requests.
 *
 * Code review and the additional limits are deliberately absent. They do not
 * stop an ordinary request, so counting them would let a spent code-review
 * allowance report the pool as emptier than it is.
 */
export type UsagePoolMember = Pick<CodexUsageSummary, "planType" | "primary" | "secondary">;
export type UsagePoolSummary = {
    /** Weighted mean headroom across the counted accounts, 0-100. */
    leftPercent: number;
    /** What those accounts add up to in 1x seats: `81` renders as `81x`. */
    allotment: number;
    /** How many accounts both figures were taken over. */
    countedAccounts: number;
};
/**
 * What a set of accounts holds between them: one weighted percentage, and the
 * allotment that percentage is taken over.
 *
 * The weighting is the pool status line's rather than a second opinion on it.
 * A Pro seat spent to 50% has given up twenty times the capacity a Business
 * Standard seat does at 50%, so an unweighted average over mixed plans
 * describes a pool nobody has; delegating to `lib/quota-overview.ts` is what
 * keeps the figure `codex-limits` prints and the figure the prompt status line
 * shows from drifting apart.
 *
 * Returns nothing when no account reported a readable window. A quota that
 * could not be read is not capacity we know we have, and averaging over an
 * empty set would report `0%` as though the pool were spent.
 */
export declare function summarizeUsagePool(members: readonly UsagePoolMember[]): UsagePoolSummary | undefined;
/** `91% used of 81x across 11 accounts`. */
export declare function formatUsagePoolSummary(summary: UsagePoolSummary, mode?: QuotaDisplayMode): string;
/**
 * Return the latest valid reset time among fully spent ordinary Codex usage
 * windows. This deliberately accepts only the primary and secondary windows:
 * code-review and additional quotas do not govern ordinary model requests.
 *
 * The `/wham/usage` endpoint and request response headers describe the same
 * 5-hour/weekly quota state. Applying this result to rotation lets an explicit
 * `codex-limits` refresh protect paid Credits before the next model request.
 */
export declare function getUsageQuotaExhaustedResetAtMs(windows: readonly LimitWindow[], now?: number): number | undefined;
/**
 * Persist the account-wide subscription-quota exhaustion stamp on stored
 * entries sharing the queried usage quota. Rotation tracks each model family
 * independently in `rateLimitResetTimes`, whereas the `/wham/usage`
 * primary/secondary subscription quota is shared by all models — so it is
 * recorded ONCE, on the dedicated `quotaExhaustedUntil` field, rather than
 * forged into a per-family rate-limit block for every model. Read sites treat
 * an active stamp as a blocking condition reported separately from a transient
 * 429.
 *
 * The stored value is kept at its monotonic maximum, with the same validity
 * guards as {@link AccountRotation.markQuotaExhausted}: finite, strictly in the
 * future, and within {@link MAX_QUOTA_RESET_HORIZON_MS} so an absurd stamp
 * cannot strand the account.
 *
 * This uses a storage transaction rather than saving the caller's usage
 * snapshot: usage inspection can refresh a single-use token, while another
 * process can independently update credentials or account membership.
 */
export declare function persistUsageQuotaExhaustion(account: AccountMetadataV3, resetAtMs: number): Promise<boolean>;
export declare function isUsageQuotaRecovered(windows: readonly LimitWindow[]): boolean;
export declare function persistUsageQuotaRecovery(account: AccountMetadataV3): Promise<boolean>;
/**
 * How long an `autoRedeemResets` claim blocks the next spend for an account.
 * A weekly window cannot legitimately deplete twice within a week, so this
 * bounds the feature to at most one spend attempt per depleted window.
 */
export declare const AUTO_REDEEM_WEEKLY_COOLDOWN_MS: number;
/**
 * Claim an `autoRedeemResets` spend for this account, inside the storage lock
 * so two processes monitoring it cannot both pass. Returns `true` when this
 * caller holds the claim and may spend the credit; `false` when a claim is
 * already recorded inside the weekly cooldown.
 *
 * The claim stamps the attempt's own timestamp, not a server-reported window
 * boundary — `reset_at` can be absent and `reset_after_seconds` derivations
 * drift with every poll, so neither is a stable identity to key on.
 *
 * The claim is written BEFORE the credit is spent: marking only on success
 * would reopen the race (a second process's check lands before the first
 * process's marker). A failed spend therefore also burns the cooldown —
 * matching the documented "a failed redemption is not retried" semantics,
 * now across processes instead of only within one.
 */
export declare function persistAutoRedeemWeeklyClaim(account: AccountMetadataV3): Promise<boolean>;
/**
 * Reduce a `/wham/usage` document to the summary the callers render.
 *
 * The parameter is whatever `response.json()` produced: {@link fetchCodexUsage}
 * casts its result to {@link UsagePayload} without validating it, and a `200`
 * carrying the body `null` is valid JSON. The gateway in front of `/wham/usage`
 * is user-configurable (`OPENAI_BASE_URL`), so that is a reachable response and
 * not only a hypothetical. Every field *inside* the payload is already
 * null-tolerant; the payload itself was not, and dereferencing it threw
 * `Cannot read properties of null (reading 'rate_limit')`. A non-object payload
 * is now read as an empty document, which renders as "unavailable".
 */
export declare function parseCodexUsagePayload(payload: UsagePayload | null | undefined, mode?: QuotaDisplayMode): CodexUsageSummary;
/**
 * Whether a failed usage read says the account's credentials are dead, as
 * opposed to a timeout, a network error, a rate limit or an upstream outage.
 * Only the first means the account cannot serve requests until someone logs
 * in again: a refresh the token endpoint refused, an access token the backend
 * reports invalidated, or a deactivated workspace.
 */
export declare function isCodexCredentialFailure(error: unknown): boolean;
/**
 * One readable line out of a failed request's error text. The OAuth refresh
 * failure carries the endpoint's JSON body - pretty-printed, and cut to a
 * bounded length before it reaches here, so often not parseable - which renders
 * as a lone `{` on a report line. The human message inside it is what says
 * what happened, so it is read out of the body, whole or truncated. Text that
 * holds no such message is only collapsed onto one line.
 */
export declare function summarizeCodexErrorMessage(text: string, maxChars?: number): string;
/**
 * Build a safe error message from a failed Codex backend response.
 *
 * Shared with the reset-credit client in `lib/codex-reset.ts`: both talk to
 * `chatgpt.com/backend-api` with the same bearer credentials, so both must
 * scrub tokens out of an error body before it reaches tool output or logs.
 */
export declare function sanitizeCodexApiErrorMessage(status: number, bodyText: string): string;
export declare function isCodexAbortError(error: unknown): boolean;
export declare function fetchCodexUsage(params: {
    accountId: string;
    accessToken: string;
    organizationId: string | undefined;
    timeoutMs?: number;
    normalizeAccountErrors?: boolean;
    signal?: AbortSignal;
}): Promise<UsagePayload>;
/**
 * Names of the Business workspaces the token's user belongs to, keyed by
 * account id.
 *
 * `/wham/accounts/check` is the Codex backend's copy of the account list the
 * ChatGPT web app reads from `/backend-api/accounts/check`, and unlike that one
 * it accepts a Codex OAuth token rather than a browser session behind
 * Cloudflare. The list covers every workspace the user is a member of, not only
 * the one the token is bound to, so one answer can name several accounts.
 * Personal accounts carry no name and are left out.
 *
 * The name is chosen by the workspace owner and printed verbatim into a line,
 * so control characters are dropped and the length is bounded.
 */
export declare function fetchCodexWorkspaceNames(params: {
    accountId: string;
    accessToken: string;
    organizationId: string | undefined;
    timeoutMs?: number;
}): Promise<Map<string, string>>;
export declare function ensureCodexUsageAccessToken(params: {
    storage: AccountStorageV3;
    account: AccountMetadataV3;
}): Promise<EnsureCodexUsageAccessTokenResult>;
/**
 * Derive a stable usage-quota dedupe key for an account.
 *
 * Business members can share one `accountId` while each bearer token has a
 * distinct `accountUserId` and quota, so the seat id disambiguates members
 * WITHIN a workspace. It is APPENDED to the workspace identity rather than
 * replacing it: one OAuth grant can back several workspace variants that all
 * carry the same member id, and those still consume separate quotas. Older
 * records without a member id keep workspace-level dedup, then the refresh
 * token as a last resort.
 *
 * Keys are emitted as `JSON.stringify` arrays (tagged `"seat"`, `"workspace"`,
 * or `"refresh"`) so values containing delimiter characters cannot collide.
 *
 * @param account - Stored account metadata to derive the key from.
 * @returns A unique identity key, or `undefined` when the account carries no
 *   workspace identity and no refresh token.
 */
export declare function getUsageAccountDedupeKey(account: AccountMetadataV3): string | undefined;
/**
 * Collect the indices of accounts that represent distinct usage quotas.
 *
 * Disabled accounts are skipped. Accounts with no usable identity — no
 * `accountId`, no `organizationId`, and no `refreshToken`, i.e. those for which
 * {@link getUsageAccountDedupeKey} returns `undefined` — are also dropped, since
 * they cannot be attributed to a quota and have no token to query. Entries
 * sharing the same dedupe key are collapsed to a single index.
 *
 * When a workspace key appears more than once (e.g. an account re-added after a
 * token re-issue), the *last* (most recently added) occurrence is kept so the
 * freshest credential is queried — keeping the first occurrence could surface
 * an invalidated refresh token after re-auth. First-appearance order is still
 * used for display stability.
 *
 * @param storage - The account storage to scan.
 * @returns Storage indices of unique, enabled, identifiable usage accounts in
 *   first-appearance order, each pointing at its freshest occurrence.
 */
export declare function deduplicateUsageAccountIndices(storage: AccountStorageV3): number[];
/**
 * Resolve which account's usage quota should be shown as active.
 *
 * Starts from the persisted active index (preferring the Codex family index)
 * and then prefers the most-recently-used enabled account by `lastUsed`, so the
 * displayed quota tracks the credential actually serving requests. Disabled
 * accounts are ignored, and invalid/missing `lastUsed` values are treated as
 * oldest.
 *
 * @param storage - The account storage to inspect.
 * @returns The selected account and its index, or `null` when no enabled
 *   account is available.
 */
export declare function resolveCodexUsageActiveAccount(storage: AccountStorageV3): UsageAccountSelection | null;
export declare function resolveCodexUsageAccountId(params: {
    account: AccountMetadataV3;
    accessToken: string;
}): string | undefined;
export declare function createUsageAccountFingerprint(account: AccountMetadataV3): string;
