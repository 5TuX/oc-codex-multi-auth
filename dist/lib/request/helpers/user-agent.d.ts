/**
 * Version advertised in the User-Agent product token. Tracks the highest
 * `minimal_client_version` in the upstream model catalog — `0.155.0` for
 * gpt-6-sol and gpt-6-luna (gpt-6.1-sol and gpt-6-astra gate at 0.153.0);
 * override with CODEX_AUTH_CLIENT_VERSION if the backend gate moves before a
 * plugin release does.
 */
export declare const DEFAULT_CODEX_CLIENT_VERSION = "0.155.0";
/**
 * Versions live in the UA product token (`name/version`), where a space would
 * split the token and break the backend's version parse. Keep only characters
 * that are safe in a product-token version; an empty result falls back to the
 * caller's default.
 */
export declare function sanitizeVersionToken(value: string): string;
export declare function buildCodexUserAgent(): string;
