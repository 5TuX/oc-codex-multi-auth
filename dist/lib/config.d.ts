import type { PluginConfig } from "./types.js";
import { type RetryBudgetOverrides, type RetryProfile } from "./request/retry-budget.js";
import { type QuotaDisplayMode } from "./quota-display.js";
import type { QuotaOverviewLayout, QuotaOverviewNames, QuotaOverviewOrder, QuotaOverviewResetTimes } from "./quota-overview.js";
export type UnsupportedCodexPolicy = "strict" | "fallback";
export type ModelAccountPoolMode = "preferred" | "strict";
export type ModelAccountPoolMutation = "set" | "add" | "remove" | "clear" | "set-mode";
export interface ModelAccountPoolMutationResult {
    model: string;
    previousAccountIds: string[];
    accountIds: string[];
    previousPoolMode: ModelAccountPoolMode;
    poolMode: ModelAccountPoolMode;
    changed: boolean;
    dryRun: boolean;
}
export interface ModelAccountPoolMutationOptions {
    dryRun?: boolean;
    poolMode?: ModelAccountPoolMode;
    normalizeExistingAccountIds?: (accountIds: readonly string[]) => readonly string[];
}
export declare function resetPluginConfigCache(): void;
/**
 * Load plugin configuration from ~/.opencode/openai-codex-auth-config.json
 * Keeps the last usable configuration during incomplete writes; defaults on cold start.
 *
 * This runs on the per-request path, so the file is only re-read when its
 * stat signature changed and only re-validated when its content did —
 * an unchanged file costs one `statSync`, not a read+parse.
 *
 * @returns Plugin configuration
 */
export declare function loadPluginConfig(): PluginConfig;
/** Test hook: forget any observed contention so budgets start from full. */
export declare function __resetLockContentionStateForTests(): void;
/**
 * Update one model pool while preserving every unrelated raw config key.
 * Account indexes are deliberately resolved by the caller; only stable IDs
 * cross this persistence boundary.
 */
export declare function updateModelAccountPool(model: string, mutation: ModelAccountPoolMutation, accountIds?: readonly string[], options?: ModelAccountPoolMutationOptions): Promise<ModelAccountPoolMutationResult>;
/**
 * The effective `CODEX_AUTH_ACCOUNT_ID` override: the trimmed, length-bounded
 * (256) value from {@link AccountIdOverrideSchema}, or `undefined` when the
 * env var is unset, blank, or out of bounds. Reading `process.env` raw would
 * accept whitespace-only or unbounded input, so every consumer should come
 * through here — `resolveAccountSelection` in `lib/auth/login-runner.ts`
 * already does, and the request path can adopt the same helper for runtime
 * account pinning.
 */
export declare function resolveAccountIdOverride(): string | undefined;
/**
 * Get the effective CODEX_MODE setting.
 * Priority: environment variable > config file > default (true).
 *
 * @param pluginConfig - Plugin configuration from file
 * @returns True if CODEX_MODE should be enabled
 */
export declare function getCodexMode(pluginConfig: PluginConfig): boolean;
export declare function getRequestTransformMode(pluginConfig: PluginConfig): "native" | "legacy";
export declare function getCodexTuiV2(pluginConfig: PluginConfig): boolean;
export declare function getCodexTuiColorProfile(pluginConfig: PluginConfig): "truecolor" | "ansi16" | "ansi256";
export declare function getCodexTuiGlyphMode(pluginConfig: PluginConfig): "ascii" | "unicode" | "auto";
export declare function getCodexTuiMaskEmail(pluginConfig: PluginConfig): boolean;
export declare function getCodexTuiMaskEmailInQuotaDetails(pluginConfig: PluginConfig): boolean;
/**
 * Whether quota percentages are worded as headroom or as consumption.
 *
 * Defaults to `free`, which is how Codex itself reports a quota. Only the
 * wording changes: exhaustion, rotation blocks, notification thresholds and
 * the status line's warning/danger colouring all stay keyed on the remaining
 * percentage.
 */
export declare function getQuotaDisplay(pluginConfig: PluginConfig): QuotaDisplayMode;
export type LimitsSortField = "account" | "usage" | "reset";
export type LimitsSortDirection = "asc" | "desc";
/**
 * Default account order for the standalone `limits` CLI. `--sort` and
 * `--asc`/`--desc` on the command line override each half independently.
 * File-only, like `quotaStatus`: a display preference belongs to a person.
 */
