/**
 * `codex-doctor` tool — beginner-friendly diagnostics with optional auto-fix.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexDoctorTool(ctx: ToolContext): ToolDefinition;
