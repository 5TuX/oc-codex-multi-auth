/**
 * `codex-diag` tool — redacted diagnostic snapshot for bug reports.
 *
 * Returns a single JSON document describing runtime state (plugin version,
 * Node, platform, account count, circuit-breaker aggregates, metrics
 * summary, log-directory presence) with aggressive redaction applied:
 *
 * - No account IDs, emails, labels, or refresh/access/id tokens leak.
 * - Home-directory paths are replaced with `<HOME>` so shared bug reports
 *   do not reveal the reporter's username.
 * - The final JSON string is passed through `maskString` as a defence in
 *   depth against any caller-accidental token substring in the payload.
 *
 * Redaction depth is asserted in `test/tools-codex-diag.test.ts`.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexDiagTool(ctx: ToolContext): ToolDefinition;
