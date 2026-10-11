/**
 * Model Configuration Map
 *
 * Maps model config IDs to their normalized API model names.
 * Only includes exact config IDs that OpenCode will pass to the plugin.
 */
export declare const GPT_55_MODEL_ID: "gpt-5.5";
export declare const GPT_56_SOL_MODEL_ID: "gpt-5.6-sol";
export declare const GPT_56_TERRA_MODEL_ID: "gpt-5.6-terra";
export declare const GPT_56_LUNA_MODEL_ID: "gpt-5.6-luna";
/** GPT-6 Astra, OpenAI's frontier model as of the 2026-09-03 launch. */
export declare const GPT_6_ASTRA_MODEL_ID: "gpt-6-astra";
/**
 * GPT-6 Sol and Luna, added to the Codex catalog on 2026-09-22
 * (openai/codex 49e95cc7). Sol is the "workhorse model for coding"; Luna is
 * the "fast and affordable model for easier tasks". The catalog makes them
 * the named `upgrade` target of every older general model: gpt-5.5,
 * gpt-5.6-sol, gpt-5.6-terra and retired gpt-5.4 -> gpt-6-sol, gpt-5.6-luna
 * and retired gpt-5.4-mini -> gpt-6-luna.
 */
export declare const GPT_6_SOL_MODEL_ID: "gpt-6-sol";
export declare const GPT_6_LUNA_MODEL_ID: "gpt-6-luna";
/**
 * GPT-6.1 Sol, "the latest workhorse model for coding and everyday work",
 * added to the Codex model catalog on 2026-09-29 (openai/codex b1e72963,
 * PR #49318) as the new default catalog model — priority 1, ahead of Astra.
 * The same day the openai-python (#3986, v3.21.0) and openai-node (#2836)
 * SDKs added `gpt-6.1-sol` to their ChatModel enums for Chat Completions
 * and Responses.
 *
 * Its catalog entry is `use_responses_lite: true`,
 * `tool_mode: "code_mode_only"`, `multi_agent_version: "v2"`, and it lists
 * every plan Astra does including the new `promax` tier. It is the only
 * shipping 6.1: GPT-6.1 Astra was cancelled on 2026-09-28 and never got a
 * model id. `minimal_client_version` is 0.153.0 and no released tag carries
 * the entry yet (rust-v0.159.0 predates the commit; it lands with the next
 * release), so catalog-sourced instructions fall back to the prompt file
 * until then.
 */
export declare const GPT_61_SOL_MODEL_ID: "gpt-6.1-sol";
/**
 * Daybreak cyber tiers, verified in the Codex model catalog
 * (openai/codex `codex-rs/models-manager/models.json`, rust-v0.153.0+):
 * `gpt-daybreak-blue-latest` (`model_specialty: cyber`, defensive) and
 * `gpt-daybreak-red-latest` (cyber-permissive, for authorized research).
 *
 * Both carry `visibility: "hide"`, so Codex does not list them in its model
 * picker. They are opt-in ids, never a default and never a fallback target.
 */
export declare const DAYBREAK_BLUE_MODEL_ID: "gpt-daybreak-blue-latest";
export declare const DAYBREAK_RED_MODEL_ID: "gpt-daybreak-red-latest";
/**
 * `gpt-5.6-cyber`, OpenAI's published alias for the purpose-trained security
 * models ("for approved defenders conducting advanced, authorized
 * vulnerability research, exploit validation, and security testing").
 *
 * Named for the 5.6 generation, not GPT-6, and Daybreak-gated like the two
 * `-latest` tiers. It has no entry in the Codex catalog under this slug — only
 * the Daybreak aliases it fronts do.
 */
export declare const GPT_56_CYBER_MODEL_ID: "gpt-5.6-cyber";
export declare const MODEL_MAP: Record<string, string>;
/**
 * Get normalized model name from config ID
 *
 * @param modelId - Model ID from config (e.g., "gpt-5.1-codex-low")
 * @returns Normalized model name (e.g., "gpt-5.1-codex") or undefined if not found
 */
export declare function getNormalizedModel(modelId: string): string | undefined;
/**
 * Check if a model ID is in the model map
 *
 * @param modelId - Model ID to check
 * @returns True if model is in the map
 */
export declare function isKnownModel(modelId: string): boolean;
