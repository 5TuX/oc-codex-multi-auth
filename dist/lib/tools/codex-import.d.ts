/**
 * `codex-import` tool — import accounts from JSON file.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexImportTool(ctx: ToolContext): ToolDefinition;
