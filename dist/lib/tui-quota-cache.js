import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { CODEX_QUOTA_WINDOW_KINDS, hasCodexQuotaHeaders, isQuotaWindowDisabled, parseCodexQuotaWindow, } from "./quota-windows.js";
import { renameWithWindowsRetry } from "./storage/atomic-write.js";
export const TUI_QUOTA_CACHE_VERSION = 1;
export const TUI_QUOTA_CACHE_FILE = "oc-codex-multi-auth-tui-quota.json";
export const TUI_QUOTA_OVERVIEW_CACHE_FILE = "oc-codex-multi-auth-tui-quota-overview.json";
const TUI_QUOTA_CACHE_WRITE_SKIP_MS = 500;
// A snapshot older than one TUI refresh interval is due for a live re-fetch:
// the shared cache is only pushed while requests flow, so after an idle gap it
// describes quota windows that may have reset server-side long ago.
export const TUI_QUOTA_SNAPSHOT_FRESH_MS = 5 * 60 * 1000;
const recentTuiQuotaWrites = new Map();
function getDefaultOpenCodeStateDir() {
    // Match OpenCode's xdg-basedir resolution: an absolute XDG_STATE_HOME
    // wins; relative values are ignored per the XDG spec.
    const xdg = process.env.XDG_STATE_HOME?.trim();
    if (xdg && isAbsolute(xdg))
        return join(xdg, "opencode");
    return join(homedir(), ".local", "state", "opencode");
}
function resolveStateDir(stateDir) {
    const envStateDir = process.env.OPENCODE_STATE_DIR?.trim();
    return stateDir?.trim() || envStateDir || getDefaultOpenCodeStateDir();
}
export function getTuiQuotaCachePath(stateDir) {
    return join(resolveStateDir(stateDir), TUI_QUOTA_CACHE_FILE);
}
export function getTuiQuotaOverviewCachePath(stateDir) {
    return join(resolveStateDir(stateDir), TUI_QUOTA_OVERVIEW_CACHE_FILE);
}
function parseFiniteIntHeader(headers, name) {
    const raw = headers.get(name);
    if (!raw)
        return undefined;
    const parsed = Number.parseInt(raw, 10);
    // A negative count is nonsense from a hostile or broken gateway; treat
    // it as absent so the details dialog never renders "Active limit: -5".
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
function formatWindowLabel(windowMinutes) {
    if (!windowMinutes ||
        !Number.isFinite(windowMinutes) ||
        windowMinutes <= 0) {
        return "quota";
    }
    if (windowMinutes % 1440 === 0)
        return `${windowMinutes / 1440}d`;
    if (windowMinutes % 60 === 0)
        return `${windowMinutes / 60}h`;
    return `${windowMinutes}m`;
}
function getLeftPercent(usedPercent) {
    return typeof usedPercent === "number" && Number.isFinite(usedPercent)
        ? Math.max(0, Math.min(100, Math.round(100 - usedPercent)))
        : null;
}
function parseLimit(headers, kind) {
    const { usedPercent, windowMinutes, resetAtMs } = parseCodexQuotaWindow(headers, kind);
    return {
        label: formatWindowLabel(windowMinutes),
        leftPercent: getLeftPercent(usedPercent),
        usedPercent,
        windowMinutes,
        resetAtMs,
    };
}
/**
 * A window OpenAI reports with `window-minutes: 0` is switched off for the
 * plan, not a window of unknown length. Such a window still carries
 * `used-percent: 0`, so it must be recognized by the explicit zero rather than
 * by the absence of data — otherwise it renders as a full `quota 100%` segment.
 * A window whose header is absent entirely stays eligible: that is an unknown
 * window, and it is still shown under the generic `quota` label.
 */
export function isDisabledQuotaLimit(limit) {
    return isQuotaWindowDisabled(limit);
}
function hasUsefulLimit(limit) {
    if (isDisabledQuotaLimit(limit))
        return false;
    return Boolean(limit.windowMinutes ||
        typeof limit.usedPercent === "number" ||
        typeof limit.resetAtMs === "number");
}
export function createTuiQuotaSnapshot(input) {
    return {
        version: TUI_QUOTA_CACHE_VERSION,
        ...input,
        fetchedAt: input.fetchedAt ?? Date.now(),
    };
}
function getSnapshotWriteKey(snapshot) {
    return JSON.stringify({
        fingerprint: snapshot.fingerprint,
        source: snapshot.source,
        accountIndex: snapshot.accountIndex,
        accountCount: snapshot.accountCount,
        accountEmail: snapshot.accountEmail,
        accountLabel: snapshot.accountLabel,
        planType: snapshot.planType,
        activeLimit: snapshot.activeLimit,
        limits: snapshot.limits.map((limit) => ({
            label: limit.label,
            leftPercent: limit.leftPercent,
            usedPercent: limit.usedPercent,
            windowMinutes: limit.windowMinutes,
            resetAtMs: limit.resetAtMs,
        })),
    });
}
export function parseTuiQuotaSnapshotFromHeaders(headers, input) {
    if (!hasCodexQuotaHeaders(headers))
        return undefined;
    const limits = CODEX_QUOTA_WINDOW_KINDS.map((kind) => parseLimit(headers, kind)).filter(hasUsefulLimit);
    if (limits.length === 0)
        return undefined;
    const planTypeRaw = headers.get("x-codex-plan-type");
    const planType = planTypeRaw?.trim() || undefined;
    const activeLimit = parseFiniteIntHeader(headers, "x-codex-active-limit");
    return createTuiQuotaSnapshot({
        ...input,
        source: "headers",
        planType,
        activeLimit,
        limits,
    });
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isOptionalFiniteNumber(value) {
    return value === undefined || (typeof value === "number" && Number.isFinite(value));
}
function isNullablePercent(value) {
    return (value === null ||
        (typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 100));
}
function isTuiQuotaLimit(value) {
    return (isRecord(value) &&
        typeof value.label === "string" &&
        value.label.trim().length > 0 &&
        isNullablePercent(value.leftPercent) &&
        isOptionalFiniteNumber(value.usedPercent) &&
        isOptionalFiniteNumber(value.windowMinutes) &&
        isOptionalFiniteNumber(value.resetAtMs));
}
export function isTuiQuotaSnapshot(value) {
    return (isRecord(value) &&
        value.version === TUI_QUOTA_CACHE_VERSION &&
        typeof value.fingerprint === "string" &&
        value.fingerprint.trim().length > 0 &&
        typeof value.fetchedAt === "number" &&
        Number.isFinite(value.fetchedAt) &&
        (value.source === "headers" || value.source === "usage") &&
        isOptionalFiniteNumber(value.accountIndex) &&
        isOptionalFiniteNumber(value.accountCount) &&
        (value.accountEmail === undefined ||
            typeof value.accountEmail === "string") &&
        (value.accountLabel === undefined ||
            typeof value.accountLabel === "string") &&
        (value.planType === undefined || typeof value.planType === "string") &&
        isOptionalFiniteNumber(value.activeLimit) &&
        Array.isArray(value.limits) &&
        value.limits.every(isTuiQuotaLimit));
}
/**
 * Drop disabled windows from a snapshot read back from disk.
 *
 * A cache written by an older build can still hold a `windowMinutes: 0` entry.
 * Filtering on read lets those snapshots heal without the user deleting the
 * cache file, and keeps a stale-cache render consistent with a fresh one.
 */
export function sanitizeTuiQuotaSnapshot(snapshot) {
    const limits = snapshot.limits.filter((limit) => !isDisabledQuotaLimit(limit));
    return limits.length === snapshot.limits.length
        ? snapshot
        : { ...snapshot, limits };
}
/**
 * Whether a snapshot is recent enough to render as current (`stale=false`)
 * without re-querying `/wham/usage`. A future `fetchedAt` (clock skew between
 * the writing and reading process) counts as fresh rather than poisoning the
 * cache until the skew elapses.
 */
export function isFreshTuiQuotaSnapshot(snapshot, now = Date.now()) {
    return now - snapshot.fetchedAt < TUI_QUOTA_SNAPSHOT_FRESH_MS;
}
export async function readTuiQuotaSnapshot(cachePath) {
    try {
        const raw = await fs.readFile(cachePath ?? getTuiQuotaCachePath(), "utf-8");
        const parsed = JSON.parse(raw);
        return isTuiQuotaSnapshot(parsed)
            ? sanitizeTuiQuotaSnapshot(parsed)
            : undefined;
    }
    catch {
        return undefined;
    }
}
function createTemporaryPath(target, now) {
    return `${target}.${process.pid}.${now}.${Math.random().toString(36).slice(2)}.tmp`;
}
async function writeSnapshotFile(target, temporary, snapshot) {
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, {
        encoding: "utf-8",
        mode: 0o600,
    });
    await renameWithWindowsRetry(temporary, target);
}
export async function writeTuiQuotaSnapshot(snapshot, cachePath) {
    const target = cachePath ?? getTuiQuotaCachePath();
    const writeKey = getSnapshotWriteKey(snapshot);
    const now = Date.now();
    const recentWrite = recentTuiQuotaWrites.get(target);
    if (recentWrite?.key === writeKey &&
        now - recentWrite.at < TUI_QUOTA_CACHE_WRITE_SKIP_MS) {
        await recentWrite.promise;
        return;
    }
    const temporary = createTemporaryPath(target, now);
    const writePromise = writeSnapshotFile(target, temporary, snapshot);
    recentTuiQuotaWrites.set(target, {
        key: writeKey,
        at: now,
        promise: writePromise,
    });
    try {
        await writePromise;
        recentTuiQuotaWrites.set(target, {
            key: writeKey,
            at: Date.now(),
        });
    }
    catch (error) {
        await fs.unlink(temporary).catch(() => undefined);
        if (recentTuiQuotaWrites.get(target)?.promise === writePromise) {
            recentTuiQuotaWrites.delete(target);
        }
        throw error;
    }
}
export async function clearTuiQuotaSnapshot(cachePath) {
    const target = cachePath ?? getTuiQuotaCachePath();
    recentTuiQuotaWrites.delete(target);
    try {
        await fs.unlink(target);
    }
    catch (error) {
        if (error?.code === "ENOENT")
            return;
        throw error;
    }
}
function isCreditsBalance(value) {
    return (isRecord(value) &&
        typeof value.hasCredits === "boolean" &&
        typeof value.unlimited === "boolean" &&
        (value.balance === null ||
            (typeof value.balance === "number" && Number.isFinite(value.balance) && value.balance >= 0)));
}
function isTuiQuotaOverviewAccount(value) {
    return (isRecord(value) &&
        typeof value.fingerprint === "string" &&
        value.fingerprint.trim().length > 0 &&
        typeof value.index === "number" &&
        Number.isFinite(value.index) &&
        (value.email === undefined || typeof value.email === "string") &&
        (value.label === undefined || typeof value.label === "string") &&
        (value.planType === undefined || typeof value.planType === "string") &&
        isOptionalFiniteNumber(value.resetCredits) &&
        (value.resetCreditsApplicable === undefined || value.resetCreditsApplicable === null ||
            (typeof value.resetCreditsApplicable === "number" && Number.isInteger(value.resetCreditsApplicable) && value.resetCreditsApplicable >= 0)) &&
        (value.credits === undefined || isCreditsBalance(value.credits)) &&
        Array.isArray(value.limits) &&
        value.limits.every(isTuiQuotaLimit) &&
        isOptionalFiniteNumber(value.fetchedAt) &&
        isOptionalFiniteNumber(value.readFailedAt) &&
        isOptionalFiniteNumber(value.readFailedSince) &&
        (value.readError === undefined || typeof value.readError === "string"));
}
export function isTuiQuotaOverviewSnapshot(value) {
    return (isRecord(value) &&
        value.version === TUI_QUOTA_CACHE_VERSION &&
        typeof value.fetchedAt === "number" &&
        Number.isFinite(value.fetchedAt) &&
        Array.isArray(value.accounts) &&
        value.accounts.every(isTuiQuotaOverviewAccount));
}
/** Drop disabled windows, for the reasons in {@link sanitizeTuiQuotaSnapshot}. */
export function sanitizeTuiQuotaOverviewSnapshot(snapshot) {
    return {
        ...snapshot,
        accounts: snapshot.accounts.map((account) => ({
            ...account,
            limits: account.limits.filter((limit) => !isDisabledQuotaLimit(limit)),
        })),
    };
}
export async function readTuiQuotaOverviewSnapshot(cachePath) {
    try {
        const raw = await fs.readFile(cachePath ?? getTuiQuotaOverviewCachePath(), "utf-8");
        const parsed = JSON.parse(raw);
        return isTuiQuotaOverviewSnapshot(parsed)
            ? sanitizeTuiQuotaOverviewSnapshot(parsed)
            : undefined;
    }
    catch {
        return undefined;
    }
}
export async function writeTuiQuotaOverviewSnapshot(snapshot, cachePath) {
    const target = cachePath ?? getTuiQuotaOverviewCachePath();
    const temporary = createTemporaryPath(target, Date.now());
    try {
        await writeSnapshotFile(target, temporary, snapshot);
    }
    catch (error) {
        await fs.unlink(temporary).catch(() => undefined);
        throw error;
    }
}
//# sourceMappingURL=tui-quota-cache.js.map