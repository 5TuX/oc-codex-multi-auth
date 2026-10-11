/**
 * Refresh Queue Module
 *
 * Prevents race conditions when multiple concurrent requests try to refresh
 * the same account's token simultaneously. Instead of firing parallel refresh
 * requests, subsequent callers await the existing in-flight refresh.
 *
 * Ported from antigravity-auth refresh-queue.ts pattern.
 */
import type { TokenResult } from "./types.js";
export interface RefreshQueueMetrics {
    started: number;
    deduplicated: number;
    rotationReused: number;
    succeeded: number;
    failed: number;
    exceptions: number;
    rotated: number;
    staleEvictions: number;
    lastDurationMs: number;
    lastFailureReason: string | null;
    pending: number;
}
/**
 * Manages queued token refresh operations to prevent race conditions.
 *
 * When multiple concurrent requests need to refresh the same account's token,
 * only the first request triggers the actual refresh. Subsequent requests
 * await the same promise, ensuring:
 * - No duplicate refresh API calls for the same refresh token
 * - Consistent token state across all waiting callers
 * - Reduced load on OpenAI's token endpoint
 *
 * Token Rotation Handling:
 * When OpenAI rotates the refresh token during a refresh operation, we maintain
 * a mapping from old token → new token. This ensures that requests arriving with
 * either the old or new token will find the in-flight refresh and not trigger
 * duplicate refreshes.
 *
 * @example
 * ```typescript
 * const queue = new RefreshQueue();
 *
 * // These three concurrent calls will only trigger ONE actual refresh
 * const [result1, result2, result3] = await Promise.all([
 *   queue.refresh(refreshToken),
 *   queue.refresh(refreshToken),
 *   queue.refresh(refreshToken),
 * ]);
 *
 * // All three get the same result
 * console.log(result1 === result2); // true (same object reference)
 * ```
 */
export declare class RefreshQueue {
    private pending;
    private metrics;
    /**
     * Maps old refresh tokens to new tokens after rotation.
     * This allows lookups with either old or new token to find the same entry.
     * Format: oldToken → newToken
     */
    private tokenRotationMap;
    /**
     * Successful results of recently-SETTLED rotations, keyed by the consumed
     * (pre-rotation) token. The in-flight dedup above only protects callers
     * that arrive while the refresh is pending; a sibling that captured the
     * old token just before rotation and calls refresh() after the first
     * refresh settles would otherwise burn the single-use token and take a
     * spurious 401. Entries live for `maxEntryAgeMs`, same as pending entries.
     */
    private recentRotations;
    /**
     * Maximum time to keep a refresh entry in the queue (prevents memory leaks
     * from stuck requests). After this timeout, the entry is removed and new
     * callers will trigger a fresh refresh.
     */
    private readonly maxEntryAgeMs;
    /**
     * Create a new RefreshQueue instance.
     * @param maxEntryAgeMs - Maximum age for pending entries before cleanup (default: 30s)
     */
    constructor(maxEntryAgeMs?: number);
    /**
     * Refresh a token, deduplicating concurrent requests for the same refresh token.
     *
     * If a refresh is already in-flight for this token, returns the existing promise.
     * Otherwise, initiates a new refresh and caches the promise for other callers.
     *
     * @param refreshToken - The refresh token to use
     * @returns Token result (success with new tokens, or failure)
     */
    refresh(refreshToken: string): Promise<TokenResult>;
    private findOriginalToken;
    private cleanupRotationMapping;
    private executeRefreshWithRotationTracking;
    /**
     * Execute the actual refresh and log results.
     */
    private executeRefresh;
    /**
     * Remove stale entries that have been pending too long.
     * This prevents memory leaks from stuck or abandoned refresh operations.
     */
    private cleanup;
    /**
     * Check if there's an in-flight refresh for a given token.
     * @param refreshToken - The refresh token to check
     * @returns True if refresh is in progress
     */
    isRefreshing(refreshToken: string): boolean;
    /**
     * Get the number of pending refresh operations.
     * Useful for debugging and monitoring.
     */
    get pendingCount(): number;
    /**
     * Clear all pending entries (primarily for testing).
     */
    clear(): void;
    getMetricsSnapshot(): RefreshQueueMetrics;
}
/**
 * Get the singleton RefreshQueue instance.
 * @param maxEntryAgeMs - Maximum age for pending entries (only used on first call)
 * @returns The global RefreshQueue instance
 */
export declare function getRefreshQueue(maxEntryAgeMs?: number): RefreshQueue;
/**
 * Reset the singleton instance (primarily for testing).
 */
export declare function resetRefreshQueue(): void;
/**
 * Convenience function to refresh a token using the singleton queue.
 * @param refreshToken - The refresh token to use
 * @returns Token result
 */
export declare function queuedRefresh(refreshToken: string): Promise<TokenResult>;
export declare function getRefreshQueueMetrics(): RefreshQueueMetrics;
