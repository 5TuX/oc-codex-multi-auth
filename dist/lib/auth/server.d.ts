import type { OAuthServerInfo } from "../types.js";
/**
 * Start a small local HTTP server that waits for /auth/callback and returns the code.
 *
 * The public redirect URI uses localhost because that is what the Codex OAuth
 * client registration expects. Bind both concrete loopback interfaces so
 * Windows dual-stack localhost resolution can reach either 127.0.0.1 or ::1.
 *
 * @param options.state - OAuth state for callback validation
 * @returns Promise that resolves to server info
 */
export declare function startLocalOAuthServer({ state }: {
    state: string;
}): Promise<OAuthServerInfo>;
