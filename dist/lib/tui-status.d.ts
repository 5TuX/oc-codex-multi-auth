import type { Config } from "@opencode-ai/sdk/v2";
import { type QuotaOverviewAccount, type QuotaOverviewOptions } from "./quota-overview.js";
import { type QuotaDisplayMode } from "./quota-display.js";
import { type UiGlyphMode } from "./ui/theme.js";
export type ReasoningVariant = "none" | "low" | "medium" | "high" | "xhigh" | "max" | "ultra";
export type CompactQuotaLimit = {
    label: string;
    leftPercent: number | null;
    usedPercent?: number;
    windowMinutes?: number;
    resetAtMs?: number;
};
export type CompactQuotaSource = "headers" | "usage";
export type CompactQuotaStatus = {
    type: "loading";
} | {
    type: "missing";
} | {
    type: "unavailable";
} | {
    type: "ready";
    limits: readonly CompactQuotaLimit[];
    stale: boolean;
    source?: CompactQuotaSource;
    fetchedAt?: number;
    fingerprint?: string;
    accountIndex?: number;
    accountCount?: number;
    accountEmail?: string;
    accountLabel?: string;
    planType?: string;
    activeLimit?: number;
};
export type PromptStatusMessage = {
    role: "user" | "assistant";
    modelID?: string;
    variant?: string;
    userModel?: {
        modelID?: string;
        variant?: string;
    };
};
export type PromptStatusConfig = Pick<Config, "model" | "default_agent" | "agent" | "mode" | "provider">;
export declare function normalizeReasoningVariant(value: string | undefined): ReasoningVariant | undefined;
export declare function inferReasoningVariantFromModelId(modelID: string | undefined): ReasoningVariant | undefined;
export declare function resolvePromptReasoningVariant(params: {
    messages?: readonly PromptStatusMessage[];
    config?: PromptStatusConfig;
}): ReasoningVariant | undefined;
export declare function formatPromptStatusText(params: {
    variant?: ReasoningVariant;
    quota: CompactQuotaStatus;
    width?: number;
    /**
     * Columns the renderer measured for this slot. When present it wins over
     * the `width` heuristics outright — the slot may share its row with
     * other content, and only the measurement knows how much.
     */
    availableChars?: number;
    maskEmail?: boolean;
    quotaDisplay?: QuotaDisplayMode;
    /** `codexTuiGlyphMode`; `auto` resolves against the environment. */
    glyphMode?: UiGlyphMode;
}): string;
/**
 * Break one rendering across rows, at the separators it already has.
 *
 * Only `, ` boundaries are used, so a row never ends mid-account: a line cut
 * between `#2` and its percentage is worse than no second row at all. A
 * candidate with any single segment wider than the row cannot be laid out this
 * way and is rejected, which sends the caller to the next rung down.
 */
export declare function wrapStatusCandidate(candidate: string, maxChars: number, maxRows: number): string[] | undefined;
/**
 * Lay a candidate ladder out in the space available, in up to `maxRows` rows.
 *
 * The ladder is walked once, and the first rung that fits wins - whether it
 * fits on one row or has to be broken across two. Trying every rung on one row
 * before allowing a second would shed detail the reader has room for.
 */
export declare function fitStatusLines(candidates: readonly string[], maxChars: number, maxRows: number): string[];
/**
 * Render the whole account pool, degrading through
 * {@link formatQuotaOverviewCandidates} until one form fits.
 */
export declare function formatQuotaOverviewStatusLines(params: {
    accounts: readonly QuotaOverviewAccount[];
    options: QuotaOverviewOptions;
    width?: number;
    availableChars?: number;
    maxRows?: number;
}): string[];
export declare function formatQuotaOverviewStatusText(params: {
    accounts: readonly QuotaOverviewAccount[];
    options: QuotaOverviewOptions;
    width?: number;
    availableChars?: number;
}): string;
/** The banked-reset line, laid out the same way as the pool line. */
export declare function formatQuotaResetsStatusLines(params: {
    accounts: readonly QuotaOverviewAccount[];
    options: QuotaOverviewOptions;
    resetsMinUsedPercent?: number;
    width?: number;
    availableChars?: number;
    maxRows?: number;
}): string[];
/** The Codex-credits line, laid out the same way as the resets line. */
export declare function formatQuotaCreditsStatusLines(params: {
    accounts: readonly QuotaOverviewAccount[];
    options: QuotaOverviewOptions;
    resetsMinUsedPercent?: number;
    width?: number;
    availableChars?: number;
    maxRows?: number;
}): string[];
export type QuotaPromptTone = "normal" | "warning" | "danger" | "stale" | "unknown";
/**
 * Colour the pool by its healthiest account.
 *
 * A pool is only in trouble when nothing in it has room left, so the account
 * with the most headroom decides the colour: keying on the worst account would
 * paint the line red for a spent seat that rotation has already stopped
 * selecting while six healthy ones serve every request.
 */
export declare function resolveQuotaOverviewTone(accounts: readonly QuotaOverviewAccount[], stale?: boolean): QuotaPromptTone;
export declare function resolveQuotaPromptTone(quota: CompactQuotaStatus): QuotaPromptTone;
export declare function formatQuotaDetailsText(quota: CompactQuotaStatus, now?: number, options?: {
    maskEmail?: boolean;
    quotaDisplay?: QuotaDisplayMode;
}): string;
