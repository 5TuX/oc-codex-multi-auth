/**
 * Codex credits: the balance a ChatGPT account spends once its plan's
 * 5-hour/weekly windows are used up.
 *
 * Plus/Pro subscribers normally never touch it, but OpenAI grants credits
 * (and sells them), and the Codex backend draws on them by itself: an account
 * at 100% of its plan window that holds a balance keeps answering
 * `codex/responses` with 200 and bills the turn to the balance. codex-rs sends
 * no opt-in for that; the backend decides. This plugin's
 * `quotaExhaustedUntil` block exists to stop exactly that spend, so a balance
 * is only ever drawn on when the user turns `spendCredits` on.
 *
 * The balance is read from two places that report the same thing:
 *
 * - `/wham/usage` → `credits: { has_credits, unlimited, balance }`
 * - every `codex/responses` reply → `x-codex-credits-has-credits`,
 *   `x-codex-credits-unlimited`, `x-codex-credits-balance` (what codex-rs
 *   parses in `codex-api/src/rate_limits.rs`)
 *
 * The backend updates the balance lazily, so a reading can overstate what is
 * left; a refused credits turn is therefore remembered as "no credits" until
 * the window it names resets.
 */
import type { AccountSelectionExplainability } from "./accounts/state.js";
export type CreditsBalance = {
    hasCredits: boolean;
    unlimited: boolean;
    /** Numeric balance when the backend stated one this code can read. */
    balance: number | null;
};
/** How long a reading is trusted before a turn is billed to it without reading it again. */
export declare const CREDITS_READING_TTL_MS: number;
/**
 * How old a reading may be and still be named in a message. Messages never
 * read the balance themselves: the quota poll reads every account on an
 * interval (30 minutes by default), so this spans a couple of polls.
 */
export declare const CREDITS_DISPLAY_MAX_AGE_MS: number;
/** How long a refused credits turn keeps an account out when the refusal names no reset. */
export declare const CREDITS_REFUSAL_DEFAULT_MS: number;
/** How long a backend "model not supported on this account" answer is remembered. */
export declare const MODEL_UNSUPPORTED_TTL_MS: number;
/**
 * Read a balance the backend stated. It arrives as a string (`"62500"`,
 * `"1234.5"`, occasionally currency-formatted like `"$5.00"`), so separators
 * and a currency sign are dropped before parsing. Anything else, including a
 * negative number, is unreadable rather than zero.
 */
export declare function parseCreditsAmount(value: unknown): number | null;
/** The `credits` object of a `/wham/usage` document, or null when it carries none. */
export declare function parseUsageCreditsBalance(source: {
    has_credits?: unknown;
    unlimited?: unknown;
    balance?: unknown;
} | null | undefined): CreditsBalance | null;
/**
 * The balance a `codex/responses` reply reports, or null when it carries no
 * credits headers. Like codex-rs, both booleans must be present for the
 * reading to count.
 */
export declare function parseCreditsHeaders(headers: Headers): CreditsBalance | null;
/**
 * Whether a reading says the account can pay for a turn with credits. A
 * stated balance decides; `has_credits` only speaks when no balance was
 * stated.
 */
export declare function hasSpendableCredits(balance: CreditsBalance | null | undefined): boolean;
/** `62,500`, `unlimited`, or `available` when the backend stated no number. */
export declare function formatCreditsBalance(balance: CreditsBalance): string;
/** `62.5k`-style form for the one-line status screens. */
export declare function formatCreditsBalanceCompact(balance: CreditsBalance): string;
/** Sort key: unlimited first, then the largest balance. */
export declare function creditsSortValue(balance: CreditsBalance | null | undefined): number;
type CreditsAccountIdentity = {
    accountId?: string;
    organizationId?: string;
    accountUserId?: string;
    email?: string;
};
/**
 * Per-seat key for the in-memory readings below. Deliberately free of token
 * material: refresh tokens rotate, and a key derived from one would forget
 * every reading at the next refresh.
 */
