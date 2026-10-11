import type { AuthorizationFlow, TokenResult, JWTPayload } from "../types.js";
export { SCOPE, REQUIRED_OAUTH_SCOPES, getMissingRequiredOAuthScopes, hasRequiredOAuthScopes, } from "./scopes.js";
export declare const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export declare const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
export declare const TOKEN_URL = "https://auth.openai.com/oauth/token";
export declare const REDIRECT_URI = "http://localhost:1455/auth/callback";
/**
 * Classification of manually pasted authorization input.
 *
 * `raw` means the value could not be read as a callback URL, query string, or
 * fragment, so it is returned byte for byte as an opaque authorization code and
 * never carries state. Every other source is structured callback input, where
 * `code` and `state` are exactly what the callback supplied.
 */
export type AuthorizationInputParseResult = {
    readonly source: "raw";
    readonly code: string | undefined;
    readonly state: undefined;
} | {
    readonly source: "url" | "query" | "fragment";
    readonly code: string | undefined;
    readonly state: string | undefined;
};
/**
 * Generate a random state value for OAuth flow
 * @returns Random hex string
 */
export declare function createState(): string;
/**
 * Parse the authorization code and state out of manually pasted input.
 *
 * Accepts a full callback URL (values in the query string, in the fragment, or
 * split across both), a callback URL pasted without its scheme, a bare query
 * string, a bare `#code=...&state=...` fragment, the `code#state` shorthand,
 * and an opaque authorization code on its own. Values are returned exactly as
 * pasted: the shorthand and raw paths never percent-encode or normalise them.
 *
 * @param input - User input (callback URL, query string, fragment, code#state, or a bare code)
 * @returns The parsed values and the `source` they were recognised from, where
 *   `source: "raw"` marks an opaque code that carries no callback state
 */
export declare function parseAuthorizationInput(input: string): AuthorizationInputParseResult;
/**
 * Exchange authorization code for access and refresh tokens
 * @param code - Authorization code from OAuth flow
 * @param verifier - PKCE verifier
 * @param redirectUri - OAuth redirect URI
 * @returns Token result
 */
export declare function exchangeAuthorizationCode(code: string, verifier: string, redirectUri?: string): Promise<TokenResult>;
/**
 * Decode a JWT token to extract payload
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export declare function decodeJWT(token: string): JWTPayload | null;
/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 * @returns Token result
 */
export declare function refreshAccessToken(refreshToken: string): Promise<TokenResult>;
export interface AuthorizationFlowOptions {
    /**
     * Force a fresh login screen instead of using cached browser session.
     * Use when adding multiple accounts to ensure different credentials.
     */
    forceNewLogin?: boolean;
}
/**
 * Create OAuth authorization flow
 * @param options - Optional configuration for the flow
 * @returns Authorization flow details
 */
export declare function createAuthorizationFlow(options?: AuthorizationFlowOptions): Promise<AuthorizationFlow>;
