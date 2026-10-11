export interface ToolFunction {
    name: string;
    description?: string;
    parameters?: {
        type: "object";
        properties?: Record<string, unknown>;
        required?: string[];
        [key: string]: unknown;
    };
}
export interface Tool {
    type: "function";
    function: ToolFunction;
}
/**
 * Cleans up tool definitions to ensure strict JSON Schema compliance.
 *
 * Implements "require" logic and advanced normalization:
 * 1. Filters 'required' array to remove properties that don't exist in 'properties'.
 * 2. Injects a placeholder property for empty parameter objects.
 * 3. Flattens 'anyOf' with 'const' values into 'enum'.
 * 4. Normalizes nullable types (array types) to single type + description.
 * 5. Removes unsupported keywords (additionalProperties, const, etc.).
 *
 * @param tools - Array of tool definitions
 * @returns Cleaned array of tool definitions
 */
export declare function cleanupToolDefinitions(tools: unknown): unknown;
/**
 * Ensures every function tool carries an explicit `strict: false`.
 *
 * Why: OpenCode's AI SDK adapter omits `strict` when serializing function
 * tools for the Responses API, and the backend treats an omitted flag as
 * strict mode — making every schema property effectively required. Models
 * then fabricate values for optional parameters (notably `sessionID` on
 * OpenCode's `subagent` tool), which breaks fresh subagent creation with
 * "Session <parent-session-id> is not a child of the current session".
 * Codex CLI hardcodes `strict: false` on every function tool for the same
 * reason (codex-rs/tools/src/responses_api.rs).
 *
 * Handles both wire shapes:
 * - Responses API:    { type: "function", name, parameters, strict }
 * - Chat Completions: { type: "function", function: { name, parameters, strict } }
 *
 * Explicitly set `strict` values are preserved.
 *
 * @param tools - Array of tool definitions
 * @returns The same array, with `strict: false` filled in where missing
 */
export declare function ensureFunctionToolStrictFalse(tools: unknown): unknown;
