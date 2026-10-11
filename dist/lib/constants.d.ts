/**
 * Constants used throughout the plugin
 * Centralized for easy maintenance and configuration
 */
/** Published package identifier used across runtime messages and install flows */
export declare const PACKAGE_NAME = "oc-codex-multi-auth";
/** Previous published package identifier kept for installer and storage migration */
export declare const LEGACY_PACKAGE_NAME = "oc-chatgpt-multi-auth";
/** Plugin identifier for logging and error messages */
export declare const PLUGIN_NAME = "oc-codex-multi-auth";
/** Storage file names for active and legacy account data */
export declare const ACCOUNTS_FILE_NAME = "oc-codex-multi-auth-accounts.json";
export declare const LEGACY_ACCOUNTS_FILE_NAME = "openai-codex-accounts.json";
export declare const FLAGGED_ACCOUNTS_FILE_NAME = "oc-codex-multi-auth-flagged-accounts.json";
export declare const LEGACY_FLAGGED_ACCOUNTS_FILE_NAME = "openai-codex-flagged-accounts.json";
export declare const LEGACY_BLOCKED_ACCOUNTS_FILE_NAME = "openai-codex-blocked-accounts.json";
/** Base URL for ChatGPT backend API */
export declare const CODEX_BASE_URL = "https://chatgpt.com/backend-api";
/** Dummy API key used for OpenAI SDK (actual auth via OAuth) */
export declare const DUMMY_API_KEY = "chatgpt-oauth";
/** Provider ID for UI display - shows under "OpenAI" in auth dropdown */
export declare const PROVIDER_ID = "openai";
/** HTTP Status Codes */
export declare const HTTP_STATUS: {
    readonly BAD_REQUEST: 400;
    readonly OK: 200;
    readonly FORBIDDEN: 403;
    readonly UNAUTHORIZED: 401;
    readonly NOT_FOUND: 404;
    readonly TOO_MANY_REQUESTS: 429;
};
/** OpenAI-specific headers */
export declare const OPENAI_HEADERS: {
    readonly BETA: "OpenAI-Beta";
    readonly ACCOUNT_ID: "chatgpt-account-id";
    readonly ORGANIZATION_ID: "openai-organization";
    readonly ORIGINATOR: "originator";
    readonly SESSION_ID: "session_id";
    readonly CONVERSATION_ID: "conversation_id";
};
/** OpenAI-specific header values */
export declare const OPENAI_HEADER_VALUES: {
    readonly BETA_RESPONSES: "responses=experimental";
    readonly ORIGINATOR_CODEX: "codex_cli_rs";
};
/** URL path segments */
export declare const URL_PATHS: {
    readonly RESPONSES: "/responses";
    readonly CODEX_RESPONSES: "/codex/responses";
};
/** JWT claim path for ChatGPT account ID */
export declare const JWT_CLAIM_PATH: "https://api.openai.com/auth";
/** JWT claim path carrying the signed-in user's email; present on access tokens. */
export declare const JWT_PROFILE_CLAIM_PATH: "https://api.openai.com/profile";
/** Error messages */
export declare const ERROR_MESSAGES: {
    readonly NO_ACCOUNT_ID: "Failed to extract accountId from token";
    readonly TOKEN_REFRESH_FAILED: "Failed to refresh token, authentication required";
    readonly REQUEST_PARSE_ERROR: "Error parsing request";
};
/** Log stages for request logging */
export declare const LOG_STAGES: {
    readonly BEFORE_TRANSFORM: "before-transform";
    readonly AFTER_TRANSFORM: "after-transform";
    readonly RESPONSE: "response";
    readonly ERROR_RESPONSE: "error-response";
};
/** Platform-specific browser opener commands */
export declare const PLATFORM_OPENERS: {
    readonly darwin: "open";
    readonly win32: "start";
    readonly linux: "xdg-open";
};
/** OAuth authorization labels */
export declare const AUTH_LABELS: {
    readonly OAUTH: "Codex OAuth (ChatGPT Plus/Pro)";
    readonly OAUTH_MANUAL_BROWSER: "Codex OAuth (Open URL Manually)";
    readonly OAUTH_DEVICE_CODE: "Codex OAuth (Device Code)";
    readonly OAUTH_MANUAL: "Codex OAuth (Manual URL Paste)";
    readonly API_KEY: "Manual API Key (Advanced)";
    readonly INSTRUCTIONS_MANUAL_BROWSER: "Open this URL in any browser to sign in; sign-in completes automatically through the localhost callback on port 1455.";
    readonly INSTRUCTIONS_MANUAL: "After logging in, copy the full redirect URL and paste it here. It carries the state parameter that ties the code to this login attempt.";
};
/** Multi-account configuration */
export declare const ACCOUNT_LIMITS: {
    /** Maximum number of OAuth accounts that can be registered */
    readonly MAX_ACCOUNTS: 20;
    /** Cooldown period (ms) after auth failure before retrying account */
    readonly AUTH_FAILURE_COOLDOWN_MS: 30000;
    /** Number of consecutive auth failures before auto-removing account */
    readonly MAX_AUTH_FAILURES_BEFORE_REMOVAL: 3;
};
/**
 * Cap on quota-exhausted model hops within one request (index.ts).
 *
 * The attempted set already stops a request revisiting a model; this bounds
 * total hops even under a cyclic custom chain. It must be at least the longest
 * DEFAULT_UNSUPPORTED_CODEX_FALLBACK_CHAIN row (gpt-6-astra's, 7 targets), or a
 * request whose models are blocked one after another stops before reaching the
 * tail of its own default chain. A hop only happens onto a model some account
 * can serve right now, so a larger cap costs nothing when nothing is usable.
 * Kept here rather than in fetch-helpers because test/index.test.ts replaces
 * that module with a factory mock, which would read a new export as undefined.
 */
export declare const MAX_QUOTA_FALLBACK_SWITCHES = 7;
