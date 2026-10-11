/**
 * One constant line describing the whole account pool.
 *
 * The prompt status line names whichever account served the most recent
 * request, so on a pool of several accounts it changes identity as rotation
 * moves - and a reader who wants to know where the pool stands has to watch it
 * long enough to see every account go past. This module renders the pool
 * instead: every account at once, in a fixed order, so the line only changes
 * when the underlying quota does.
 *
 * ```text
 * 24%: #1 5x 13%, #2 20x 100% 3d 1r, #3 1x 12%
 * ```
 *
 * The leading figure is the pool total, and it is a WEIGHTED mean rather than
 * a plain one. A Pro seat spent to 50% has given up twenty times the capacity
 * a Business Standard seat does at 50%, so averaging the percentages
 * unweighted describes a pool nobody has; `lib/plan-allotment.ts` supplies the
 * per-plan ratio the mean is taken over.
 *
 * Percentages follow `quotaDisplay` like every other surface, so the same pool
 * reads `24%` as headroom or `76%` as consumption. Only the wording changes:
 * every decision here - which window governs an account, which account is
 * closest to recovering, whether a reset time is worth the characters - stays
 * keyed on the percentage remaining.
 *
 * Everything below is pure string work over already-gathered readings, so the
 * whole rendering can be exercised without a network, a clock or a terminal.
 */
import { type CreditsBalance } from "./codex-credits.js";
export { computeWeightedLeftPercent, resolveGoverningWindow } from "./quota-capacity.js";
import { toQuotaDisplayPercent, type QuotaDisplayMode } from "./quota-display.js";
/**
 * Under `resetTimes: "low"`, only an account at or below this headroom gets
 * its reset time printed.
 *
 * Every account has a reset, and printing all of them triples the length of
 * the line to say "this account you are not waiting on recovers at some point
 * too". The threshold matches the one the single-account status line already
 * uses to decide the same question, so an account near exhaustion reads the
 * same way in either mode. `resetTimes: "always"` opts out of the threshold,
 * because 90% spent with an hour to go and 90% spent with six days to go are
 * not the same situation.
 */
export declare const OVERVIEW_RESET_LEFT_PERCENT = 25;
export type QuotaOverviewWindow = {
    /** Percentage of this window still free, 0-100. */
    leftPercent?: number;
    /** Unrounded headroom retained for threshold decisions, not display. */
    exactLeftPercent?: number;
    resetAtMs?: number;
};
export type QuotaOverviewAccount = {
    /** 1-based position, as `codex-list` and `codex-switch` number accounts. */
    index: number;
    /**
     * The account's own name for itself: a `codex-label` label when one is
     * set, otherwise whatever identity the account storage carries. May be an
     * email address, which is why every rendering of it goes through
     * {@link resolveAccountName} rather than printing it directly.
     */
    label?: string;
    /** ChatGPT email, used by the reset-credit line and as a label fallback. */
    email?: string;
    /** `plan_type` as reported by `/wham/usage`, used for the weighting only. */
    planType?: string;
    windows: readonly QuotaOverviewWindow[];
    /** Banked rate-limit resets redeemable now, rendered as `1r`. */
    resetCredits?: number;
    /** Explicit applicability; null is unknown, absence identifies a legacy cache. */
    resetCreditsApplicable?: number | null;
    /** Codex credit balance, listed by the `credits` screen. */
    credits?: CreditsBalance;
};
/** How the accounts are arranged on the line. */
export type QuotaOverviewLayout = 
/** One segment per account: `#1 13%, #2 100% 3d`. */
"accounts"
/** Accounts sharing a percentage collapse: `100% 3d 4d 5d`. */
 | "aggregate"
/** No accounts at all, just how many there are: `3 accounts`. */
 | "count" | "total";
/** What identifies an account on the line. */
export type QuotaOverviewNames = 
/** `#1`, the number `codex-switch` takes. */
"number"
/** The account's label, or its email's local part: `damian`, `work`. */
 | "label"
