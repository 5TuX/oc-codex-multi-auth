import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	overview: vi.fn(),
	cachedOverview: vi.fn(),
	promptStatus: vi.fn(),
	resetsParams: vi.fn(),
	sharedSnapshot: vi.fn(),
	projectRoot: null as string | null,
	freshSnapshot: true,
	quotaStatus: undefined as Record<string, unknown> | undefined,
	accountStorage: null as null | { activeIndex: number; accounts: Array<{ refreshToken: string; enabled?: boolean }> },
}));

vi.mock("../lib/config.js", async (original) => ({
	...await original<typeof import("../lib/config.js")>(),
	loadPluginConfig: () => ({ codexTuiMaskEmail: true, quotaStatus: mocks.quotaStatus }),
	getCodexTuiMaskEmail: () => true,
}));
vi.mock("../lib/storage.js", () => ({
	getStoragePath: () => "/tmp/opencode/accounts.json",
	loadAccounts: async () => mocks.accountStorage ?? ({ activeIndex: 1, accounts: [
		{ email: "first@example.com", refreshToken: "private-refresh", accessToken: "private-access", enabled: false },
		{ accountLabel: "Work", email: "second@example.com", refreshToken: "another-refresh" },
	] }),
}));
vi.mock("../lib/storage/state.js", () => ({
	getCurrentProjectRoot: () => mocks.projectRoot,
}));
vi.mock("../lib/tui-quota-cache.js", () => ({
	readTuiQuotaSnapshot: mocks.sharedSnapshot,
	readTuiQuotaOverviewSnapshot: mocks.cachedOverview,
	isFreshTuiQuotaSnapshot: () => mocks.freshSnapshot,
	TUI_QUOTA_OVERVIEW_CACHE_FILE: "overview.json",
}));
vi.mock("../lib/tui-quota-overview.js", () => ({
	fetchTuiQuotaOverview: mocks.overview,
	toQuotaOverviewAccounts: () => [],
}));
vi.mock("../lib/tui-status.js", async (original) => ({
	...await original<typeof import("../lib/tui-status.js")>(),
	formatPromptStatusText: (options: unknown) => { mocks.promptStatus(options); return "quota"; },
	formatQuotaResetsStatusLines: (params: unknown) => { mocks.resetsParams(params); return []; },
	formatQuotaOverviewStatusLines: () => ["pool 40%"],
}));
import { readV2Status, resetV2StatusThrottle } from "../lib/opencode-v2-status.js";
import { CodexStatusRpc } from "../lib/opencode-v2-rpc.js";
import { resolveDisplayEmail } from "../lib/account-display.js";
import { createUsageAccountFingerprint } from "../lib/codex-usage.js";

beforeEach(() => {
	resetV2StatusThrottle();
	mocks.overview.mockReset();
	mocks.cachedOverview.mockReset();
	mocks.sharedSnapshot.mockReset();
	mocks.sharedSnapshot.mockResolvedValue(null);
	mocks.quotaStatus = undefined;
	mocks.accountStorage = null;
	mocks.projectRoot = null;
	mocks.freshSnapshot = true;
});

it("reports the effective account storage scope", async () => {
	mocks.overview.mockResolvedValue(null);
	expect((await readV2Status({ width: 80 })).accountStorage).toBe("global");
	mocks.projectRoot = "/tmp/opencode/project";
	expect((await readV2Status({ width: 80 })).accountStorage).toBe("project");
});

it("lists every account with masked identities even when quota is unavailable", async () => {
	mocks.overview.mockResolvedValue(null);
	const result = await readV2Status({ width: 80 });
	expect(result.accounts).toEqual([
		{ index: 1, label: resolveDisplayEmail("first@example.com", true), active: false, enabled: false },
		{ index: 2, label: "Work", active: true, enabled: true },
	]);
	expect(JSON.stringify(result)).not.toMatch(/private-refresh|private-access|another-refresh|first@example.com|second@example.com/);
});

it("marks the account serving requests rather than the selected pool account", async () => {
	mocks.overview.mockResolvedValue(null);
	mocks.sharedSnapshot.mockResolvedValue({
		source: "headers", fingerprint: createUsageAccountFingerprint({ refreshToken: "private-refresh" }),
		fetchedAt: Date.now(), limits: [],
	});
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([true, false]);
	mocks.freshSnapshot = false;
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([false, true]);
	mocks.freshSnapshot = true;

	// Another project or a removed account must not influence this pool's sidebar.
	mocks.sharedSnapshot.mockResolvedValue({ source: "headers", fingerprint: "other-pool", fetchedAt: Date.now(), limits: [] });
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([false, true]);
});

