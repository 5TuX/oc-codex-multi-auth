/**
 * Client for Codex banked rate-limit reset credits.
 *
 * OpenAI grants eligible ChatGPT plans a small number of "reset credits" that
 * clear the current rate-limit windows early. Redemption is exposed in the
 * Codex desktop app, the IDE extensions, and the Codex CLI `/usage` screen —
 * but not on a surface Linux users of this plugin can reach. This module wraps
 * the same two backend endpoints those clients use so `codex-reset` can list
 * and redeem credits:
 *
 * - `GET  /wham/rate-limit-reset-credits`          — list credits
 * - `POST /wham/rate-limit-reset-credits/consume`  — redeem one credit
 *
 * Both are undocumented and authenticate exactly like `/wham/usage` (see
 * `lib/codex-usage.ts`), so they share its bearer credentials, timeout, and
 * error-body sanitization. Redeeming is irreversible and consumes a real,
 * finite credit, so the redeem path is never taken implicitly — the caller must
 * pass an explicit confirmation (see `lib/tools/codex-reset.ts`).
 */
import { type CodexUsageSummary } from "./codex-usage.js";
/** Status string the backend uses for a credit that can still be redeemed. */
export declare const CODEX_RESET_CREDIT_AVAILABLE_STATUS = "available";
/** Raw credit entry as returned by the backend. */
export type CodexResetCreditEntry = {
    id?: string;
    status?: string;
    reset_type?: string;
    granted_at?: string;
    expires_at?: string;
    title?: string;
};
/** Raw list response. */
export type CodexResetCreditsPayload = {
    credits?: CodexResetCreditEntry[] | null;
    available_count?: number;
};
/** Raw consume response. */
export type CodexResetConsumePayload = {
    code?: string;
    windows_reset?: unknown;
    credit?: {
        id?: string;
        status?: string;
        redeemed_at?: string;
    } | null;
};
/** Normalized credit entry used by the tool and its JSON output. */
export type CodexResetCredit = {
    id: string;
    status: string;
    isAvailable: boolean;
    resetType: string | null;
    grantedAt: string | null;
    expiresAt: string | null;
    title: string | null;
};
export type CodexResetCreditsSummary = {
    availableCount: number;
    credits: CodexResetCredit[];
};
/** Outcome of choosing which credit to redeem. */
export type CodexResetCreditSelection = {
    type: "selected";
    credit: CodexResetCredit;
} | {
    type: "none-available";
} | {
    type: "not-found";
    creditId: string;
};
/**
 * Read a reset-credit counter the server stated.
 *
 * A count is a whole number of redeemable resets, so a negative, fractional,
 * non-finite or non-numeric value is a payload this code cannot read rather
 * than a zero: truncating `1.9` to `1` would silently paper over a malformed
 * response. Returning `null` leaves the fallback to each caller, which is why
 * the two reset-credit surfaces stay consistent about what "sane" means
 * without sharing a fallback policy they do not agree on. The list endpoint
 * below derives the count from the credits it also sent; the usage endpoint,
 * which sends no list, reports the count as unknown.
 */
export declare function normalizeResetCreditCount(value: unknown): number | null;
/**
 * Normalize the list response.
 *
 * The payload crosses an external HTTP boundary
 * (`OPENAI_BASE_URL`-style gateways can rewrite the body), so a null body or
 * a wrong-shaped `credits` field degrades to an empty summary instead of
 * throwing — the same boundary treatment `parseCodexUsagePayload` got in
 * 6.15.0.
 *
 * Credits without an `id` are dropped: an id is required to redeem, so an
 * entry lacking one is not actionable and would only pad the display. The
 * server's `available_count` is trusted when it is a sane number and otherwise
 * derived from the credits themselves, so a missing counter never understates
 * what the user actually has.
 */
export declare function parseCodexResetCredits(payload: CodexResetCreditsPayload | null | undefined): CodexResetCreditsSummary;
/**
 * Pick the credit to redeem.
 *
 * Only credits the backend still reports as available are eligible, so an
 * explicit `creditId` naming an expired or already-redeemed credit is reported
 * as not-found rather than being sent to the consume endpoint.
 */
export declare function selectRedeemableCredit(summary: CodexResetCreditsSummary, creditId?: string): CodexResetCreditSelection;
export declare function formatCodexResetCredit(credit: CodexResetCredit): string;
/**
 * Idempotency key for redeeming a specific credit.
 *
 * The key must be STABLE across invocations for the same credit: a credit can
 * be redeemed at most once, so "the same logical redemption" is exactly "the
 * same credit id". A per-call random UUID would hand the backend a brand-new
 * key on every retry, making the idempotency mechanism inert — a consume whose
 * response was lost could then be retried without the backend recognizing it.
 * The key is derived deterministically from the credit id (UUID-shaped so the
 * backend sees the same format the official clients send).
 */
export declare function createRedeemRequestId(creditId: string): string;
export declare function fetchCodexResetCredits(params: {
    accountId: string;
    accessToken: string;
    organizationId: string | undefined;
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<CodexResetCreditsPayload>;
/**
 * Redeem one banked credit. Irreversible.
 *
 * `redeemRequestId` is echoed to the backend as an idempotency key so a retry
 * of the same logical redemption cannot spend two credits.
 */
export declare function consumeCodexResetCredit(params: {
    accountId: string;
    accessToken: string;
    organizationId: string | undefined;
    creditId: string;
    redeemRequestId: string;
    timeoutMs?: number;
}): Promise<CodexResetConsumePayload>;
export declare function formatCodexResetConsumeResult(result: CodexResetConsumePayload): string;
/** Percent left in the weekly window, or `undefined` when there is none to read. */
export declare function getWeeklyLeftPercent(usage: CodexUsageSummary): number | undefined;
/**
 * Spend one banked reset credit when the weekly quota is (nearly) gone.
 *
 * Opt-in (`quotaNotifications.autoRedeemResets`). A credit clears both windows
 * but the 5-hour one refills by itself within hours, so only the weekly window,
 * which can shut an account out for days, triggers a redemption. The server's
 * own `applicableNow` count decides whether a credit can be spent right now.
 *
 * Never throws: a failed redemption is logged and reported as `false`.
 */
export declare function autoRedeemResetCredit(params: {
    usage: CodexUsageSummary;
    request: {
        accountId: string;
        accessToken: string;
        organizationId: string | undefined;
    };
    belowPercent: number;
    label: string;
    /**
     * Cross-process dedupe hook: invoked after a credit is selected and before
     * it is consumed. Returning `false` means another process already claimed a
     * spend for this depleted window, so this process spends nothing.
     */
    claimWindow?: () => Promise<boolean>;
}): Promise<boolean>;
/** Test seam: forget which credits this process already tried. */
export declare function resetAutoRedeemAttempts(): void;