/** Nothing; the accounts are told apart by position alone. */
 | "none";
/** The order accounts appear in. */
export type QuotaOverviewOrder = "number"
/** Least headroom first - the accounts rotation is about to stop using. */
 | "most-used"
/** Most headroom first - the accounts with work left in them. */
 | "least-used"
/** Soonest reset first. Accounts with no known reset sort last. */
 | "renewing-earliest"
/** Latest reset first, which is redemption order for a banked reset. */
 | "renewing-latest";
/** Which accounts get a reset countdown printed beside them. */
export type QuotaOverviewResetTimes = "never"
/** Only accounts at or below {@link OVERVIEW_RESET_LEFT_PERCENT}. */
 | "low" | "always";
export type QuotaOverviewOptions = {
    mode: QuotaDisplayMode;
    layout: QuotaOverviewLayout;
    names: QuotaOverviewNames;
    order: QuotaOverviewOrder;
    /** `5x` / `20x` allotment badges beside each account. */
    multipliers: boolean;
    /** `66% of 65x`: what the pool the percentage is taken over adds up to. */
    allotment: boolean;
    resetTimes: QuotaOverviewResetTimes;
    /** `1r` for redeemable banked resets. */
    resetCredits: boolean;
    /** `true`: next signed movement; `all`: positive incremental capacity returns. */
    recovery: boolean | "all";
    /** Masks any email this line would otherwise print in full. */
    maskEmail?: boolean;
    now?: number;
};
export type QuotaOverviewRecovery = {
    /**
     * Pool-total movement at {@link atMs}, in percentage points, always
     * positive - it is capacity returning. Legacy `recovery: true` follows the
     * display-direction sign; `all` always renders capacity with a plus sign.
     */
    deltaPercent: number;
    atMs: number;
};
/**
 * Render a duration the way a countdown reads: the largest unit that fits,
 * floored, so `2d` never claims more time remains than actually does. A gap
 * under a minute still reads `1m` rather than `0m`, because a reset that has
 * not happened yet is not zero away.
 */
export declare function formatCompactDuration(ms: number): string | undefined;
/**
 * What the pool the percentage is taken over adds up to, in 1x seats.
 *
 * Deliberately the same sum {@link computeWeightedLeftPercent} divides by, and
 * over the same accounts, so `66% of 65x` is one statement rather than two
 * that can disagree. An account whose plan states no ratio therefore
 * contributes its fallback weight here exactly as it does to the mean.
 */
export declare function computePoolAllotment(accounts: readonly QuotaOverviewAccount[]): number | undefined;
/**
 * The next moment the pool gets capacity back, and how much.
 *
 * Only the window that actually resets is refilled, and the account's
 * governing window is then resolved again: an account whose 5-hour window
 * resets while its weekly window is still spent gains nothing, and reporting
 * the 5-hour refill as pool recovery would promise headroom that does not
 * arrive. Movement below one point is dropped rather than rendered as `+0%`.
 */
export declare function resolveQuotaOverviewRecovery(accounts: readonly QuotaOverviewAccount[], now?: number): QuotaOverviewRecovery | undefined;
/**
 * Whether nothing in the pool has capacity left.
 *
 * This is the condition the reset-credit line exists for: while any account
 * can still serve a request, which one recovers when is a detail, and once
 * none can it is the only question left. Accounts whose quota could not be
 * read do not count either way - an unknown reading is not evidence of
 * exhaustion, but it is not capacity either, so a pool of nothing but
 * unreadable accounts is reported as not spent rather than as dead.
 */
export declare function isPoolFullySpent(accounts: readonly QuotaOverviewAccount[]): boolean;
/**
 * Arrange the accounts for display.
 *
 * Every comparison falls back to the account number, so two accounts reading
 * the same percentage never trade places between renders. An order that let
 * them would reintroduce exactly the movement this mode exists to remove.
 */
