import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { lock } from "proper-lockfile";
import { writeFileAtomic } from "./storage/atomic-write.js";
import { logDebug, logWarn } from "./logger.js";
export function getQuotaNotificationStatePath(activeProjectStoragePath) {
    return join(dirname(activeProjectStoragePath), "oc-codex-multi-auth-quota-notifications.json");
}
function parseWindowState(value) {
    if (typeof value !== "object" || value === null)
        return undefined;
    const record = value;
    const lastPercent = record.lastPercent;
    if (lastPercent !== undefined &&
        (typeof lastPercent !== "number" ||
            !Number.isFinite(lastPercent) ||
            lastPercent < 0 ||
            lastPercent > 100)) {
        return undefined;
    }
    // Older files may carry an `activeThreshold` key. It is ignored rather than
    // rejected so an upgrade does not discard a usable state file.
    return { lastPercent };
}
function parseState(value) {
    if (typeof value !== "object" || value === null)
        return undefined;
    const record = value;
    const fiveHour = parseWindowState(record.fiveHour);
    const weekly = parseWindowState(record.weekly);
    const lastDeliveredAt = record.lastDeliveredAt;
    if (!fiveHour || !weekly || typeof record.updatedAt !== "number" || !Number.isFinite(record.updatedAt)) {
        return undefined;
    }
    if (lastDeliveredAt !== undefined &&
        (typeof lastDeliveredAt !== "number" || !Number.isFinite(lastDeliveredAt) || lastDeliveredAt < 0)) {
        return undefined;
    }
    return { fiveHour, weekly, lastDeliveredAt, updatedAt: record.updatedAt };
}
export async function readQuotaNotificationState(statePath) {
    try {
        return parseState(JSON.parse(await fs.readFile(statePath, "utf-8")));
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            logWarn(`Failed to read quota notification state from ${statePath}: ${error.message}`);
        }
        return undefined;
    }
}
async function writeState(statePath, state) {
    // Temp file + fsync + Windows-aware rename + parent-dir fsync — the same
    // durability contract every other storage write follows, so a crash cannot
    // resurrect a stale notification state or leave a torn file behind.
    await writeFileAtomic(statePath, JSON.stringify(state, null, 2));
}
export async function updateQuotaNotificationState(statePath, update) {
    await fs.mkdir(dirname(statePath), { recursive: true, mode: 0o700 });
    let compromised;
    const release = await lock(statePath, {
        realpath: false,
        stale: 10_000,
        update: 2_000,
        retries: {
            retries: 5,
            factor: 1.5,
            minTimeout: 50,
            maxTimeout: 500,
            randomize: true,
        },
        onCompromised: (error) => {
            compromised = error;
            logDebug(`Quota notification state lock compromised: ${error.message}`);
        },
    });
    try {
        const next = await update(await readQuotaNotificationState(statePath));
        if (compromised)
            throw compromised;
        await writeState(statePath, next.state);
        return next.result;
    }
    finally {
        await release().catch((error) => {
            logDebug(`Failed to release quota notification state lock: ${error.message}`);
        });
    }
}
//# sourceMappingURL=quota-notification-state.js.map