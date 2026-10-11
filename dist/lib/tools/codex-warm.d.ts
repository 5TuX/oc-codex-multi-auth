/**
 * `codex-warm` tool — prime every account's usage window (issue #182).
 *
 * Sends one lightweight authenticated request to each enabled account so its
 * rolling usage window starts immediately, instead of only when rotation
 * eventually lands on it. This lets users "send a hi to each account" at the
 * start of a session to stagger the ~5h quota windows.
 *
 * The decision/iteration logic lives in the pure {@link warmAccounts}
 * orchestrator; this tool supplies the real network adapter (`warmOne`) by
 * composing proven primitives:
 *   1. ensureCodexUsageAccessToken — refresh the OAuth token if near expiry
 *   2. resolveCodexUsageAccountId   — derive the chatgpt-account-id
 *   3. warmAccountWindow            — send a minimal billable POST /codex/responses
 *      that actually starts the rolling usage window
 *
 * A read-only GET /wham/usage does NOT open the window (it only reports
 * server-side windows that already exist), so warming must send a genuine
 * inference request. The warm ping is deliberately tiny (reasoning effort
 * "none", verbosity "low", no stored conversation) to keep the quota cost
 * negligible.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import { type AccountMetadataV3, type AccountStorageV3 } from "../storage.js";
import { type WarmRecoveryObservation } from "../accounts/warm-recovery.js";
import { type WarmOutcome } from "../accounts/warm.js";
import type { ToolContext } from "./index.js";
/**
 * Build the real per-account warm function. Exported for testing so the
 * adapter can be exercised against injected fakes without a live network.
 */
export declare function createWarmOne(storage: AccountStorageV3, succeeded?: WarmRecoveryObservation[]): (account: AccountMetadataV3) => Promise<WarmOutcome>;
export declare function createCodexWarmTool(ctx: ToolContext): ToolDefinition;
