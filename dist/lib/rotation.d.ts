/**
 * Rotation Strategy Module
 *
 * Implements health-based account selection with token bucket rate limiting.
 * Ported from antigravity-auth rotation logic for optimal account rotation
 * when rate limits are encountered.
 */
/**
 * Re-key a map whose keys are `${accountIndex}` or `${accountIndex}:${quotaKey}`
 * after the account at `removedIndex` is removed and survivors are reindexed
 * in place (every account at a higher position shifts down by one).
 *
 * Entries for the removed index are dropped; entries for higher indices are
 * shifted down by one so per-account state stays attached to the right account.
 * Keys that don't parse to a leading integer are preserved untouched.
 */
export declare function remapIndexedKeys<V>(source: Map<string, V>, removedIndex: number): Map<string, V>;
export interface HealthScoreConfig {
    /** Points added on successful request */
    successDelta: number;
    /** Points deducted on rate limit (negative) */
    rateLimitDelta: number;
    /** Points deducted on other failures (negative) */
    failureDelta: number;
    /** Maximum health score */
    maxScore: number;
    /** Minimum health score */
    minScore: number;
    /** Points recovered per hour of inactivity */
    passiveRecoveryPerHour: number;
}
export declare const DEFAULT_HEALTH_SCORE_CONFIG: HealthScoreConfig;
/**
 * Tracks health scores for accounts to prioritize healthy accounts.
 * Accounts with higher health scores are preferred for selection.
 */
export declare class HealthScoreTracker {
    private entries;
    private config;
    constructor(config?: Partial<HealthScoreConfig>);
    private getKey;
    private applyPassiveRecovery;
    getScore(accountIndex: number, quotaKey?: string): number;
    getConsecutiveFailures(accountIndex: number, quotaKey?: string): number;
    recordSuccess(accountIndex: number, quotaKey?: string): void;
    recordRateLimit(accountIndex: number, quotaKey?: string): void;
    recordFailure(accountIndex: number, quotaKey?: string): void;
    reset(accountIndex: number, quotaKey?: string): void;
    /**
     * Re-key entries after an account at `removedIndex` is removed and the
     * survivors are reindexed in place. Entries for the removed index are
     * dropped; entries for higher indices shift down by one so they stay
     * attached to the same account. Without this, survivors would inherit the
     * removed (or a shifted neighbor's) health state — see removeAccount.
     */
    remapAfterRemoval(removedIndex: number): void;
    clear(): void;
}
export interface TokenBucketConfig {
    /** Maximum tokens in bucket */
    maxTokens: number;
    /** Tokens regenerated per minute */
    tokensPerMinute: number;
}
export declare const DEFAULT_TOKEN_BUCKET_CONFIG: TokenBucketConfig;
/**
 * Client-side token bucket for rate limiting requests per account.
 * Prevents sending requests to accounts that are likely to be rate-limited.
 */
export declare class TokenBucketTracker {
    private buckets;
    private config;
    constructor(config?: Partial<TokenBucketConfig>);
    private getKey;
    private refillTokens;
    getTokens(accountIndex: number, quotaKey?: string): number;
    /**
     * Whether at least one token is currently available (after refill). Used by
     * the rotation selectors to skip an account whose local proactive limiter is
     * depleted WITHOUT writing any persisted state — the token bucket is an
     * in-memory, per-process signal and must never leak into the cross-process
     * accounts file (see issue: local depletion previously spuriously
     * rate-limited healthy accounts in other processes).
     */
    hasToken(accountIndex: number, quotaKey?: string): boolean;
    /**
     * Milliseconds until at least one token is available. Returns 0 when a token
     * is available now. Used by the wait-time calculation so a fully
     * token-depleted pool waits for refill instead of failing fast.
     */
    msUntilToken(accountIndex: number, quotaKey?: string): number;
    /**
     * Attempt to consume a token. Returns true if successful, false if bucket is empty.
     */
    tryConsume(accountIndex: number, quotaKey?: string): boolean;
    /**
     * Attempt to refund a token consumed within the refund window.
     * Use this when a request fails due to network errors (not rate limits).
     * @returns true if refund was successful, false if no valid consumption found
     */
    refundToken(accountIndex: number, quotaKey?: string): boolean;
    /**
     * Drain tokens on rate limit to prevent immediate retries.
     */
    drain(accountIndex: number, quotaKey?: string, drainAmount?: number): void;
    reset(accountIndex: number, quotaKey?: string): void;
    /**
     * Re-key buckets after an account at `removedIndex` is removed and the
     * survivors are reindexed in place. Mirrors HealthScoreTracker.remapAfterRemoval.
     */
    remapAfterRemoval(removedIndex: number): void;
    clear(): void;
}
export interface AccountWithMetrics {
    index: number;
    isAvailable: boolean;
    lastUsed: number;
}
export interface HybridSelectionConfig {
    /** Weight for health score (default: 2) */
    healthWeight: number;
    /** Weight for token count (default: 5) */
    tokenWeight: number;
    /** Weight for freshness/last used (default: 2.0) */
    freshnessWeight: number;
}
export declare const DEFAULT_HYBRID_SELECTION_CONFIG: HybridSelectionConfig;
/**
 * Selects the best account using a hybrid scoring strategy.
 *
 * Score = (health * healthWeight) + (tokens * tokenWeight) + (freshness * freshnessWeight)
 *
 * Where:
 * - health: Account health score (0-100)
 * - tokens: Available tokens in bucket (0-maxTokens)
 * - freshness: Hours since last used (higher = more fresh for rotation)
 */
export interface HybridSelectionOptions {
    pidOffsetEnabled?: boolean;
}
export declare function selectHybridAccount(accounts: AccountWithMetrics[], healthTracker: HealthScoreTracker, tokenTracker: TokenBucketTracker, quotaKey?: string, config?: Partial<HybridSelectionConfig>, options?: HybridSelectionOptions): AccountWithMetrics | null;
/**
 * Adds random jitter to a delay value.
 * @param baseMs - Base delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1), default 0.1 (10%)
 * @returns Delay with jitter applied
 */
export declare function addJitter(baseMs: number, jitterFactor?: number): number;
/**
 * Returns a random delay within a range.
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Random delay within range
 */
export declare function randomDelay(minMs: number, maxMs: number): number;
/**
 * Calculates exponential backoff with jitter.
 * @param attempt - Attempt number (1-based)
 * @param baseMs - Base delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1)
 * @returns Backoff delay with jitter
 */
export declare function exponentialBackoff(attempt: number, baseMs?: number, maxMs?: number, jitterFactor?: number): number;
export declare function getHealthTracker(config?: Partial<HealthScoreConfig>): HealthScoreTracker;
export declare function getTokenTracker(config?: Partial<TokenBucketConfig>): TokenBucketTracker;
export declare function resetTrackers(): void;
