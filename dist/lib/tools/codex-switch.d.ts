/**
 * `codex-switch` tool — switch active Codex account by index or picker.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexSwitchTool(ctx: ToolContext): ToolDefinition;
