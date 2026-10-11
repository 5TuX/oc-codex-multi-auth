/**
 * Retry budget utilities for per-error-class retry controls.
 */
export type RetryProfile = "conservative" | "balanced" | "aggressive";
export type RetryBudgetClass = "authRefresh" | "network" | "server" | "rateLimitShort" | "rateLimitGlobal" | "emptyResponse";
export type RetryBudgetLimits = Record<RetryBudgetClass, number>;
export type RetryBudgetOverrides = Partial<RetryBudgetLimits>;
/**
 * How much blocking one budget unit buys when a retry is charged through
 * {@link RetryBudgetTracker.consumeWait}.
 *
 * The budgets are small (1/3/10) and were being charged one unit per wait
 * regardless of length, so three consecutive sub-second waits exhausted the
 * default and hard-failed a request that one more second would have served.
 * Waiting is only expensive in proportion to the time it costs the caller, so
 * that is what a unit now measures.
 */
export declare const RETRY_WAIT_BUDGET_UNIT_MS = 5000;
export declare function normalizeRetryBudgetValue(value: unknown): number | undefined;
export declare function resolveRetryBudgetLimits(profile: RetryProfile, overrides?: RetryBudgetOverrides): RetryBudgetLimits;
export declare class RetryBudgetTracker {
    private readonly used;
    private readonly waitCarryMs;
    private readonly limits;
    constructor(limits: RetryBudgetLimits);
    /**
     * Charge a retry that blocks for `waitMs` against a bucket, in proportion to
     * how long it blocks.
     *
     * A wait of {@link RETRY_WAIT_BUDGET_UNIT_MS} or longer costs a full unit,
     * so a multi-hour block stays governed exactly as before. Shorter waits
     * accumulate on a per-bucket carry and only cost a unit once they have added
     * up to one, so a burst of sub-second waits is effectively free.
     *
     * An exhausted bucket refuses even a free wait: the carry bounds how long
     * short waits can loop, and without that check they would loop forever once
     * the budget ran out.
     */
    consumeWait(bucket: RetryBudgetClass, waitMs: number): boolean;
    consume(bucket: RetryBudgetClass): boolean;
    getLimits(): RetryBudgetLimits;
    getUsage(): RetryBudgetLimits;
    getRemaining(bucket: RetryBudgetClass): number;
}
