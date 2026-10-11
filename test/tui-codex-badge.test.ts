import { describe, expect, it } from "vitest";
import { formatCodexUsageBadge } from "../lib/tui-codex-badge.js";

const now = 1_800_000_000_000;
const badge = {
	planType: "plus",
	accountIndex: 2,
	accountCount: 2,
	primary: { label: "5h", usedPercent: 40, resetAtMs: now + 3_600_000 },
	secondary: { label: "weekly", usedPercent: 25, resetAtMs: now + 86_400_000 },
	aggregate: {
		accountCount: 2,
		availableCount: 2,
		primary: { label: "5h", usedPercent: 60, resetAtMs: now + 3_600_000 },
		secondary: { label: "weekly", usedPercent: 38, resetAtMs: now + 86_400_000 },
	},
};

function rowText(row: ReturnType<typeof formatCodexUsageBadge>[number]): string {
	return row.map((segment) => segment.text).join("");
}

describe("Codex usage badge formatting", () => {
	it("shows active and aligned aggregate usage with resets on wide slots", () => {
		const rows = formatCodexUsageBadge(badge, 80, now);
		expect(rows.map(rowText)).toEqual([
			"[Plus 2/2] 5h: 40% (-1h) | weekly: 25% (-1d)",
			"[All     ] 5h: 60% (-1h) | weekly: 38% (-1d)",
		]);
		expect(rows[0].find((segment) => segment.usedPercent === 40)?.color).toBe("#47ff91");
	});

	it("omits slot counts, aggregate, and reset details in compact mode", () => {
		const rows = formatCodexUsageBadge(badge, 63, now);
		expect(rows.map(rowText)).toEqual(["[Plus] 5h: 40% | weekly: 25%"]);
	});

	it("omits the aggregate when only one account has usable readings", () => {
		const rows = formatCodexUsageBadge({
			...badge,
			aggregate: { ...badge.aggregate, accountCount: 3, availableCount: 1 },
		}, 80, now);
		expect(rows.map(rowText)).toEqual(["[Plus 2/2] 5h: 40% (-1h) | weekly: 25% (-1d)"]);
	});

	it("omits the badge below 32 columns and keeps it compact at 32", () => {
		expect(formatCodexUsageBadge(badge, 31, now)).toEqual([]);
		expect(formatCodexUsageBadge(badge, 32, now).map(rowText)).toEqual(["[Plus] 5h: 40% | weekly: 25%"]);
	});

	it("keeps every rendered row within its actual slot width", () => {
		for (const width of [32, 40, 63, 64, 80, 120]) {
			const rows = formatCodexUsageBadge({ ...badge, planType: "business", accountCount: 123, accountIndex: 123 }, width, now);
			for (const row of rows) expect(rowText(row).length).toBeLessThanOrEqual(width);
		}
	});

	it("keeps incomplete quota values safe and degrades to one window when needed", () => {
		const rows = formatCodexUsageBadge({
			accountCount: 1,
			primary: { label: "5h", usedPercent: Number.NaN, resetAtMs: Number.POSITIVE_INFINITY },
			secondary: { label: "weekly", usedPercent: 35 },
		}, 32, now);
		expect(rows.map(rowText)).toEqual(["[Codex] weekly: 35%"]);
		expect(JSON.stringify(rows)).not.toMatch(/NaN|Infinity/);
	});
});