export declare function getLimitsSort(pluginConfig: PluginConfig): {
    by: LimitsSortField;
    direction: LimitsSortDirection;
};
export declare function getFastSession(pluginConfig: PluginConfig): boolean;
/**
 * Spend Codex credits once no account entitled to the model has plan quota
 * left. Off by default: an account at 100% of its plan window keeps serving
 * on its credit balance by itself, so without this the plugin keeps such
 * accounts out of rotation rather than spend money nobody asked it to.
 */
export declare function getSpendCredits(pluginConfig: PluginConfig): boolean;
export declare function getBeginnerSafeMode(pluginConfig: PluginConfig): boolean;
export declare function getFastSessionStrategy(pluginConfig: PluginConfig): "hybrid" | "always";
export type RotationStrategy = "hybrid" | "sticky" | "round-robin" | "custom";
/**
 * Account load-balancing strategy (issue #183).
 *
 * - `hybrid` (default): unchanged historical behavior — stick to the current
 *   account while it is healthy, otherwise score-select the next one
 *   (health + tokens + freshness, which *spreads* load across accounts).
 * - `sticky`: drain-first. Stay on the current account while it has quota,
 *   and when it is exhausted pick the lowest-indexed available account so load
 *   *concentrates* on as few accounts as possible. This staggers weekly-quota
 *   cooldowns instead of exhausting every account at once.
 * - `round-robin`: advance through accounts in order on every selection.
 *
 * Env override `CODEX_AUTH_ROTATION_STRATEGY` wins over config; bogus values
 * fall back to the config / default via the shared Zod enum helper.
 */
export declare function getRotationStrategy(pluginConfig: PluginConfig): RotationStrategy;
export declare function getModelAccountPool(pluginConfig: PluginConfig, model?: string | null): string[];
export declare function getModelAccountPoolMode(pluginConfig: PluginConfig, model?: string | null): ModelAccountPoolMode;
export declare function getFastSessionMaxInputItems(pluginConfig: PluginConfig): number;
export declare function getRetryProfile(pluginConfig: PluginConfig): RetryProfile;
export declare function getRetryBudgetOverrides(pluginConfig: PluginConfig): RetryBudgetOverrides;
export declare function getRetryAllAccountsRateLimited(pluginConfig: PluginConfig): boolean;
export declare function getRetryAllAccountsMaxWaitMs(pluginConfig: PluginConfig): number;
export declare function getRetryAllAccountsMaxRetries(pluginConfig: PluginConfig): number;
export declare function getUnsupportedCodexPolicy(pluginConfig: PluginConfig): UnsupportedCodexPolicy;
export declare function getFallbackOnUnsupportedCodexModel(pluginConfig: PluginConfig): boolean;
export declare function getFallbackToGpt52OnUnsupportedGpt53(pluginConfig: PluginConfig): boolean;
export declare function getUnsupportedCodexFallbackChain(pluginConfig: PluginConfig): Record<string, string[]>;
export declare function getTokenRefreshSkewMs(pluginConfig: PluginConfig): number;
export declare function getRateLimitToastDebounceMs(pluginConfig: PluginConfig): number;
export declare function getSessionRecovery(pluginConfig: PluginConfig): boolean;
export declare function getAutoResume(pluginConfig: PluginConfig): boolean;
export declare function getAutoUpdate(pluginConfig: PluginConfig): boolean;
export declare function getToastDurationMs(pluginConfig: PluginConfig): number;
/**
 * Gates only the informational "Using <account> (N/N)" account-selection toast.
 * Warning/error toasts (rate limits, expired auth, recovery, retries) are never
 * affected by this setting.
 */
export declare function getAccountToastsEnabled(pluginConfig: PluginConfig): boolean;
export declare function getPerProjectAccounts(pluginConfig: PluginConfig): boolean;
/**
 * Whether the credential store is snapshotted before a significant write.
 *
 * On by default: the snapshots are the only recourse if the accounts file is
 * ever replaced wholesale, and they are worth little unless they are recent
 * enough to hold refresh tokens that still work.
 */
export declare function getCredentialSnapshots(pluginConfig: PluginConfig): boolean;
/**
 * How many credential snapshots to keep. `0` keeps every snapshot; turning the
 * feature off is {@link getCredentialSnapshots}' job, not a magic zero.
 */
