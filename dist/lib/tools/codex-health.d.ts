/**
 * `codex-health` tool — verify refresh tokens for all accounts.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexHealthTool(ctx: ToolContext): ToolDefinition;
