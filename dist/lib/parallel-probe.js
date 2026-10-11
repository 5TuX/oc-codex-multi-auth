import { createLogger } from "./logger.js";
import { getHealthTracker, getTokenTracker, } from "./rotation.js";
import { clearExpiredQuotaExhaustion, clearExpiredRateLimits, isQuotaExhausted, isRateLimitedForFamily } from "./accounts/rate-limits.js";
const log = createLogger("parallel-probe");
/**
 * Get top N candidates ranked by hybrid score WITHOUT mutating AccountManager state.
 * Uses getAccountsSnapshot() and ranks by health + tokens + freshness.
 */
export function getTopCandidates(accountManager, modelFamily, model, maxCandidates) {
    const accounts = accountManager.getAccountsSnapshot();
    if (accounts.length === 0)
        return [];
    const quotaKey = model ? `${modelFamily}:${model}` : modelFamily;
    const healthTracker = getHealthTracker();
    const tokenTracker = getTokenTracker();
    const accountsWithMetrics = [];
    for (const account of accounts) {
        clearExpiredRateLimits(account);
        clearExpiredQuotaExhaustion(account);
        const isDisabled = account.enabled === false;
        const isRateLimited = isRateLimitedForFamily(account, modelFamily, model);
        const isCoolingDown = account.coolingDownUntil !== undefined && account.coolingDownUntil > Date.now();
        const isQuotaBlocked = isQuotaExhausted(account);
        const isAvailable = !isDisabled && !isRateLimited && !isCoolingDown && !isQuotaBlocked;
        accountsWithMetrics.push({
            index: account.index,
            isAvailable,
            lastUsed: account.lastUsed,
            account,
        });
    }
    const available = accountsWithMetrics.filter((a) => a.isAvailable);
    if (available.length === 0)
        return [];
    const now = Date.now();
    const scored = available.map((a) => {
        const health = healthTracker.getScore(a.index, quotaKey);
        const tokens = tokenTracker.getTokens(a.index, quotaKey);
        const hoursSinceUsed = (now - a.lastUsed) / (1000 * 60 * 60);
        const score = health * 2 + tokens * 5 + hoursSinceUsed * 2.0;
        return { ...a, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxCandidates).map((s) => s.account);
}
/**
 * Probe accounts in parallel with first-success-wins racing.
 * Immediately aborts losing candidates when a winner is found.
 *
 * Each probe runs on its own AbortController linked to the candidate's
 * controller (winner-loser aborts flow through) and bounded by
 * `options.timeoutMs`: a hung probe rejects on timeout even if it ignores
 * the abort signal. `options.maxConcurrency` caps how many probes are in
 * flight — waiting candidates only launch when a slot frees, so the cap is
 * a real limit rather than a scheduling hint. A probe resolving to
 * `null`/`undefined` counts as a failure: an empty response must not win
 * the race and bypass the success gate downstream relies on.
 */
export async function probeAccountsInParallel(candidates, probeFn, options = {}) {
    // Sparse/malformed entries cannot race at all — a lone `undefined` in the
    // array used to skip the single-candidate guard and then reject the whole
    // probe through an unguarded destructure.
    const valid = candidates.filter((c) => !!c && !!c.account && !!c.controller);
    if (valid.length === 0) {
        return null;
    }
    const timeoutMs = typeof options.timeoutMs === "number" &&
        Number.isFinite(options.timeoutMs) &&
        options.timeoutMs > 0
        ? Math.floor(options.timeoutMs)
        : undefined;
    const runProbe = async (candidate) => {
        const probeController = new AbortController();
        const linkAbort = () => {
            probeController.abort(candidate.controller.signal.reason);
        };
        if (candidate.controller.signal.aborted) {
            linkAbort();
        }
        else {
            candidate.controller.signal.addEventListener("abort", linkAbort, {
                once: true,
            });
        }
        let timeoutId;
        let timeoutPromise;
        if (timeoutMs !== undefined) {
            const timeoutError = new Error(`Account probe timed out after ${timeoutMs}ms`);
            timeoutError.name = "ProbeTimeoutError";
            timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    // Abort first so a signal-respecting probe unwinds promptly;
                    // the rejection below bounds even a probe that ignores it.
                    probeController.abort(timeoutError);
                    reject(timeoutError);
                }, timeoutMs);
            });
            // Once this probe has settled nobody races the timer anymore —
            // swallow a late fire so it cannot surface unhandled.
            timeoutPromise.catch(() => { });
        }
        try {
            const probePromise = probeFn(candidate.account, probeController.signal);
            const response = await (timeoutPromise
                ? Promise.race([probePromise, timeoutPromise])
                : probePromise);
            if (response === null || response === undefined) {
                return {
                    ok: false,
                    error: new Error("Account probe returned an empty response"),
                };
            }
            return { ok: true, response };
        }
        catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
        finally {
            if (timeoutId !== undefined)
                clearTimeout(timeoutId);
            candidate.controller.signal.removeEventListener("abort", linkAbort);
        }
    };
    if (valid.length === 1) {
        const candidate = valid[0];
        if (!candidate)
            return null;
        const outcome = await runProbe(candidate);
        if (outcome.ok) {
            return {
                type: "success",
                account: candidate.account,
                response: outcome.response,
            };
        }
        return {
            type: "failure",
            account: candidate.account,
            error: outcome.error ?? new Error("Account probe failed"),
        };
    }
    log.debug(`Probing ${valid.length} accounts in parallel`);
    const rawConcurrency = options.maxConcurrency;
    const maxConcurrency = typeof rawConcurrency === "number" && Number.isFinite(rawConcurrency)
        ? Math.max(1, Math.floor(rawConcurrency))
        : valid.length;
    return new Promise((resolve) => {
        let settled = false;
        let launched = 0;
        let settledCount = 0;
        let nextIndex = 0;
        const finish = (result) => {
            if (settled)
                return;
            settled = true;
            resolve(result);
        };
        const launchNext = () => {
            while (!settled &&
                launched - settledCount < maxConcurrency &&
                nextIndex < valid.length) {
                const candidate = valid[nextIndex];
                if (!candidate)
                    break;
                nextIndex++;
                launched++;
                void runProbe(candidate).then((outcome) => {
                    settledCount++;
                    if (settled)
                        return;
                    if (outcome.ok) {
                        const winner = {
                            type: "success",
                            account: candidate.account,
                            response: outcome.response,
                        };
                        log.debug(`Parallel probe succeeded with account ${candidate.account.index + 1}`);
                        for (const c of valid) {
                            if (c !== candidate) {
                                c.controller.abort();
                            }
                        }
                        finish(winner);
                        return;
                    }
                    if (settledCount === valid.length) {
                        finish(null);
                        return;
                    }
                    launchNext();
                });
            }
        };
        launchNext();
    });
}
export function createProbeCandidates(accounts) {
    return accounts.map((account) => ({
        account,
        controller: new AbortController(),
    }));
}
//# sourceMappingURL=parallel-probe.js.map