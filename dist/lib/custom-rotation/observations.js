import { createHash } from "node:crypto";
import { getUsageAccountDedupeKey, mapUsageWindow } from "../codex-usage.js";
import { extractAccountUserId } from "../auth/token-utils.js";
import { parseCodexQuotaWindows } from "../quota-windows.js";
export function rotationAccountId(account, scope) {
    return createHash("sha256").update(JSON.stringify([scope, getUsageAccountDedupeKey(account)])).digest("hex");
}
function observationScope(account) {
    return account.accountUserId || extractAccountUserId(account.accessToken) ? "seat" : "unknown";
}
export function unknownObservation() {
    return { value: null, status: "unknown", observedAt: null, expiresAt: null, source: null, scope: "unknown" };
}
function emptyWindow() {
    return { usedPercent: unknownObservation(), resetAtMs: unknownObservation(), windowMinutes: unknownObservation() };
}
export function emptyRotationAccount(id, lastUsed = 0) {
    return { id, lastUsed, plan: unknownObservation(), primary: emptyWindow(), secondary: emptyWindow(), credits: unknownObservation(), resetCredits: unknownObservation() };
}
function fresh(field, now) {
    return field.status === "fresh" && field.expiresAt !== null && now >= field.expiresAt
        ? { ...field, status: "stale" } : field;
}
function freshWindow(window, now) {
    return { usedPercent: fresh(window.usedPercent, now), resetAtMs: fresh(window.resetAtMs, now), windowMinutes: fresh(window.windowMinutes, now) };
}
export class RotationObservations {
    accounts = new Map();
    snapshot(account, scope, now) {
        const id = rotationAccountId(account, scope);
        const data = this.accounts.get(id) ?? emptyRotationAccount(id);
        return { ...data, lastUsed: account.lastUsed ?? 0, plan: fresh(data.plan, now), primary: freshWindow(data.primary, now), secondary: freshWindow(data.secondary, now), credits: fresh(data.credits, now), resetCredits: fresh(data.resetCredits, now) };
    }
    field(previous, value, meta) {
        if (previous.observedAt !== null && previous.observedAt > meta.now)
            return previous;
        if (value === undefined && !meta.disabled)
            return previous;
        return { value: meta.disabled ? null : value ?? null, status: meta.disabled ? "not-applicable" : "fresh", observedAt: meta.now, expiresAt: meta.now + meta.ttl, source: meta.source, scope: meta.scope };
    }
    window(previous, value, meta) {
        const fields = { ...meta, ttl: 300_000, disabled: value.windowMinutes === 0 };
        return { usedPercent: this.field(previous.usedPercent, value.usedPercent, fields), resetAtMs: this.field(previous.resetAtMs, value.resetAtMs, fields), windowMinutes: this.field(previous.windowMinutes, value.windowMinutes, fields) };
    }
    usage(account, scope, payload, now) {
        const data = this.snapshot(account, scope, now);
        const meta = { now, ttl: 300_000, source: "usage", scope: observationScope(account) };
        this.accounts.set(data.id, {
            ...data,
            plan: this.field(data.plan, payload.plan_type, meta),
            primary: this.window(data.primary, mapUsageWindow(payload.rate_limit?.primary_window), meta),
            secondary: this.window(data.secondary, mapUsageWindow(payload.rate_limit?.secondary_window), meta),
            credits: this.field(data.credits, payload.credits ? { balance: typeof payload.credits.balance === "string" ? payload.credits.balance : null, unlimited: payload.credits.unlimited === true } : undefined, meta),
        });
    }
    headers(account, scope, headers, now) {
        let data = this.snapshot(account, scope, now);
        for (const window of parseCodexQuotaWindows(headers, now)) {
            const key = window.kind;
            data = { ...data, [key]: this.window(data[key], window, { now, source: "headers", scope: observationScope(account) }) };
        }
        this.accounts.set(data.id, data);
    }
    resets(account, scope, count, now) {
        const data = this.snapshot(account, scope, now);
        this.accounts.set(data.id, { ...data, resetCredits: this.field(data.resetCredits, count, { now, ttl: 1_800_000, source: "reset-list", scope: observationScope(account) }) });
    }
    retain(ids) {
        for (const id of this.accounts.keys())
            if (!ids.has(id))
                this.accounts.delete(id);
    }
    clear() { this.accounts.clear(); }
}
//# sourceMappingURL=observations.js.map