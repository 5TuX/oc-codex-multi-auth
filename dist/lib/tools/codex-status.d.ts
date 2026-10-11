/**
 * `codex-status` tool — detailed per-account status and rate limits.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexStatusTool(ctx: ToolContext): ToolDefinition;
