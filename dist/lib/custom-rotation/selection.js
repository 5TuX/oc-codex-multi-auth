import { rotationAccountId } from "./observations.js";
import { runRotationPolicy } from "./runner.js";
import { logWarn } from "../logger.js";
export async function selectCustomAccount(host, request, policy) {
    const candidates = host.candidates(request);
    if (candidates.length === 0 || policy.signal?.aborted || policy.requestSignal?.aborted)
        return null;
    const now = Date.now();
    const current = host.current(request.family);
    const controller = new AbortController();
    const abort = () => controller.abort();
    const signals = [policy.signal, policy.requestSignal];
    for (const signal of signals)
        signal?.addEventListener("abort", abort, { once: true });
    const result = policy.module ? await runRotationPolicy(policy.module, {
        version: 1, now, model: request.model ?? null,
        currentAccountId: current ? rotationAccountId(current, policy.scope) : null,
        accounts: candidates.map((account) => policy.observations.snapshot(account, policy.scope, now)),
    }, { signal: controller.signal }).finally(() => {
        for (const signal of signals)
            signal?.removeEventListener("abort", abort);
    }) : { accountId: null, error: "module-path" };
    if (!policy.module)
        for (const signal of signals)
            signal?.removeEventListener("abort", abort);
    if (policy.signal?.aborted || policy.requestSignal?.aborted || (policy.currentScope && policy.currentScope() !== policy.scope))
        return null;
    const selected = candidates.find((account) => rotationAccountId(account, policy.scope) === result.accountId);
    if (selected) {
        const accepted = host.accept(selected, request);
        if (accepted)
            return accepted;
    }
    if (result.error || (result.accountId !== null && !selected)) {
        logWarn("Custom rotation policy fallback", { reason: result.error ?? "ineligible-id" });
    }
    // Recompute the preferred/general pool after the await; never use blocked hybrid fallback.
    const fallback = host.candidates(request)[0];
    return fallback ? host.accept(fallback, request) : null;
}
//# sourceMappingURL=selection.js.map