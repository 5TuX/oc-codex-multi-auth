/**
 * `codex-enable` tool — re-enable a disabled Codex account.
 *
 * Headless counterpart of the auth menu's "Enable account" action (#288):
 * clears the plugin's auto-disable attribution note and any auth-failure
 * cooldown inside the storage transaction, then reloads the account manager
 * so rotation sees the change.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexEnableTool(ctx: ToolContext): ToolDefinition;
