import type { ManagedAccount, AccountManager } from "./accounts.js";
import type { ModelFamily } from "./prompts/codex.js";
export interface ProbeCandidate {
    account: ManagedAccount;
    controller: AbortController;
}
export interface ProbeResult<T> {
    type: "success" | "failure";
    account: ManagedAccount;
    response?: T;
    error?: Error;
}
export interface ParallelProbeOptions {
    maxConcurrency: number;
    timeoutMs: number;
}
/**
 * Get top N candidates ranked by hybrid score WITHOUT mutating AccountManager state.
 * Uses getAccountsSnapshot() and ranks by health + tokens + freshness.
 */
export declare function getTopCandidates(accountManager: AccountManager, modelFamily: ModelFamily, model: string | null, maxCandidates: number): ManagedAccount[];
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
export declare function probeAccountsInParallel<T>(candidates: ProbeCandidate[], probeFn: (account: ManagedAccount, signal: AbortSignal) => Promise<T>, options?: Partial<ParallelProbeOptions>): Promise<ProbeResult<T> | null>;
export declare function createProbeCandidates(accounts: ManagedAccount[]): ProbeCandidate[];
