/**
 * OpenAI ChatGPT (Codex) OAuth Authentication Plugin for opencode
 *
 * COMPLIANCE NOTICE:
 * This plugin uses OpenAI's official OAuth authentication flow (the same method
 * used by OpenAI's official Codex CLI at https://github.com/openai/codex).
 *
 * INTENDED USE: Personal development and coding assistance with your own
 * ChatGPT Plus/Pro subscription.
 *
 * NOT INTENDED FOR: Commercial resale, multi-user services, high-volume
 * automated extraction, or any use that violates OpenAI's Terms of Service.
 *
 * Users are responsible for ensuring their usage complies with:
 * - OpenAI Terms of Use: https://openai.com/policies/terms-of-use/
 * - OpenAI Usage Policies: https://openai.com/policies/usage-policies/
 *
 * For production applications, use the OpenAI Platform API: https://platform.openai.com/
 *
 * @license MIT (see LICENSE file)
 * @author ndycode
 * @repository https://github.com/ndycode/oc-codex-multi-auth

 */
import type { Plugin } from "@opencode-ai/plugin";
/**
 * OpenAI Codex OAuth authentication plugin for opencode
 *
 * This plugin enables opencode to use OpenAI's Codex backend via ChatGPT Plus/Pro
 * OAuth authentication, allowing users to leverage their ChatGPT subscription
 * instead of OpenAI Platform API credits.
 *
 * @example
 * ```json
 * {
 *   "plugin": ["oc-codex-multi-auth"],

 *   "model": "openai/gpt-5-codex"
 * }
 * ```
 */
export declare const OpenAIOAuthPlugin: Plugin;
export declare const OpenAIAuthPlugin: Plugin;
declare const _default: {
    id: string;
    server: Plugin;
    /** V2 loads the same package through setup instead of the V1 server hook. */
    setup(context: import("@opencode/plugin").Plugin.Context): Promise<() => Promise<void>>;
};
export default _default;
