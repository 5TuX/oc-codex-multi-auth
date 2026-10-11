/**
 * `codex-limits` tool — show Codex usage limits per account.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
/**
 * Build the `codex-limits` tool.
 *
 * The tool fetches and renders Codex usage quotas for each unique account.
 * Accounts are deduplicated by workspace identity via
 * {@link getUsageAccountDedupeKey} so distinct workspaces are shown separately,
 * while the active-account marker is only applied when an account matches both
 * the active refresh token and the active workspace dedupe key.
 *
 * @param ctx - Shared {@link ToolContext} providing UI runtime and account helpers.
 * @returns The `codex-limits` {@link ToolDefinition}.
 */
export declare function createCodexLimitsTool(ctx: ToolContext): ToolDefinition;
