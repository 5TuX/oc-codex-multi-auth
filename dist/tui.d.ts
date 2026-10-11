import type { TuiPluginApi } from "@opencode-ai/plugin/tui";
import type { Event } from "@opencode-ai/sdk/v2";
import { type QuotaStatusAudience, type QuotaStatusConfig } from "./lib/config.js";
import type { QuotaDisplayMode } from "./lib/quota-display.js";
import { type CompactQuotaStatus } from "./lib/tui-status.js";
import type { UiGlyphMode } from "./lib/ui/theme.js";
export { protectQuotaStatusSlot } from "./lib/tui-status-slot.js";
export declare function resolveQuotaPollFingerprint(api: TuiPluginApi): Promise<string | undefined>;
export declare function refreshQuotaStatusInner(api: TuiPluginApi): Promise<CompactQuotaStatus>;
export declare function shouldRefreshQuotaForEvent(event: Event): boolean;
type PromptStatusOptions = {
    maskEmail: boolean;
    maskEmailInQuotaDetails: boolean;
    quotaDisplay: QuotaDisplayMode;
    quotaStatus: QuotaStatusConfig;
    glyphMode: UiGlyphMode;
};
export declare function readPromptStatusOptions(): PromptStatusOptions;
/**
 * Whether two readings of the configuration would render the same line.
 *
 * Compared field by field rather than by identity: every poll builds a fresh
 * object, so identity always differs and pushing it into a signal would
 * re-render the status line every two seconds forever.
 */
export declare function samePromptStatusOptions(left: PromptStatusOptions, right: PromptStatusOptions): boolean;
/**
 * What the renderer actually gave this slot, once it has laid the prompt out.
 *
 * The terminal's own width is the wrong budget for a line sharing its row with
 * a sidebar, and wrong by an amount nothing in this plugin can derive - so the
 * row is measured instead of computed.
 */
type StatusSlotMetrics = {
    /** Columns this line may spend, or nothing when the prompt is unreadable. */
    availableChars?: number;
};
/**
 * Measure the row this line sits on, by walking up to it.
 *
 * The walk looks for the nearest ancestor laid out as a row with something else
 * in it - the prompt's bottom row, where the model label is the something else.
 * That row stretches to the prompt's inner width, which is the number the
 * terminal width fails to be whenever a sidebar is open, and the only number on
 * that row this line does not influence.
 *
 * Every hop is guarded and the whole thing returns nothing rather than a guess:
 * before the first layout pass there are no widths to read, and a host that
 * rearranges its prompt must degrade to the width heuristic rather than compute
 * a budget from numbers that no longer mean what they did.
 */
export declare function measureStatusSlot(node: unknown): StatusSlotMetrics;
/**
 * Whether the account pool is worth naming for the model in front of the user.
 *
 * Unknown counts as yes. A line the user asked for should not disappear
 * because a fresh session has no message to read a provider off yet, and being
 * told about a pool one model does not draw from is a smaller wrong than being
 * told nothing while it runs out.
 */
export declare function showsQuotaForSession(params: {
    audience: QuotaStatusAudience;
    providerID: string | undefined;
}): boolean;
declare const _default: {
    /** V2 loads terminal status through CLI slots rather than V1 prompt hooks. */
    setup(context: import("@opencode/plugin/tui").Plugin.Context): Promise<() => void>;
    id?: string;
    tui: import("@opencode-ai/plugin/tui").TuiPlugin;
    server?: never;
};
export default _default;
