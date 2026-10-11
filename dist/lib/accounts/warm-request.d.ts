/**
 * Real upstream "warm" request for issue #182.
 *
 * Sends a single minimal billable request to `POST /codex/responses` — the
 * same endpoint and request shape the live request path uses for its quota
 * probe — so the account's rolling usage window actually starts. A read-only
 * `GET /wham/usage` does NOT open the window (it only reports server-side
 * windows that already exist), so warming must send a genuine inference
 * request. The body is deliberately tiny (reasoning effort "none", verbosity
 * "low", no stored conversation) to keep the quota cost negligible, and mirrors
 * the proven quota-probe request shape used by the live request path.
 *
 * This module owns the network side-effect; the pure iteration/summary logic
 * lives in `warm.ts` and is injected this function via `codex-warm.ts`.
 */
import type { RequestBody } from "../types.js";
/**
 * Absolute ceiling on warm attempts, independent of the chain's shape.
 *
 * `warm.ts` fans out across every enabled account concurrently, so attempts
 * multiply by the account count. This bounds the batch even if the shared
 * chain later grows a long tail.
 */
export declare const WARM_ATTEMPT_HARD_CEILING = 7;
export interface WarmRequestParams {
    accountId: string;
    accessToken: string;
    organizationId: string | undefined;
    /** Override the timeout (tests). */
    timeoutMs?: number;
    /** Injectable fetch for tests; defaults to global fetch. */
    fetchImpl?: typeof fetch;
}
/**
 * Build the minimal warm-ping request body. Exported for tests so the exact
 * shape (stream/store/reasoning) stays pinned.
 *
 * Instruction resolution is best-effort: a warm ping only needs a valid request
 * that opens the usage window, not the full Codex system prompt. If
 * `getCodexInstructions` cannot resolve the prompt (offline, cache miss, or the
 * bundled file is unavailable in a standalone CLI run), we fall back to a
 * minimal instruction so warming never fails on prompt-file resolution.
 */
export declare function buildWarmRequestBody(model?: string): Promise<RequestBody>;
/**
 * Outcome of a warm request.
 * - `opened`: the request started/confirmed the usage window (2xx, or a 429
 *   whose reason is a transient token/concurrency limit — the window is ticking).
 * - `exhausted`: a 429 whose reason is quota/usage-limit — the account's window
 *   is already spent, so warming it is meaningless. Reported distinctly so the
 *   tool does not claim a quota-dead account was "warmed".
 */
export type WarmRequestStatus = "opened" | "exhausted";
export interface WarmRequestResult {
    status: WarmRequestStatus;
    detail?: string;
    rateLimited?: boolean;
    model?: string;
}
/**
 * Send a warm request to open the account's usage window.
 *
 * Resolves with `{ status: "opened" }` when the upstream started/confirmed the
 * window (2xx, or a non-quota 429 meaning the window is already active), or
 * `{ status: "exhausted" }` for a quota/usage-limit 429 (window already spent).
 * Any other non-2xx, or a network/timeout error, throws so the caller records
 * the account as failed.
 *
 * A 400 carrying `model_not_supported_with_chatgpt_account` is retried down the
 * shared unsupported-model fallback chain (bounded by
 * {@link getWarmMaxModelAttempts}) before the account is failed, mirroring the
 * live request path.
 */
export declare function warmAccountWindow(params: WarmRequestParams): Promise<WarmRequestResult>;
