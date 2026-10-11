/**
 * `codex-export` tool — export accounts to JSON file.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexExportTool(ctx: ToolContext): ToolDefinition;
