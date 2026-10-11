import type { RateLimitReason } from "../accounts.js";
export interface RateLimitBackoffResult {
    attempt: number;
    delayMs: number;
    isDuplicate: boolean;
    reason?: RateLimitReason;
}
export declare const RATE_LIMIT_SHORT_RETRY_THRESHOLD_MS = 5000;
/**
 * Compute rate-limit backoff for an account+quota key.
 *
 * The exponential component is jittered (±25%) to decorrelate retries; the
 * server-provided `serverRetryAfterMs` stays an absolute floor applied AFTER
 * jitter, so honoring it can never be undercut by a low roll. The 60s cap is
 * enforced after jitter as well.
 *
 * @param random - RNG driving the jitter factor; inject `() => 0.5` for the
 *   deterministic pre-jitter values.
 */
export declare function getRateLimitBackoff(accountIndex: number, quotaKey: string, serverRetryAfterMs: number | null | undefined, random?: () => number): RateLimitBackoffResult;
export declare function resetRateLimitBackoff(accountIndex: number, quotaKey: string): void;
/**
 * Re-key backoff state after the account at `removedIndex` is removed and the
 * survivors are reindexed in place. Without this, a surviving account inherits
 * the removed (or a shifted neighbor's) backoff schedule. Mirrors the tracker
 * remap in lib/rotation.ts. Kept self-contained to avoid a cross-layer import.
 */
export declare function remapRateLimitBackoffAfterRemoval(removedIndex: number): void;
export declare function clearRateLimitBackoffState(): void;
export declare function calculateBackoffMs(baseDelayMs: number, attempt: number, reason?: RateLimitReason, random?: () => number): number;
export declare function getRateLimitBackoffWithReason(accountIndex: number, quotaKey: string, serverRetryAfterMs: number | null | undefined, reason?: RateLimitReason, random?: () => number): RateLimitBackoffResult;