export declare function orderOverviewAccounts(accounts: readonly QuotaOverviewAccount[], order: QuotaOverviewOrder): QuotaOverviewAccount[];
/**
 * What this account is called on the line.
 *
 * Under `label` a user-set label wins, because it is the one name the user
 * chose; an account that only knows its email falls back to that email's local
 * part, and an account with neither falls back to its number rather than
 * rendering nothing - a nameless segment in a named line reads as a missing
 * account.
 */
export declare function resolveAccountName(account: QuotaOverviewAccount, names: QuotaOverviewNames, maskEmail?: boolean): string | undefined;
/** `3 accounts` -> `3 acct.` -> `3`, in the order they are given up. */
export type QuotaOverviewCountStyle = "long" | "short" | "bare";
/**
 * Every rendering of this pool, longest first.
 *
 * The caller takes the first that fits its width. Detail is dropped in the
 * order that costs a reader the least: the recovery clause and then the
 * annotations (badges, banked resets) that sit beside a figure which stays
 * either way, then the per-account breakdown, leaving the pool total - the one
 * thing the line exists to say - as the last to go.
 *
 * Order is preference, NOT length: a stripped-down rung is occasionally a
 * character or two longer than the rung above it. Sorting by length instead
 * would let a form win or lose by two characters as a percentage crosses from
 * `9%` to `10%`, and the line would change shape while the reader watches -
 * the flicker this whole mode exists to remove.
 *
 * Candidates never exceed what {@link QuotaOverviewOptions} asked for, so a
 * switch left off cannot reappear because the terminal happened to be wide.
 */
export declare function formatQuotaOverviewCandidates(accounts: readonly QuotaOverviewAccount[], options: QuotaOverviewOptions): string[];
/** The fullest rendering, for surfaces with a line to themselves. */
export declare function formatQuotaOverviewText(accounts: readonly QuotaOverviewAccount[], options: QuotaOverviewOptions): string;
/**
 * Every rendering of the banked reset credits, longest first.
 *
 * ```text
 * Free resets: 6d 1r damian@nowaker.net, 4d 2r work@example.com
 * ```
 *
 * Sorted by the LATEST reset first, which is redemption order rather than
 * reading order: redeeming a credit on an account that renews by itself
 * tomorrow throws the credit away, while the account six days out is the one
 * worth spending it on.
 *
 * Returns nothing unless the weighted-usage threshold is met and a credit is
 * known to be applicable. The default threshold preserves full exhaustion.
 */
export declare function formatQuotaResetsCandidates(accounts: readonly QuotaOverviewAccount[], options: Pick<QuotaOverviewOptions, "maskEmail"> & {
    names?: QuotaOverviewNames;
    now?: number;
    minUsedPercent?: number;
}): string[];
/**
 * Every rendering of the accounts that still hold Codex credits, largest
 * balance first - the counterpart of {@link formatQuotaResetsCandidates} for
 * the other way out of a spent pool.
 *
 * ```text
 * Codex credits: 62,500 damian@nowaker.net, 1,200 work@example.com
 * ```
 *
 * Largest balance first, which is the order `spendCredits` draws on them.
 * Shown under the same threshold as the resets screen, and only for accounts
 * with a balance to spend.
 */
export declare function formatQuotaCreditsCandidates(accounts: readonly QuotaOverviewAccount[], options: Pick<QuotaOverviewOptions, "maskEmail"> & {
    names?: QuotaOverviewNames;
    minUsedPercent?: number;
}): string[];
/**
 * Headroom of the account with the most room left, for the caller that
 * colours the line.
 *
 * Deliberately the best account rather than the worst: a pool is only in
 * trouble when nothing in it has room left, and keying on the worst account
 * would paint the line red for one spent seat that rotation has already
 * stopped selecting while every other account serves requests normally.
 */
export declare function resolveQuotaOverviewTonePercent(accounts: readonly QuotaOverviewAccount[]): number | undefined;
/** Re-exported so callers rendering a bare total need only this module. */
export { toQuotaDisplayPercent };