it("does not attribute a shared headers snapshot to another seeded project", async () => {
	mocks.overview.mockResolvedValue(null);
	mocks.sharedSnapshot.mockResolvedValue({
		source: "headers", fingerprint: createUsageAccountFingerprint({ refreshToken: "private-refresh" }),
		fetchedAt: Date.now(), limits: [],
	});
	mocks.projectRoot = "/tmp/opencode/project-a";
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([false, true]);
	mocks.projectRoot = "/tmp/opencode/project-b";
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([false, true]);
});

it("does not mistake a usage poll for a serving-account change", async () => {
	mocks.overview.mockResolvedValue(null);
	mocks.sharedSnapshot.mockResolvedValue({
		source: "usage", fingerprint: createUsageAccountFingerprint({ refreshToken: "private-refresh" }),
		fetchedAt: Date.now(), limits: [],
	});
	expect((await readV2Status({ width: 80 })).accounts.map((account) => account.active)).toEqual([false, true]);
});

it("uses a one-based account index in the V2 quota status", async () => {
	mocks.overview.mockResolvedValue({
		fetchedAt: Date.now(),
		accounts: [{ fingerprint: createUsageAccountFingerprint({ refreshToken: "another-refresh" }), limits: [] }],
	});
	await readV2Status({ width: 80 });
	expect(mocks.promptStatus).toHaveBeenLastCalledWith(expect.objectContaining({
		quota: expect.objectContaining({ accountIndex: 2, accountCount: 2 }),
	}));
});

it("exposes credential-free active and aggregate data for the Codex badge", async () => {
	const now = Date.now();
	const firstFingerprint = createUsageAccountFingerprint({ refreshToken: "first-secret" });
	const secondFingerprint = createUsageAccountFingerprint({ refreshToken: "second-secret" });
	mocks.accountStorage = { activeIndex: 1, accounts: [
		{ refreshToken: "first-secret" },
		{ refreshToken: "second-secret" },
	] };
	mocks.sharedSnapshot.mockResolvedValue({
		source: "usage", fingerprint: secondFingerprint, fetchedAt: now,
		accountIndex: 2, accountCount: 2, planType: "plus",
		limits: [
			{ label: "5h", leftPercent: 60, usedPercent: 40, windowMinutes: 300, resetAtMs: now + 3_600_000 },
			{ label: "weekly", leftPercent: 75, usedPercent: 25, windowMinutes: 10_080, resetAtMs: now + 86_400_000 },
		],
	});
	mocks.overview.mockResolvedValue({ fetchedAt: now, accounts: [
		{ index: 1, fingerprint: firstFingerprint, limits: [
			{ label: "5h", leftPercent: 20, usedPercent: 80, windowMinutes: 300, resetAtMs: now + 7_200_000 },
			{ label: "weekly", leftPercent: 50, usedPercent: 50, windowMinutes: 10_080, resetAtMs: now + 172_800_000 },
		] },
		{ index: 2, fingerprint: secondFingerprint, planType: "plus", limits: [
			{ label: "5h", leftPercent: 60, usedPercent: 40, windowMinutes: 300, resetAtMs: now + 3_600_000 },
			{ label: "weekly", leftPercent: 75, usedPercent: 25, windowMinutes: 10_080, resetAtMs: now + 86_400_000 },
		] },
	] });

	const result = await readV2Status({ width: 80 });
	expect(result.badge).toEqual({
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
	});
	expect(mocks.overview).toHaveBeenCalledTimes(1);
	expect(JSON.stringify(result.badge)).not.toMatch(/secret|fingerprint|example\.com|accountId|organizationId/);
	expect(CodexStatusRpc.methods.status.output.parse(result)).toEqual(result);
});

it("omits unusable quota numbers from the Codex badge", async () => {
	const now = Date.now();
	mocks.sharedSnapshot.mockResolvedValue({
		source: "usage", fingerprint: createUsageAccountFingerprint({ refreshToken: "another-refresh" }),
		fetchedAt: now, accountIndex: 2, accountCount: 2,
		limits: [
			{ label: "5h", leftPercent: null, usedPercent: Number.NaN, resetAtMs: Number.POSITIVE_INFINITY },
			{ label: "weekly", leftPercent: 70, windowMinutes: 10_080, resetAtMs: now + 60_000 },
		],
	});
	mocks.overview.mockResolvedValue({ fetchedAt: now, accounts: [] });
	const result = await readV2Status({ width: 80 });
	expect(result.badge?.primary).toBeUndefined();
	expect(result.badge?.secondary).toEqual({ label: "weekly", usedPercent: 30, resetAtMs: now + 60_000 });
	expect(JSON.stringify(result.badge)).not.toMatch(/NaN|Infinity/);
});

