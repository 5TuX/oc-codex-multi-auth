import { createElement, spread } from "@opentui/solid";
import type { Plugin } from "@opencode/plugin/tui";
import { createSignal } from "solid-js";
import { displayWidth, sanitizeDisplayText } from "./ui/display-text.js";
import type { CodexStatusBadge } from "./opencode-v2-rpc.js";

export type CodexBadgeSegment = {
	text: string;
	color: string;
	usedPercent?: number;
};

export type CodexBadgeRow = CodexBadgeSegment[];

type Rgb = [number, number, number];
const BODY_WIDTH = 8;
const JET_STOPS: Array<{ at: number; color: Rgb }> = [
	{ at: 0, color: [0, 0, 1] },
	{ at: 0.25, color: [0, 1, 1] },
	{ at: 0.5, color: [0, 1, 0] },
	{ at: 0.75, color: [1, 1, 0] },
	{ at: 1, color: [1, 0, 0] },
];

function jetColor(usedPercent: number): string {
	const value = Math.max(0, Math.min(100, usedPercent)) / 100;
	let color: Rgb = JET_STOPS.at(-1)?.color ?? [1, 0, 0];
	for (let index = 1; index < JET_STOPS.length; index += 1) {
		const previous = JET_STOPS[index - 1];
		const next = JET_STOPS[index];
		if (!previous || !next || value > next.at) continue;
		const amount = (value - previous.at) / (next.at - previous.at);
		color = previous.color.map((channel, channelIndex) =>
			channel + ((next.color[channelIndex] ?? channel) - channel) * amount,
		) as Rgb;
		break;
	}
	return `#${color.map((channel) => Math.round((channel * 0.72 + 0.28) * 255)
		.toString(16).padStart(2, "0")).join("")}`;
}

function formatCountdown(resetAtMs: number, now: number): string | undefined {
	const totalSeconds = Math.max(0, Math.ceil((resetAtMs - now) / 1000));
	if (totalSeconds <= 1) return undefined;
	if (totalSeconds < 60) return `${totalSeconds}s`;
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = totalSeconds % 60;
	if (days > 0) return hours > 0 ? `${days}d${hours}h` : `${days}d`;
	if (hours > 0) return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
	return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
}

