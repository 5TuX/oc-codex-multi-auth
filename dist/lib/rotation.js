/**
 * Rotation Strategy Module
 *
 * Implements health-based account selection with token bucket rate limiting.
 * Ported from antigravity-auth rotation logic for optimal account rotation
 * when rate limits are encountered.
 */
import { createLogger } from "./logger.js";
const log = createLogger("rotation");
/**
 * Re-key a map whose keys are `${accountIndex}` or `${accountIndex}:${quotaKey}`
 * after the account at `removedIndex` is removed and survivors are reindexed
 * in place (every account at a higher position shifts down by one).
 *
 * Entries for the removed index are dropped; entries for higher indices are
 * shifted down by one so per-account state stays attached to the right account.
 * Keys that don't parse to a leading integer are preserved untouched.
 */
export function remapIndexedKeys(source, removedIndex) {
    const next = new Map();
    for (const [key, value] of source.entries()) {
        const colon = key.indexOf(":");
        const indexPart = colon === -1 ? key : key.slice(0, colon);
        const suffix = colon === -1 ? "" : key.slice(colon);
        const parsed = Number(indexPart);
        if (!Number.isInteger(parsed) || `${parsed}` !== indexPart) {
            // Not an index-keyed entry; keep as-is.
            next.set(key, value);
            continue;
        }
        if (parsed === removedIndex) {
            // Drop the removed account's state entirely.
            continue;
        }
        const newIndex = parsed > removedIndex ? parsed - 1 : parsed;
        next.set(`${newIndex}${suffix}`, value);
    }
    return next;
}
export const DEFAULT_HEALTH_SCORE_CONFIG = {
    successDelta: 1,
    rateLimitDelta: -10,
    failureDelta: -20,
    maxScore: 100,
    minScore: 0,
    passiveRecoveryPerHour: 2,
};
/**
 * Tracks health scores for accounts to prioritize healthy accounts.
 * Accounts with higher health scores are preferred for selection.
 */
export class HealthScoreTracker {
    entries = new Map();
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_HEALTH_SCORE_CONFIG, ...config };
    }
    getKey(accountIndex, quotaKey) {
        return quotaKey ? `${accountIndex}:${quotaKey}` : `${accountIndex}`;
    }
    applyPassiveRecovery(entry) {
        const now = Date.now();
        // Elapsed time is clamped at zero. `lastUpdated` is always stamped with
        // Date.now() at write time, so a negative interval means the clock moved
        // backwards (NTP correction, a resumed VM) — and an unclamped negative
        // interval turns recovery into a penalty, driving the score arbitrarily far
        // below minScore instead of leaving it where it was. Measured: -17440.
        const hoursSinceUpdate = Math.max(0, now - entry.lastUpdated) / (1000 * 60 * 60);
        const recovery = hoursSinceUpdate * this.config.passiveRecoveryPerHour;
        return Math.min(entry.score + recovery, this.config.maxScore);
    }
    getScore(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.entries.get(key);
        if (!entry)
            return this.config.maxScore;
        return this.applyPassiveRecovery(entry);
    }
    getConsecutiveFailures(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.entries.get(key);
        return entry?.consecutiveFailures ?? 0;
    }
    recordSuccess(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.entries.get(key);
        const baseScore = entry ? this.applyPassiveRecovery(entry) : this.config.maxScore;
        const newScore = Math.min(baseScore + this.config.successDelta, this.config.maxScore);
        this.entries.set(key, {
            score: newScore,
            lastUpdated: Date.now(),
            consecutiveFailures: 0,
        });
    }
    recordRateLimit(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.entries.get(key);
        const baseScore = entry ? this.applyPassiveRecovery(entry) : this.config.maxScore;
        const newScore = Math.max(baseScore + this.config.rateLimitDelta, this.config.minScore);
        this.entries.set(key, {
            score: newScore,
            lastUpdated: Date.now(),
            consecutiveFailures: (entry?.consecutiveFailures ?? 0) + 1,
        });
    }
    recordFailure(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.entries.get(key);
        const baseScore = entry ? this.applyPassiveRecovery(entry) : this.config.maxScore;
        const newScore = Math.max(baseScore + this.config.failureDelta, this.config.minScore);
        this.entries.set(key, {
            score: newScore,
            lastUpdated: Date.now(),
            consecutiveFailures: (entry?.consecutiveFailures ?? 0) + 1,
        });
    }
    reset(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        this.entries.delete(key);
    }
    /**
     * Re-key entries after an account at `removedIndex` is removed and the
     * survivors are reindexed in place. Entries for the removed index are
     * dropped; entries for higher indices shift down by one so they stay
     * attached to the same account. Without this, survivors would inherit the
     * removed (or a shifted neighbor's) health state — see removeAccount.
     */
    remapAfterRemoval(removedIndex) {
        this.entries = remapIndexedKeys(this.entries, removedIndex);
    }
    clear() {
        this.entries.clear();
    }
}
export const DEFAULT_TOKEN_BUCKET_CONFIG = {
    maxTokens: 50,
    tokensPerMinute: 6,
};
const TOKEN_REFUND_WINDOW_MS = 30_000;
/**
 * Client-side token bucket for rate limiting requests per account.
 * Prevents sending requests to accounts that are likely to be rate-limited.
 */
