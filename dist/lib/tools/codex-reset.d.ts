/**
 * `codex-reset` tool — view and redeem banked Codex rate-limit reset credits.
 *
 * Closes the gap for users who cannot reach OpenAI's redemption UI (desktop
 * app / IDE extensions / Codex CLI `/usage`): the credits are granted per
 * account, and this plugin already holds the credentials needed to spend them.
 *
 * Redeeming is irreversible and spends a finite credit, so `action="consume"`
 * only issues the POST when `confirm` is `true`. A tool call has no interactive
 * y/N prompt, so confirmation is an explicit argument instead — an unconfirmed
 * consume renders the same preview a dry run does and changes nothing.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export declare function createCodexResetTool(ctx: ToolContext): ToolDefinition;
