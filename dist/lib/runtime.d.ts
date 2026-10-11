/**
 * Plugin runtime scaffolding.
 *
 * Holds module-level helpers and pure types hoisted out of `index.ts` as the
 * the first step of the tool-registry extraction. Everything
 * in this file is independent of the plugin closure — it may be imported freely
 * by `index.ts` and by any future `lib/tools/*` modules without dragging
 * plugin state into the call graph.
 *
 * Future RC-1 follow-ups will move additional closure-independent helpers here
 * and keep `lib/tools/*` factories consuming a
 * `ToolContext` assembled inside `OpenAIOAuthPlugin`.
 */
import { type FlaggedAccountMetadataV1 } from "./storage.js";
import type { AccountSelectionExplainability } from "./accounts.js";
import type { RetryBudgetClass, RetryBudgetLimits } from "./request/retry-budget.js";
import type { ModelFamily } from "./prompts/codex.js";
export declare function matchesWorkspaceIdentity(account: {
    organizationId?: string;
    accountId?: string;
    refreshToken: string;
}, identityKey: string): boolean;
export declare function upsertFlaggedAccountRecord(accounts: FlaggedAccountMetadataV1[], record: FlaggedAccountMetadataV1): void;
export type ToolOutputFormat = "text" | "json";
export declare function normalizeToolOutputFormat(format?: string): ToolOutputFormat;
export declare function renderJsonOutput(payload: unknown): string;
export type SelectionSnapshot = {
    timestamp: number;
    family: ModelFamily;
    model: string | null;
    requestedModel: string | null;
    effectiveModel: string | null;
    selectedAccountIndex: number | null;
    quotaKey: string;
    explainability: AccountSelectionExplainability[];
    fallbackApplied: boolean;
    fallbackFrom: string | null;
    fallbackTo: string | null;
    fallbackReason: string | null;
    accountPoolMode?: "general" | "preferred" | "general-fallback" | "strict" | "strict-unavailable";
    configuredAccountPoolSize?: number;
};
export type SerializedSelectionExplainability = {
    index: number;
    zeroBasedIndex: number;
    enabled: boolean;
    isCurrentForFamily: boolean;
    eligible: boolean;
    reasons: string[];
    healthScore: number;
    tokensAvailable: number;
    rateLimitedUntil: number | null;
    coolingDownUntil: number | null;
    cooldownReason: string | null;
    lastUsed: number;
};
export type RoutingVisibilitySnapshot = {
    requestedModel: string | null;
    effectiveModel: string | null;
    modelFamily: ModelFamily | null;
    quotaKey: string | null;
    selectedAccountIndex: number | null;
    zeroBasedSelectedAccountIndex: number | null;
    lastErrorCategory: string | null;
    fallbackApplied: boolean;
    fallbackFrom: string | null;
    fallbackTo: string | null;
    fallbackReason: string | null;
    accountPoolMode: "general" | "preferred" | "general-fallback" | "strict" | "strict-unavailable" | null;
    configuredAccountPoolSize: number;
    selectionExplainability: SerializedSelectionExplainability[];
};
export type RuntimeMetrics = {
    startedAt: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedResponses: number;
    serverErrors: number;
    networkErrors: number;
    authRefreshFailures: number;
    emptyResponseRetries: number;
    accountRotations: number;
    cumulativeLatencyMs: number;
    retryBudgetExhaustions: number;
    retryBudgetUsage: Record<RetryBudgetClass, number>;
    retryBudgetLimits: RetryBudgetLimits;
    retryProfile: string;
    lastRetryBudgetExhaustedClass: RetryBudgetClass | null;
    lastRetryBudgetReason: string | null;
    lastRequestAt: number | null;
    lastError: string | null;
    lastErrorCategory: string | null;
    promptCacheEnabledRequests: number;
    promptCacheMissingRequests: number;
    lastPromptCacheKey: string | null;
    lastSelectedAccountIndex: number | null;
    lastQuotaKey: string | null;
    lastSelectionSnapshot: SelectionSnapshot | null;
};
export declare function createRetryBudgetUsage(): Record<RetryBudgetClass, number>;
export declare function serializeSelectionExplainability(entries: AccountSelectionExplainability[]): SerializedSelectionExplainability[];
export declare function formatRoutingValue(value: string | number | boolean | null | undefined): string;
export declare function formatExplainabilitySummary(entry: SerializedSelectionExplainability): string;
