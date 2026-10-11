import type { Plugin } from "@opencode/plugin/tui";
import type { CodexStatusBadge } from "./opencode-v2-rpc.js";
export type CodexBadgeSegment = {
    text: string;
    color: string;
    usedPercent?: number;
};
export type CodexBadgeRow = CodexBadgeSegment[];
/** Format colored status rows within the measured slot width. */
export declare function formatCodexUsageBadge(badge: CodexStatusBadge, width: number, now?: number, mutedColor?: string): CodexBadgeRow[];
/** Render into a flex-shrinking, content-sized slot and compact to its measured width. */
export declare function renderCodexUsageBadge(badge: () => CodexStatusBadge, theme: Plugin.Context["theme"], renderer?: Plugin.Context["renderer"]): import("@opentui/core").BaseRenderable;
