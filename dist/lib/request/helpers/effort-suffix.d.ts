/**
 * Reasoning-effort alias suffixes, shared by every model-id parser.
 *
 * `max` needs a negative lookbehind: `gpt-5.1-codex-max` is a model id that
 * happens to end in `-max`, not a Codex request at `max` effort. The lookbehind
 * is scoped to the `max` alternative only — `gpt-5-codex-low` must still parse
 * `low`, so it cannot guard the whole group.
 */
export declare const EFFORT_SUFFIXES: readonly ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"];
export type EffortSuffix = (typeof EFFORT_SUFFIXES)[number];
/**
 * Extract the reasoning-effort suffix from a model id, if present.
 *
 * @param modelId - Model id with the provider prefix already stripped
 * @returns The effort suffix (lowercased), or undefined when the id carries none
 */
export declare function getEffortSuffix(modelId: string): EffortSuffix | undefined;
/**
 * Remove the trailing reasoning-effort suffix from a model id.
 *
 * @param modelId - Model id with the provider prefix already stripped
 * @returns The model id without its effort suffix
 */
export declare function stripEffortSuffix(modelId: string): string;
