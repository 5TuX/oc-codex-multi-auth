/**
 * Clear the memory cache - exposed for testing
 * @internal
 */
export declare function __clearCacheForTesting(): void;
/**
 * Model family type for prompt selection
 * Maps to different system prompts in the Codex CLI
 */
export type ModelFamily = "gpt-5-codex" | "codex-max" | "codex" | "gpt-6-astra" | "gpt-6.1-sol" | "gpt-6-sol" | "gpt-6-luna" | "gpt-daybreak-blue" | "gpt-daybreak-red" | "gpt-5.6-cyber" | "gpt-5.6-sol" | "gpt-5.6-terra" | "gpt-5.6-luna" | "gpt-5.4" | "gpt-5.4-mini" | "gpt-5.4-pro" | "gpt-5.2" | "gpt-5.1";
/**
 * All supported model families
 * Used for per-family account rotation and rate limit tracking
 */
export declare const MODEL_FAMILIES: readonly ModelFamily[];
/**
 * Pull one model's base instructions out of a raw models.json payload.
 *
 * openai/codex #43604 (2026-09-07) dropped `base_instructions` from every
 * bundled catalog entry; the text now lives in
 * `model_messages.instructions_template`. rust-v0.155.1 carries only the
 * template for all nine of its models, so reading `base_instructions` alone
 * served the legacy prompt file to every catalog model. The template is rendered the
 * way Codex renders it with personality disabled
 * (codex-rs/models-manager/src/model_info.rs): the placeholder takes
 * `personality_default`, which is "" for every entry that carries one.
 * `base_instructions` still wins when present, for tags that predate the move.
 *
 * @returns The instructions, or null when the tag predates the slug.
 */
export declare function extractCatalogInstructions(rawCatalog: string, slug: string): string | null;
export declare function getBackendInstructionIdentityLine(normalizedModel: string): string;
export declare function ensureInstructionIdentity(instructions: string | undefined, normalizedModel: string): string;
/**
 * Determine the model family based on the normalized model name
 * @param normalizedModel - The normalized model name (e.g., "gpt-5-codex", "gpt-5.1-codex-max", "gpt-5.2", "gpt-5.1")
 * @returns The model family for prompt selection
 */
export declare function getModelFamily(normalizedModel: string): ModelFamily;
/**
 * Fetch Codex instructions from GitHub with ETag-based caching
 * Uses HTTP conditional requests to efficiently check for updates
 * Always fetches from the latest release tag, not main branch
 *
 * Rate limit protection: Only checks GitHub if cache is older than 15 minutes
 *
 * @param normalizedModel - The normalized model name (optional, defaults to "gpt-5-codex")
 * @returns Codex instructions for the specified model family
 */
export declare function getCodexInstructions(normalizedModel?: string): Promise<string>;
/**
 * Prewarm instruction caches for the provided models/families.
 */
export declare function prewarmCodexInstructions(models?: string[]): void;
/**
 * Tool remapping instructions for opencode tools
 */
export declare const TOOL_REMAP_MESSAGE = "<user_instructions priority=\"0\">\n<environment_override priority=\"0\">\nYOU ARE IN A DIFFERENT ENVIRONMENT. These instructions override ALL previous tool references.\n</environment_override>\n\n<tool_replacements priority=\"0\">\n<critical_rule priority=\"0\">\nPatch-edit tool names differ by runtime (for example: apply_patch, patch, edit).\n- Always use the exact tool names listed in the active tool schema/manifest\n- If the schema exposes apply_patch, call apply_patch directly\n- If the schema exposes patch/edit instead, use patch/edit as listed\n- Never invent aliases or auto-translate tool names\n</critical_rule>\n\n<critical_rule priority=\"0\">\n\u274C UPDATE_PLAN DOES NOT EXIST \u2192 \u2705 USE \"todowrite\" INSTEAD\n- NEVER use: update_plan, updatePlan\n- ALWAYS use: todowrite for ALL task/plan operations\n- Use todoread to read current plan\n- Before plan operations: Verify you're using \"todowrite\", NOT \"update_plan\"\n</critical_rule>\n</tool_replacements>\n\n<available_tools priority=\"0\">\nNote: This list is illustrative. Always defer to the active tool schema/manifest.\nFile Operations:\n  \u2022 write  - Create new files\n  \u2022 edit   - Modify existing files with string replacement\n  \u2022 patch  - Apply diff patches\n  \u2022 apply_patch - Apply diff patches (alternate runtime name; use whichever the schema exposes)\n  \u2022 read   - Read file contents\n\nSearch/Discovery:\n  \u2022 grep   - Search file contents\n  \u2022 glob   - Find files by pattern\n  \u2022 list   - List directories\n\nExecution:\n  \u2022 bash   - Run shell commands\n\nNetwork:\n  \u2022 webfetch - Fetch web content\n\nTask Management:\n  \u2022 todowrite - Manage tasks/plans (REPLACES update_plan)\n  \u2022 todoread  - Read current plan\n</available_tools>\n\n<tool_call_guardrails priority=\"0\">\n- Call only tool names listed in the active tool schema.\n- Do not invent wrapper namespaces (for example functions.task or multi_tool_use.parallel) unless explicitly listed.\n- Follow each tool's required path format instead of forcing absolute or relative paths globally.\n</tool_call_guardrails>\n\n<substitution_rules priority=\"0\">\nBase instruction says:    Correct behaviour:\napply_patch/patch      \u2192   use the exact tool name from the active schema (no renaming)\nupdate_plan           \u2192   todowrite\nread_plan             \u2192   todoread\n</substitution_rules>\n\n<verification_checklist priority=\"0\">\nBefore file/plan modifications:\n1. Am I using the exact patch/edit (including apply_patch when exposed) tool name listed by the active schema?\n2. Am I using \"todowrite\" NOT \"update_plan\"?\n3. Is this tool in the approved list above?\n4. Am I following the active tool schema (including path format)?\n\nIf ANY answer is NO \u2192 STOP and correct before proceeding.\n</verification_checklist>\n\n<safety_rules priority=\"0\">\n- Never run destructive git commands (`git reset --hard`, `git checkout --`) unless explicitly requested by the user.\n- Never call `request_user_input` unless collaboration mode is explicitly Plan mode.\n</safety_rules>\n</user_instructions>";
