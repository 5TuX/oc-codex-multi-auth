import { getCodexTuiGlyphMode, getCodexTuiMaskEmail, getCodexTuiMaskEmailInQuotaDetails, getQuotaDisplay, getQuotaStatus, loadPluginConfig } from "./config.js";
import { fetchTuiQuotaOverview, toQuotaOverviewAccounts } from "./tui-quota-overview.js";
import { readTuiQuotaSnapshot, readTuiQuotaOverviewSnapshot, isFreshTuiQuotaSnapshot, TUI_QUOTA_OVERVIEW_CACHE_FILE } from "./tui-quota-cache.js";
import { formatPromptStatusText, formatQuotaDetailsText, formatQuotaCreditsStatusLines, formatQuotaOverviewStatusLines, formatQuotaResetsStatusLines } from "./tui-status.js";
import { dirname, join } from "node:path";
import { getStoragePath, loadAccounts } from "./storage.js";
import { getCurrentProjectRoot } from "./storage/state.js";
import { createUsageAccountFingerprint } from "./codex-usage.js";
import { resolveDisplayEmail } from "./account-display.js";
import { sanitizeDisplayText } from "./ui/display-text.js";
/** Same cadence as the V1 prompt status poll. */
const OVERVIEW_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const lastOverviewAttempt = new Map();
function isWeeklyLimit(limit) {
    return (typeof limit.windowMinutes === "number" && Math.abs(limit.windowMinutes - 10_080) < 30) ||
        /^(weekly|7d|1w)$/i.test(limit.label.trim());
}
function badgeWindow(limits, weekly) {
    const limit = limits.find((candidate) => isWeeklyLimit(candidate) === weekly);
    if (!limit)
        return undefined;
    const label = sanitizeDisplayText(limit.label, { maxLength: 24 });
    if (!label)
        return undefined;
    const usedPercent = typeof limit.usedPercent === "number" && Number.isFinite(limit.usedPercent)
        ? Math.max(0, Math.min(100, limit.usedPercent))
        : typeof limit.leftPercent === "number" && Number.isFinite(limit.leftPercent)
            ? Math.max(0, Math.min(100, 100 - limit.leftPercent))
            : undefined;
    const resetAtMs = typeof limit.resetAtMs === "number" && Number.isFinite(limit.resetAtMs)
        && limit.resetAtMs > Date.now()
        ? limit.resetAtMs
        : undefined;
    if (usedPercent === undefined && resetAtMs === undefined)
        return undefined;
    return {
        label,
        ...(usedPercent === undefined ? {} : { usedPercent }),
        ...(resetAtMs === undefined ? {} : { resetAtMs }),
    };
}
function aggregateBadgeWindow(accounts, weekly) {
    const windows = accounts
        .filter((account) => account.readFailedAt === undefined)
        .map((account) => badgeWindow(account.limits, weekly))
        .filter((window) => window !== undefined);
    if (windows.length === 0)
        return undefined;
    const percentages = windows
        .map((window) => window.usedPercent)
        .filter((value) => typeof value === "number" && Number.isFinite(value));
    const resets = windows
        .map((window) => window.resetAtMs)
        .filter((value) => typeof value === "number" && Number.isFinite(value));
    const firstWindow = windows[0];
    if (!firstWindow)
        return undefined;
    return {
        label: firstWindow.label,
        ...(percentages.length === 0 ? {} : {
            usedPercent: Math.round(percentages.reduce((total, value) => total + value, 0) / percentages.length),
        }),
        ...(resets.length === 0 ? {} : { resetAtMs: Math.min(...resets) }),
    };
}
function badgeData(quota, pool, overview) {
    const enabledAccountCount = pool?.accounts.filter((account) => account.enabled !== false).length ?? 0;
    const ready = quota.type === "ready" && !quota.stale ? quota : undefined;
    const freshOverview = overview && isFreshTuiQuotaSnapshot(overview) ? overview : null;
    const availableAccounts = (freshOverview?.accounts ?? []).filter((account) => pool?.accounts.some((candidate, index) => candidate.enabled !== false && index + 1 === account.index));
    const availableCount = availableAccounts.filter((account) => account.readFailedAt === undefined &&
        (badgeWindow(account.limits, false) !== undefined || badgeWindow(account.limits, true) !== undefined)).length;
    const aggregate = enabledAccountCount > 1 && freshOverview ? {
        accountCount: enabledAccountCount,
        availableCount,
        primary: aggregateBadgeWindow(availableAccounts, false),
        secondary: aggregateBadgeWindow(availableAccounts, true),
    } : undefined;
    return {
        ...(ready?.planType ? { planType: sanitizeDisplayText(ready.planType, { maxLength: 32 }) } : {}),
        ...(typeof ready?.accountIndex === "number" && Number.isInteger(ready.accountIndex) && ready.accountIndex >= 1
            ? { accountIndex: ready.accountIndex }
            : {}),
        accountCount: typeof ready?.accountCount === "number" && Number.isInteger(ready.accountCount) && ready.accountCount >= 0
            ? ready.accountCount
            : enabledAccountCount,
        primary: ready ? badgeWindow(ready.limits, false) : undefined,
        secondary: ready ? badgeWindow(ready.limits, true) : undefined,
        ...(aggregate ? { aggregate } : {}),
    };
}
/** Test hook: forget when each pool was last fetched. */
export function resetV2StatusThrottle() {
    lastOverviewAttempt.clear();
}
/**
 * The TUI asks for status every two seconds, and a pool snapshot can stay stale
 * indefinitely (a failing account keeps its older reading and fetch time). Gate
 * the network pass on the last attempt, not the last success, so a stale cache
 * reads the file instead of re-fetching every account on every poll. The last
 * fetched snapshot is kept in memory too: if writing it to the cache failed,
 * the file is older and must not win.
 */