export class TokenBucketTracker {
    buckets = new Map();
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_TOKEN_BUCKET_CONFIG, ...config };
    }
    getKey(accountIndex, quotaKey) {
        return quotaKey ? `${accountIndex}:${quotaKey}` : `${accountIndex}`;
    }
    refillTokens(entry) {
        const now = Date.now();
        // Elapsed time is clamped at zero, matching the identical guard in
        // HealthScoreTracker.applyPassiveRecovery: `lastRefill` is stamped with
        // Date.now() at write time, so a negative interval means the host clock
        // moved backwards (NTP correction, a resumed VM) — and an unclamped
        // negative interval turns refill into a drain, pushing the bucket below
        // zero and leaving the account unselectable until wall time catches up.
        const minutesSinceRefill = Math.max(0, now - entry.lastRefill) / (1000 * 60);
        const tokensToAdd = minutesSinceRefill * this.config.tokensPerMinute;
        return Math.min(entry.tokens + tokensToAdd, this.config.maxTokens);
    }
    getTokens(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.buckets.get(key);
        if (!entry)
            return this.config.maxTokens;
        return this.refillTokens(entry);
    }
    /**
     * Whether at least one token is currently available (after refill). Used by
     * the rotation selectors to skip an account whose local proactive limiter is
     * depleted WITHOUT writing any persisted state — the token bucket is an
     * in-memory, per-process signal and must never leak into the cross-process
     * accounts file (see issue: local depletion previously spuriously
     * rate-limited healthy accounts in other processes).
     */
    hasToken(accountIndex, quotaKey) {
        return this.getTokens(accountIndex, quotaKey) >= 1;
    }
    /**
     * Milliseconds until at least one token is available. Returns 0 when a token
     * is available now. Used by the wait-time calculation so a fully
     * token-depleted pool waits for refill instead of failing fast.
     */
    msUntilToken(accountIndex, quotaKey) {
        const current = this.getTokens(accountIndex, quotaKey);
        if (current >= 1)
            return 0;
        const deficit = 1 - current;
        const perMs = this.config.tokensPerMinute / 60_000;
        if (perMs <= 0)
            return Number.POSITIVE_INFINITY;
        return Math.ceil(deficit / perMs);
    }
    /**
     * Attempt to consume a token. Returns true if successful, false if bucket is empty.
     */
    tryConsume(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.buckets.get(key);
        const currentTokens = entry ? this.refillTokens(entry) : this.config.maxTokens;
        if (currentTokens < 1) {
            return false;
        }
        const now = Date.now();
        const cutoff = now - TOKEN_REFUND_WINDOW_MS;
        const consumptions = (entry?.consumptions ?? []).filter((timestamp) => timestamp >= cutoff);
        consumptions.push(now);
        this.buckets.set(key, {
            tokens: currentTokens - 1,
            lastRefill: now,
            consumptions,
        });
        return true;
    }
    /**
     * Attempt to refund a token consumed within the refund window.
     * Use this when a request fails due to network errors (not rate limits).
     * @returns true if refund was successful, false if no valid consumption found
     */
    refundToken(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.buckets.get(key);
        if (!entry || entry.consumptions.length === 0)
            return false;
        const now = Date.now();
        const cutoff = now - TOKEN_REFUND_WINDOW_MS;
        const validIndex = entry.consumptions.findIndex((timestamp) => timestamp >= cutoff);
        if (validIndex === -1)
            return false;
        entry.consumptions.splice(validIndex, 1);
        const currentTokens = this.refillTokens(entry);
        this.buckets.set(key, {
            tokens: Math.min(currentTokens + 1, this.config.maxTokens),
            lastRefill: now,
            consumptions: entry.consumptions,
        });
        return true;
    }
    /**
     * Drain tokens on rate limit to prevent immediate retries.
     */
    drain(accountIndex, quotaKey, drainAmount = 10) {
        const key = this.getKey(accountIndex, quotaKey);
        const entry = this.buckets.get(key);
        const currentTokens = entry ? this.refillTokens(entry) : this.config.maxTokens;
        this.buckets.set(key, {
            tokens: Math.max(0, currentTokens - drainAmount),
            lastRefill: Date.now(),
            consumptions: entry?.consumptions ?? [],
        });
    }
    reset(accountIndex, quotaKey) {
        const key = this.getKey(accountIndex, quotaKey);
        this.buckets.delete(key);
    }
    /**
     * Re-key buckets after an account at `removedIndex` is removed and the
     * survivors are reindexed in place. Mirrors HealthScoreTracker.remapAfterRemoval.
     */
    remapAfterRemoval(removedIndex) {
        this.buckets = remapIndexedKeys(this.buckets, removedIndex);
    }
    clear() {
        this.buckets.clear();
    }
}
export const DEFAULT_HYBRID_SELECTION_CONFIG = {
    healthWeight: 2,
    tokenWeight: 5,
    freshnessWeight: 2.0,
};
export function selectHybridAccount(accounts, healthTracker, tokenTracker, quotaKey, config = {}, options = {}) {
    const cfg = { ...DEFAULT_HYBRID_SELECTION_CONFIG, ...config };
    const available = accounts.filter((a) => a.isAvailable);
    if (available.length === 0) {
        if (accounts.length === 0)
            return null;
        let leastRecentlyUsed = null;
        let oldestTime = Infinity;
        for (const account of accounts) {
            if (account.lastUsed < oldestTime) {
                oldestTime = account.lastUsed;
                leastRecentlyUsed = account;
            }
        }
        return leastRecentlyUsed;
    }
    // istanbul ignore next -- defensive: available[0] always exists when length === 1
    if (available.length === 1)
        return available[0] ?? null;
    const now = Date.now();
    let bestAccount = null;
    let bestScore = -Infinity;
    // PID offset: distribute account selection across parallel processes
    // Each process gets a small deterministic bonus based on its PID
    const pidBonus = options.pidOffsetEnabled ? (process.pid % 100) * 0.01 : 0;
    for (const account of available) {
        const health = healthTracker.getScore(account.index, quotaKey);
        const tokens = tokenTracker.getTokens(account.index, quotaKey);
        const hoursSinceUsed = (now - account.lastUsed) / (1000 * 60 * 60);
        let score = health * cfg.healthWeight +
            tokens * cfg.tokenWeight +
            hoursSinceUsed * cfg.freshnessWeight;
        // PID-based offset distributes selection across parallel agents
        if (options.pidOffsetEnabled) {
            score += ((account.index * 0.131 + pidBonus) % 1) * cfg.freshnessWeight * 0.1;
        }
        if (score > bestScore) {
            bestScore = score;
            bestAccount = account;
        }
    }
    if (bestAccount && available.length > 1) {
        const health = healthTracker.getScore(bestAccount.index, quotaKey);
        const tokens = tokenTracker.getTokens(bestAccount.index, quotaKey);
        log.debug("Selected account", {
            index: bestAccount.index,
            health: Math.round(health),
            tokens: Math.round(tokens),
            score: Math.round(bestScore),
            candidateCount: available.length,
        });
    }
    return bestAccount;
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Adds random jitter to a delay value.
 * @param baseMs - Base delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1), default 0.1 (10%)
 * @returns Delay with jitter applied
 */
