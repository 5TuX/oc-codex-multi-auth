/**
 * `codex-metrics` tool — runtime request metrics.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexMetricsTool(ctx: ToolContext): ToolDefinition;