export declare function getCreditsAccountKey(account: CreditsAccountIdentity): string;
/**
 * The latest credits reading per account, shared by every surface in this
 * process (request path, quota poll, `codex-limits`). A refused credits turn
 * overrides any reading until its reset: the backend's own balance can still
 * claim credits the backend will not spend.
 */
export declare class CreditsLedger {
    private readonly now;
    private readonly ttlMs;
    private readonly readings;
    private readonly refusedUntil;
    constructor(now?: () => number, ttlMs?: number);
    record(key: string, balance: CreditsBalance | null): void;
    /** The reading taken within `maxAgeMs` (the time to live by default), if any. */
    get(key: string, maxAgeMs?: number): CreditsBalance | undefined;
    markRefused(key: string, until: number): void;
    isRefused(key: string): boolean;
    /** Spendable as far as this process knows: a fresh reading with credits and no refusal. */
    isSpendable(key: string): boolean;
    clear(): void;
}
/** Process-wide ledger; every surface that reads a balance records it here. */
export declare const creditsLedger: CreditsLedger;
/**
 * Accounts the backend told us cannot serve a model ("model not supported"),
 * remembered across requests. Without it a seat that is not entitled to the
 * requested model looks like a seat with plan quota left, and credits would
 * never be spent while it sits in the pool.
 */
export declare class ModelEntitlements {
    private readonly now;
    private readonly ttlMs;
    private readonly unsupportedUntil;
    constructor(now?: () => number, ttlMs?: number);
    private static key;
    markUnsupported(accountKey: string, model: string): void;
    isUnsupported(accountKey: string, model: string | undefined | null): boolean;
}
type ExplainedAccount = Pick<AccountSelectionExplainability, "index" | "eligible" | "reasons">;
/**
 * Whether an account can still serve on its plan quota at some point without
 * spending credits. Only a spent subscription window (`quota-exhausted`) says
 * it cannot; a throttle, a token bucket, or a network cooldown only delays it,
 * so credits wait for it. A disabled account and one whose login failed serve
 * nothing at all, so they hold no plan quota worth waiting for.
 */
export declare function hasPlanQuota(entry: ExplainedAccount): boolean;
export type CreditsPlan = 
/** An entitled account still has plan quota (or none qualifies for credits). */
{
    kind: "plan-quota-left";
}
/** Accounts to try on credits, in order. Unknown balances still need a read. */
 | {
    kind: "credits";
    indices: number[];
};
/**
 * Decide whether this request may be served on credits, and by whom.
 *
 * Credits are only spent once no account that is entitled to the model (and
 * inside its per-model pool, when one is strict) has plan quota left. The
 * accounts offered are the ones held back by nothing but their spent window,
 * not yet tried this request, not refused, and not known to hold a zero
 * balance - preferred-pool members first, then the largest known balance,
 * then the unknown ones the caller has to read before using.
 */
export declare function planCreditsFallback(explainability: readonly ExplainedAccount[], options: {
    attempted: ReadonlySet<number>;
    inPool: (index: number) => boolean;
    preferred?: (index: number) => boolean;
    unsupported: (index: number) => boolean;
    refused: (index: number) => boolean;
    balance: (index: number) => CreditsBalance | undefined;
}): CreditsPlan;
export type CreditsAccountSummary = {
    /** How the account is named in a message, e.g. `account 3 (o…@example.com)`. */
    label: string;
    balance: CreditsBalance;
};
/** `account 3 (62,500 credits), account 5 (unlimited credits)` */
export declare function formatCreditsAccountList(accounts: readonly CreditsAccountSummary[]): string;
/**
 * The sentence an all-accounts-out message ends with: where credits remain,
 * and how to use them when the setting is off. Empty when there is nothing
 * worth saying.
 */
export declare function formatCreditsOutOfQuotaHint(params: {
    spendCredits: boolean;
    accounts: readonly CreditsAccountSummary[];
}): string;
/** Toast shown when a turn is about to be paid with credits. */
export declare function formatServingOnCreditsToast(params: {
    label: string;
    balance: CreditsBalance | undefined;
}): string;
export {};
