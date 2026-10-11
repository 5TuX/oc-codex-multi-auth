/**
 * Account "warm-up" orchestrator (issue #182).
 *
 * Sends one minimal request to each enabled account so its rolling usage
 * window (the ~5h ChatGPT/Codex quota window) starts ticking immediately,
 * rather than only when the rotation eventually lands on that account. This
 * lets users prime every account at the start of a session ("send a hi to each
 * account") instead of waiting for the current account to run dry.
 *
 * This module is intentionally pure: it contains the iteration, outcome
 * classification, and summary logic, but performs no network or auth I/O
 * itself. The real upstream call is injected as `warmOne`, which keeps this
 * logic fully deterministic and unit-testable, and keeps the network-touching
 * adapter isolated in the `codex-warm` tool. The split mirrors how
 * `lib/rotation.ts` (pure selection) is separated from `lib/accounts/rotation.ts`
 * (the manager-facing wrapper).
 */
/**
 * Decide whether an account should be warmed at all.
 * Disabled accounts are skipped; everything else is attempted.
 */
function shouldSkip(account) {
    return account.enabled === false;
}
/**
 * Warm every account in `accounts` by invoking `warmOne` on each one that is
 * eligible, then summarize the outcomes.
 *
 * `warmOne` must resolve (never reject) — but to be defensive against an
 * injected function that throws or rejects, any thrown error is captured and
 * recorded as a `failed` outcome so a single bad account can never abort the
 * whole batch.
 *
 * The returned `results` array preserves the input order regardless of
 * concurrency, so display output is deterministic.
 */
export async function warmAccounts(accounts, warmOne, options = {}) {
    const concurrent = options.concurrent ?? true;
    const runOne = async (account, index) => {
        if (shouldSkip(account)) {
            return { account, index, status: "skipped", detail: "disabled" };
        }
        try {
            const outcome = await warmOne(account, index);
            return { account, index, status: outcome.status, detail: outcome.detail };
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            return { account, index, status: "failed", detail };
        }
    };
    let results;
    if (concurrent) {
        results = await Promise.all(accounts.map((account, index) => runOne(account, index)));
    }
    else {
        results = [];
        for (let index = 0; index < accounts.length; index++) {
            // Non-null: index is bounded by accounts.length.
            const account = accounts[index];
            results.push(await runOne(account, index));
        }
    }
    // Preserve input order even though Promise.all already does; explicit for
    // safety against future refactors to the concurrent branch.
    results.sort((a, b) => a.index - b.index);
    let warmedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    for (const result of results) {
        if (result.status === "warmed")
            warmedCount++;
        else if (result.status === "failed")
            failedCount++;
        else
            skippedCount++;
    }
    return {
        results,
        warmedCount,
        failedCount,
        skippedCount,
        total: results.length,
    };
}
//# sourceMappingURL=warm.js.map