async function loadPoolOverview(cachePath) {
    const now = Date.now();
    const last = lastOverviewAttempt.get(cachePath);
    if (last !== undefined && now - last.at < OVERVIEW_REFRESH_INTERVAL_MS) {
        const cached = await readTuiQuotaOverviewSnapshot(cachePath);
        if (!last.snapshot)
            return cached;
        return cached && cached.fetchedAt >= last.snapshot.fetchedAt ? cached : last.snapshot;
    }
    const entry = { at: now, snapshot: undefined };
    lastOverviewAttempt.set(cachePath, entry);
    entry.snapshot = await fetchTuiQuotaOverview({ cachePath, now });
    return entry.snapshot;
}
/** Format on the server so remote TUIs never need access to credentials. */
export async function readV2Status({ width }) {
    const config = loadPluginConfig();
    const status = getQuotaStatus(config);
    const quotaDisplay = getQuotaDisplay(config);
    const maskEmail = getCodexTuiMaskEmail(config);
    const glyphMode = getCodexTuiGlyphMode(config);
    const snapshot = await readTuiQuotaSnapshot();
    const pool = await loadAccounts();
    // The headers cache is global: project pools seeded from the same accounts
    // share fingerprints, so it cannot attribute a request to this project.
    const servingIndex = !getCurrentProjectRoot() && snapshot?.source === "headers" && isFreshTuiQuotaSnapshot(snapshot)
        ? pool?.accounts.findIndex((account) => createUsageAccountFingerprint(account) === snapshot.fingerprint)
        : undefined;
    const owned = snapshot && pool?.accounts.some((account) => createUsageAccountFingerprint(account) === snapshot.fingerprint);
    let quota = snapshot && owned
        ? { ...snapshot, type: "ready", stale: !isFreshTuiQuotaSnapshot(snapshot) }
        : { type: pool?.accounts.length ? "unavailable" : "missing" };
    const wantsPool = status.screens.some((screen) => screen !== "active") || (pool?.accounts.length ?? 0) > 1;
    const overview = pool?.accounts.length && (wantsPool || quota.type !== "ready" || quota.stale)
        ? await loadPoolOverview(join(dirname(getStoragePath()), TUI_QUOTA_OVERVIEW_CACHE_FILE))
        : null;
    const activeIndex = servingIndex !== undefined && servingIndex >= 0 ? servingIndex : pool?.activeIndex;
    const active = activeIndex === undefined ? undefined : pool?.accounts[activeIndex];
    const usage = active && overview?.accounts.find((account) => account.fingerprint === createUsageAccountFingerprint(active));
    if (usage && overview) {
        quota = { type: "ready", limits: usage.limits, stale: !isFreshTuiQuotaSnapshot(overview),
            source: "usage", fetchedAt: overview.fetchedAt, accountIndex: activeIndex === undefined ? undefined : activeIndex + 1,
            accountCount: pool?.accounts.length, accountEmail: active.email, accountLabel: active.accountLabel,
            planType: usage.planType };
    }
    // `width` is the raw terminal width the TUI reported; the formatters apply
    // their own single discount (`maxStatusChars` tiers, `maxOverviewStatusChars`
    // reserve), so it is passed through unadjusted — discounting it again here
    // would shrink the line twice.
    const activeText = formatPromptStatusText({ quota, width, quotaDisplay, maskEmail, glyphMode });
    const renderScreen = (screen) => {
        if (screen === "active" || !overview)
            return activeText;
        const format = screen === "resets"
            ? formatQuotaResetsStatusLines
            : screen === "credits" ? formatQuotaCreditsStatusLines : formatQuotaOverviewStatusLines;
        return format({
            accounts: toQuotaOverviewAccounts(overview), width, maxRows: status.rows,
            resetsMinUsedPercent: status.resetsMinUsedPercent,
            options: { ...status, names: status.accountNames, mode: quotaDisplay, maskEmail },
        }).join("\n");
    };
    // Like V1, rotate only among screens with something to say: the resets
    // screen is empty until the pool is spent and must not blank the line.
    const rendered = status.screens.map(renderScreen).filter((text) => text.length > 0);
    const text = rendered.length > 0
        ? rendered[Math.floor(Date.now() / status.rotateMs) % rendered.length] ?? ""
        : "";
    return {
        text,
        badge: badgeData(quota, pool, overview),
        glyphMode,
        accountStorage: getCurrentProjectRoot() ? "project" : "global",
        accounts: (pool?.accounts ?? []).map((account, index) => ({
            index: index + 1,
            label: sanitizeDisplayText(account.accountLabel) ??
                sanitizeDisplayText(resolveDisplayEmail(account.email, maskEmail)) ??
                `Account ${index + 1}`,
            active: index === (servingIndex !== undefined && servingIndex >= 0 ? servingIndex : pool?.activeIndex),
            enabled: account.enabled !== false,
        })),
        details: formatQuotaDetailsText(quota, Date.now(), { quotaDisplay, maskEmail: getCodexTuiMaskEmailInQuotaDetails(config) }),
        showFor: status.showFor,
    };
}
//# sourceMappingURL=opencode-v2-status.js.map