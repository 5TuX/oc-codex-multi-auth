/**
 * `codex-dashboard` tool — live dashboard of accounts, retry, refresh queue.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexDashboardTool(ctx: ToolContext): ToolDefinition;