function formatPlan(planType: string | undefined): string {
	const plan = sanitizeDisplayText(planType, { maxLength: BODY_WIDTH }) ?? "Codex";
	return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function accountPrefix(badge: CodexStatusBadge, compact: boolean, mutedColor: string): CodexBadgeSegment {
	const plan = formatPlan(badge.planType);
	const hasSlot = !compact && badge.accountCount > 1 &&
		typeof badge.accountIndex === "number" && badge.accountIndex >= 1 && badge.accountIndex <= badge.accountCount;
	if (!hasSlot) return { text: `[${plan}] `, color: mutedColor };
	const slot = `${badge.accountIndex}/${badge.accountCount}`;
	const gap = Math.max(1, BODY_WIDTH - plan.length - slot.length);
	return { text: `[${plan}${" ".repeat(gap)}${slot}] `, color: mutedColor };
}

function usageWindow(
	window: CodexStatusBadge["primary"],
	includeReset: boolean,
	now: number,
	mutedColor: string,
): CodexBadgeRow | undefined {
	if (!window) return undefined;
	const label = sanitizeDisplayText(window.label, { maxLength: 12 });
	if (!label) return undefined;
	const usedPercent = typeof window.usedPercent === "number" && Number.isFinite(window.usedPercent)
		? Math.max(0, Math.min(100, window.usedPercent))
		: undefined;
	const reset = includeReset && typeof window.resetAtMs === "number" && Number.isFinite(window.resetAtMs)
		? formatCountdown(window.resetAtMs, now)
		: undefined;
	if (usedPercent === undefined && reset === undefined) return undefined;
	const parts: CodexBadgeRow = [{
		text: `${label}: ${usedPercent === undefined ? "--" : `${Math.round(usedPercent)}%`}`,
		color: usedPercent === undefined ? mutedColor : jetColor(usedPercent),
		...(usedPercent === undefined ? {} : { usedPercent }),
	}];
	if (reset) parts.push({ text: ` (-${reset})`, color: mutedColor });
	return parts;
}

function appendWindow(row: CodexBadgeRow, window: CodexBadgeRow | undefined, mutedColor: string): void {
	if (!window) return;
	if (row.length > 1) {
		row.push({ text: " | ", color: mutedColor });
	}
	row.push(...window);
}

function activeRow(
	badge: CodexStatusBadge,
	windows: Array<CodexBadgeRow | undefined>,
	compact: boolean,
	mutedColor: string,
): CodexBadgeRow {
	const row: CodexBadgeRow = [accountPrefix(badge, compact, mutedColor)];
	for (const window of windows) appendWindow(row, window, mutedColor);
	if (row.length === 1) row.push({ text: "limits ?", color: mutedColor });
	return row;
}

function rowText(row: CodexBadgeRow): string {
	return row.map((segment) => segment.text).join("");
}

function fits(row: CodexBadgeRow, width: number): boolean {
	return displayWidth(rowText(row)) <= width;
}

function aggregateRow(
	badge: CodexStatusBadge,
	includeReset: boolean,
	now: number,
	mutedColor: string,
): CodexBadgeRow | undefined {
	const aggregate = badge.aggregate;
	if (!aggregate || aggregate.accountCount <= 1 || aggregate.availableCount <= 1) return undefined;
	const row: CodexBadgeRow = [{
		text: `[${"All".padEnd(BODY_WIDTH)}] `,
		color: mutedColor,
	}];
	appendWindow(row, usageWindow(aggregate.primary, includeReset, now, mutedColor), mutedColor);
	appendWindow(row, usageWindow(aggregate.secondary, includeReset, now, mutedColor), mutedColor);
	return row.length === 1 ? undefined : row;
}

/** Format colored status rows within the measured slot width. */
export function formatCodexUsageBadge(
	badge: CodexStatusBadge,
	width: number,
	now = Date.now(),
	mutedColor = "#808080",
): CodexBadgeRow[] {
	if (!Number.isFinite(width) || width < 32) return [];
	const compact = width < 64;
	const primary = usageWindow(badge.primary, !compact, now, mutedColor);
	const secondary = usageWindow(badge.secondary, !compact, now, mutedColor);
	const candidates = compact
		? [
			activeRow(badge, [primary, secondary], true, mutedColor),
			activeRow(badge, [primary], true, mutedColor),
			activeRow(badge, [secondary], true, mutedColor),
		]
		: [
			activeRow(badge, [primary, secondary], false, mutedColor),
			activeRow(badge, [usageWindow(badge.primary, false, now, mutedColor), usageWindow(badge.secondary, false, now, mutedColor)], false, mutedColor),
			activeRow(badge, [primary], false, mutedColor),
			activeRow(badge, [usageWindow(badge.primary, false, now, mutedColor)], false, mutedColor),
			activeRow(badge, [secondary], false, mutedColor),
			activeRow(badge, [usageWindow(badge.secondary, false, now, mutedColor)], false, mutedColor),
		];
	const active = candidates.find((candidate) => fits(candidate, width));
	if (!active) return [];
	if (compact) return [active];
	const aggregate = aggregateRow(badge, true, now, mutedColor);
	if (aggregate && fits(aggregate, width)) return [active, aggregate];
	const compactAggregate = aggregateRow(badge, false, now, mutedColor);
	return compactAggregate && fits(compactAggregate, width) ? [active, compactAggregate] : [active];
}

/** Render into a flex-shrinking slot and choose compact mode from its measured width. */
export function renderCodexUsageBadge(
	badge: () => CodexStatusBadge,
	theme: Plugin.Context["theme"],
) {
	const [width, setWidth] = createSignal(0);
	const mutedColor = theme.text?.muted ?? theme.textMuted ?? theme.text?.base ?? "#808080";
	const root = createElement("box");
	spread(root, {
		width: "100%",
		flexDirection: "column",
		flexShrink: 1,
		minWidth: 0,
		onSizeChange: function (this: { width: number }) {
			setWidth(this.width);
		},
		get children() {
			return formatCodexUsageBadge(badge(), width(), Date.now(), mutedColor).map((row) => {
				const line = createElement("box");
				spread(line, {
					flexDirection: "row",
					get children() {
						return row.map((segment) => {
							const text = createElement("text");
							spread(text, { children: segment.text, fg: segment.color });
							return text;
						});
					},
				});
				return line;
			});
		},
	});
	return root;
}