export declare function getCredentialSnapshotsMaxCount(pluginConfig: PluginConfig): number;
export declare function getParallelProbing(pluginConfig: PluginConfig): boolean;
export declare function getParallelProbingMaxConcurrency(pluginConfig: PluginConfig): number;
export declare function getEmptyResponseMaxRetries(pluginConfig: PluginConfig): number;
export declare function getEmptyResponseRetryDelayMs(pluginConfig: PluginConfig): number;
export declare function getPidOffsetEnabled(pluginConfig: PluginConfig): boolean;
export declare function getFetchTimeoutMs(pluginConfig: PluginConfig): number;
export declare function getStreamStallTimeoutMs(pluginConfig: PluginConfig): number;
/**
 * Overall post-headers deadline for a non-streaming SSE conversion. The stall
 * timeout above bounds only the gap between chunks and is re-armed per read, so
 * a drip that always lands inside the gap would otherwise hang the conversion
 * forever. This one is armed once and never extended.
 */
export declare function getMaxStreamDurationMs(pluginConfig: PluginConfig): number;
export interface QuotaNotificationsConfig {
    enabled: boolean;
    /** Poll usage to block fully spent subscription quotas before they spend Credits. */
    autoProtectCredits?: boolean;
    /** Spend a banked rate-limit reset credit once the weekly quota runs low. */
    autoRedeemResets?: boolean;
    /** Weekly quota left (percent) at or below which a credit is spent. */
    autoRedeemResetsBelowPercent?: number;
    intervalMs: number;
    notifyEveryCheck: boolean;
    thresholds: number[];
}
export declare const DEFAULT_QUOTA_NOTIFICATION_THRESHOLDS: readonly number[];
export declare function getQuotaNotifications(pluginConfig: PluginConfig): QuotaNotificationsConfig;
/** One thing the prompt status line can be showing at a given moment. */
export type QuotaStatusScreen = "active" | "overview" | "resets" | "credits";
/** Whether the line appears for every model or only for the ones it describes. */
export type QuotaStatusAudience = "always" | "codex-models";
export interface QuotaStatusConfig {
    /**
     * The screens to show, in the order they take turns. `active` names the
     * account serving requests, which is how the status line has always
     * worked; `overview` describes the whole pool; `resets` lists the banked
     * reset credits worth redeeming once nothing has headroom left; `credits`
     * lists the accounts holding a Codex credit balance at that point. More than
     * one screen alternates every {@link rotateMs}.
     */
    screens: QuotaStatusScreen[];
    rotateMs: number;
    /** Per-account segments, grouped percentages, a count, or only the total. */
    layout: QuotaOverviewLayout;
    /** `#1`, the account's own name, or nothing at all. */
    accountNames: QuotaOverviewNames;
    order: QuotaOverviewOrder;
    /** `5x` / `20x` plan allotment badges. */
    multipliers: boolean;
    /** `66% of 65x`: what the pool the percentage is taken over adds up to. */
    allotment: boolean;
    /** Which accounts get a `3d` countdown: none, the low ones, or all. */
    resetTimes: QuotaOverviewResetTimes;
    /** `1r` for banked rate-limit resets redeemable now. */
    resetCredits: boolean;
    /** Next reset's delta, or all future capacity returns when set to `all`. */
    recovery: boolean | "all";
    /** Minimum pool usage before showing actionable reset credits. */
    resetsMinUsedPercent: number;
    /**
     * Rows the line may occupy. A ceiling rather than a height: a rendering
     * that fits on one row still takes one, so raising this costs nothing until
     * the terminal is narrow enough for the line to need the room.
     */
    rows: number;
    showFor: QuotaStatusAudience;
}
/**
 * How the prompt status line describes the account pool.
 *
 * Every default here is the behaviour an install already has, so adding
 * `"mode": "overview"` and nothing else changes the line's subject without
 * changing anything about how it is written. The switches only apply to the
 * pool screens; they are resolved unconditionally anyway so a reader of this
 * config sees what `overview` would render without having to enable it first.
 *
 * Presentation preference belongs to a person rather than to a shell, so none
 * of this is overridable by environment variable - the config file is the only
 * place it is read from.
 */
export declare function getQuotaStatus(pluginConfig: PluginConfig): QuotaStatusConfig;
