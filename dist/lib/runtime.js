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
import { getWorkspaceIdentityKey, } from "./storage.js";
// ---------------------------------------------------------------------------
// Module-level workspace-identity helpers.
// Pure functions; no closure or I/O. Safe to import from anywhere.
// ---------------------------------------------------------------------------
export function matchesWorkspaceIdentity(account, identityKey) {
    return getWorkspaceIdentityKey(account) === identityKey;
}
export function upsertFlaggedAccountRecord(accounts, record) {
    const identityKey = getWorkspaceIdentityKey(record);
    const existingIndex = accounts.findIndex((flagged) => matchesWorkspaceIdentity(flagged, identityKey));
    if (existingIndex >= 0) {
        accounts[existingIndex] = record;
        return;
    }
    accounts.push(record);
}
export function normalizeToolOutputFormat(format) {
    if (format === undefined)
        return "text";
    if (format === "text" || format === "json")
        return format;
    throw new Error(`Invalid format "${format}". Expected "text" or "json".`);
}
export function renderJsonOutput(payload) {
    return JSON.stringify(payload, null, 2);
}
export function createRetryBudgetUsage() {
    return {
        authRefresh: 0,
        network: 0,
        server: 0,
        rateLimitShort: 0,
        rateLimitGlobal: 0,
        emptyResponse: 0,
    };
}
export function serializeSelectionExplainability(entries) {
    return entries.map((entry) => ({
        index: entry.index + 1,
        zeroBasedIndex: entry.index,
        enabled: entry.enabled,
        isCurrentForFamily: entry.isCurrentForFamily,
        eligible: entry.eligible,
        reasons: [...entry.reasons],
        healthScore: entry.healthScore,
        tokensAvailable: entry.tokensAvailable,
        rateLimitedUntil: typeof entry.rateLimitedUntil === "number" ? entry.rateLimitedUntil : null,
        coolingDownUntil: typeof entry.coolingDownUntil === "number" ? entry.coolingDownUntil : null,
        cooldownReason: entry.cooldownReason ?? null,
        lastUsed: entry.lastUsed,
    }));
}
export function formatRoutingValue(value) {
    if (typeof value === "boolean")
        return value ? "yes" : "no";
    if (value === null || value === undefined || value === "")
        return "-";
    return String(value);
}
export function formatExplainabilitySummary(entry) {
    return `Account ${entry.index}: ${entry.eligible ? "eligible" : "blocked"} | health=${Math.round(entry.healthScore)} | tokens=${entry.tokensAvailable.toFixed(1)} | ${entry.reasons.join(", ")}`;
}
//# sourceMappingURL=runtime.js.map