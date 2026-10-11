export type ClientIdentityMode = "codex" | "opencode";
export interface ClientIdentity {
    originator: string;
    userAgent: string;
}
export declare const OPENCODE_ORIGINATOR = "opencode";
/**
 * Last-resort version for the host UA product token. The live host version is
 * preferred whenever the runtime injects its own `opencode/<version>` UA on
 * the incoming request (self-syncing, no release-time bump needed); the
 * backend does not currently version-gate the `opencode` originator, so this
 * constant only has to look like a plausible host build. Override order:
 * CODEX_AUTH_HOST_VERSION > host-injected UA version > this constant.
 */
export declare const DEFAULT_OPENCODE_VERSION = "1.17.20";
/**
 * Mirrors opencode's own ChatGPT-Codex UA: `opencode/<v> (<platform>
 * <release>; <arch>)` with the raw `os.platform()` value (`win32`/`linux`/
 * `darwin`), exactly as the bundled host emits it.
 */
export declare function buildOpencodeUserAgent(hostUserAgent?: string): string;
/**
 * Resolve the identity to present for a request against `model`.
 *
 * Accepts raw selectors (`openai/gpt-5.6-sol-xhigh`) as well as canonical ids;
 * `undefined` (usage/reset endpoints) resolves to the Codex CLI identity.
 * `hostUserAgent` is the UA the host runtime put on the incoming request, if
 * any — used to keep the advertised opencode version in sync with the real
 * host build.
 */
export declare function resolveClientIdentity(model?: string, hostUserAgent?: string): ClientIdentity;