export function addJitter(baseMs, jitterFactor = 0.1) {
    const jitter = baseMs * jitterFactor * (Math.random() * 2 - 1);
    return Math.max(0, Math.floor(baseMs + jitter));
}
/**
 * Returns a random delay within a range.
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Random delay within range
 */
export function randomDelay(minMs, maxMs) {
    return Math.floor(minMs + Math.random() * (maxMs - minMs));
}
/**
 * Calculates exponential backoff with jitter.
 * @param attempt - Attempt number (1-based)
 * @param baseMs - Base delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1)
 * @returns Backoff delay with jitter
 */
export function exponentialBackoff(attempt, baseMs = 1000, maxMs = 60000, jitterFactor = 0.1) {
    const delay = Math.min(baseMs * Math.pow(2, attempt - 1), maxMs);
    return addJitter(delay, jitterFactor);
}
// ============================================================================
// Singleton Instances
// ============================================================================
let healthTrackerInstance = null;
let tokenTrackerInstance = null;
export function getHealthTracker(config) {
    if (!healthTrackerInstance) {
        healthTrackerInstance = new HealthScoreTracker(config);
    }
    return healthTrackerInstance;
}
export function getTokenTracker(config) {
    if (!tokenTrackerInstance) {
        tokenTrackerInstance = new TokenBucketTracker(config);
    }
    return tokenTrackerInstance;
}
export function resetTrackers() {
    healthTrackerInstance?.clear();
    tokenTrackerInstance?.clear();
}
//# sourceMappingURL=rotation.js.map