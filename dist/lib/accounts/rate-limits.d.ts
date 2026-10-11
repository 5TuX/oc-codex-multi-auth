/**
 * Rate limiting utilities for account management.
 * Extracted from accounts.ts to reduce module size and improve cohesion.
 */
import type { ModelFamily } from "../prompts/codex.js";
export type BaseQuotaKey = ModelFamily;
export type QuotaKey = BaseQuotaKey | `${BaseQuotaKey}:${string}`;
export type RateLimitReason = "quota" | "tokens" | "concurrent" | "unknown";
export declare function parseRateLimitReason(code: string | undefined): RateLimitReason;
export declare function getQuotaKey(family: ModelFamily, model?: string | null): QuotaKey;
export declare function clampNonNegativeInt(value: unknown, fallback: number): number;
export interface RateLimitState {
    [key: string]: number | undefined;
}
export interface RateLimitedEntity {
    rateLimitResetTimes: RateLimitState;
}
export declare function clearExpiredRateLimits(entity: RateLimitedEntity): void;
export interface QuotaExhaustibleEntity {
    /** Ms epoch until which this account's shared subscription quota is spent. */
    quotaExhaustedUntil?: number;
    /** When the stamp was written; see AccountMetadataV3. */
    quotaExhaustedStampAt?: number;
}
/**
 * Whether an account's shared subscription quota is currently spent.
 *
 * This is an ACCOUNT-WIDE block sourced from the `/wham/usage`
 * primary/secondary window, deliberately distinct from the per-family /
 * per-model transient blocks tracked in {@link RateLimitState}. Read sites
 * report it separately so a 30-second 429 is never conflated with a week-long
 * subscription-quota exhaustion.
 */
export declare function isQuotaExhausted(entity: QuotaExhaustibleEntity, now?: number): boolean;
/**
 * Drop an elapsed (or non-finite) quota-exhaustion stamp so it does not leak
 * into snapshots or persistence, mirroring {@link clearExpiredRateLimits} for
 * the per-family map.
 */
export declare function clearExpiredQuotaExhaustion(entity: QuotaExhaustibleEntity, now?: number): void;
export declare function isRateLimitedForQuotaKey(entity: RateLimitedEntity, key: QuotaKey): boolean;
export declare function isRateLimitedForFamily(entity: RateLimitedEntity, family: ModelFamily, model?: string | null): boolean;
/**
 * Human-readable duration, used in toasts, status lines and log warnings.
 *
 * Non-finite input reads as zero rather than propagating: the old arithmetic
 * turned NaN into the string "NaNs" and Infinity into "Infinitym NaNs", both of
 * which reached users verbatim.
 *
 * Hours and days are split out because the callers routinely pass durations far
 * past an hour — a weekly quota block and process uptime both used to render as
 * a five-figure minute count ("10080m 0s").
 */
export declare function formatWaitTime(ms: number): string;
