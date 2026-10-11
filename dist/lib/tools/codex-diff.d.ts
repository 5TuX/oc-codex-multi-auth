import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
export interface CodexDiffEntry {
    /**
     * Dot-separated JSON path of the leaf value, e.g.
     * `accounts[0].refreshToken` or `schemaVersion`.
     */
    path: string;
    kind: "added" | "removed" | "changed";
    /** Redacted string representation of the left-hand value. */
    leftValue?: string;
    /** Redacted string representation of the right-hand value. */
    rightValue?: string;
}
export interface CodexDiffResult {
    leftPath: string;
    rightPath: string;
    section: "accounts" | "config" | "both";
    entries: CodexDiffEntry[];
    summary: {
        added: number;
        removed: number;
        changed: number;
    };
    redactionApplied: true;
    generatedAt: string;
}
export interface CodexDiffError {
    /** Stable failure discriminator shared with the tool error envelope. */
    ok: false;
    /** Registered tool id that produced the error. */
    tool: "codex-diff";
    error: "cannot-read" | "invalid-json";
    side: "left" | "right";
    path: string;
    message: string;
    redactionApplied: true;
    generatedAt: string;
}
/**
 * Compute a structural diff between two parsed JSON values.
 *
 * Entries are sorted alphabetically by `path` so the output is stable
 * regardless of object key order in the source files.
 */
export declare function computeCodexDiff(left: unknown, right: unknown): CodexDiffEntry[];
export declare function createCodexDiffTool(_ctx: ToolContext): ToolDefinition;