it("aggregates only enabled accounts with usable readings", async () => {
	const now = Date.now();
	mocks.accountStorage = { activeIndex: 0, accounts: [
		{ refreshToken: "first-secret" },
		{ refreshToken: "disabled-secret", enabled: false },
		{ refreshToken: "failed-secret" },
	] };
	mocks.overview.mockResolvedValue({ fetchedAt: now, accounts: [
		{ index: 1, fingerprint: "first", limits: [
			{ label: "5h", usedPercent: 44, resetAtMs: now + 60_000 },
		] },
		{ index: 2, fingerprint: "disabled", limits: [
			{ label: "5h", usedPercent: 100, resetAtMs: now + 30_000 },
		] },
		{ index: 3, fingerprint: "failed", readFailedAt: now, limits: [
			{ label: "5h", usedPercent: 100, resetAtMs: now + 10_000 },
		] },
	] });
	const result = await readV2Status({ width: 80 });
	expect(result.badge.aggregate).toEqual({
		accountCount: 2,
		availableCount: 1,
		primary: { label: "5h", usedPercent: 44, resetAtMs: now + 60_000 },
		secondary: undefined,
	});
});

it("keeps the account serving the latest Codex request active when loading the pool aggregate", async () => {
	const now = Date.now();
	const firstFingerprint = createUsageAccountFingerprint({ refreshToken: "private-refresh" });
	const secondFingerprint = createUsageAccountFingerprint({ refreshToken: "another-refresh" });
	mocks.sharedSnapshot.mockResolvedValue({
		source: "headers", fingerprint: firstFingerprint, fetchedAt: now,
		accountIndex: 1, accountCount: 2, planType: "plus",
		limits: [{ label: "5h", usedPercent: 31, resetAtMs: now + 60_000 }],
	});
	mocks.overview.mockResolvedValue({ fetchedAt: now - 1, accounts: [
		{ index: 1, fingerprint: firstFingerprint, planType: "plus", limits: [
			{ label: "5h", usedPercent: 31, resetAtMs: now + 60_000 },
		] },
		{ index: 2, fingerprint: secondFingerprint, planType: "pro", limits: [
			{ label: "5h", usedPercent: 92, resetAtMs: now + 600_000 },
		] },
	] });

	const result = await readV2Status({ width: 80 });
	expect(result.badge.accountIndex).toBe(1);
	expect(result.badge.planType).toBe("plus");
	expect(result.badge.primary?.usedPercent).toBe(31);
});

it("does not re-fetch the pool on every poll while the snapshot stays stale", async () => {
	const stale = { fetchedAt: 0, accounts: [] };
	mocks.overview.mockResolvedValue(stale);
	mocks.cachedOverview.mockResolvedValue(stale);
	for (let poll = 0; poll < 5; poll += 1) await readV2Status({ width: 80 });
	expect(mocks.overview).toHaveBeenCalledTimes(1);
	expect(mocks.cachedOverview).toHaveBeenCalledTimes(4);
});

it("skips an empty resets screen instead of blanking the status line", async () => {
	mocks.quotaStatus = { mode: ["resets"] };
	const snapshot = { fetchedAt: Date.now(), accounts: [] };
	mocks.overview.mockResolvedValue(snapshot);
	mocks.cachedOverview.mockResolvedValue(snapshot);
	expect((await readV2Status({ width: 80 })).text).toBe("");

	resetV2StatusThrottle();
	mocks.quotaStatus = { mode: ["overview", "resets"], rotateMs: 1_000 };
	const seen = new Set<string>();
	const now = vi.spyOn(Date, "now");
	for (const at of [0, 1_000, 2_000, 3_000]) {
		now.mockReturnValue(at);
		seen.add((await readV2Status({ width: 80 })).text);
	}
	now.mockRestore();
	expect([...seen]).toEqual(["pool 40%"]);
});

it("keeps the fetched pool when writing its cache failed", async () => {
	mocks.quotaStatus = { mode: ["overview"] };
	mocks.overview.mockResolvedValue({ fetchedAt: Date.now(), accounts: [] });
	mocks.cachedOverview.mockResolvedValue(undefined);
	expect((await readV2Status({ width: 80 })).text).toBe("pool 40%");
	expect((await readV2Status({ width: 80 })).text).toBe("pool 40%");
	expect(mocks.overview).toHaveBeenCalledTimes(1);
});

it("passes resetsMinUsedPercent to the V2 resets screen", async () => {
	mocks.quotaStatus = { mode: ["resets"], resetsMinUsedPercent: 80 };
	mocks.overview.mockResolvedValue({ fetchedAt: Date.now(), accounts: [] });
	await readV2Status({ width: 80 });
	expect(mocks.resetsParams).toHaveBeenLastCalledWith(expect.objectContaining({ resetsMinUsedPercent: 80 }));
});
