/**
 * Helper functions for the custom fetch implementation
 * These functions break down the complex fetch logic into manageable, testable units
 */
import type { Auth, OpencodeClient } from "@opencode-ai/sdk";
import { type PersistedRefreshIdentity } from "../storage/coordinated-refresh.js";
import type { OAuthAuthDetails, UserConfig, RequestBody } from "../types.js";
export interface RateLimitInfo {
    retryAfterMs: number;
    code?: string;
}
export interface EntitlementError {
    isEntitlement: true;
    code: string;
    message: string;
}
/**
 * Build an AbortError for caller-cancellation during retry/backoff waits.
 *
 * The request retry loop (index.ts) awaits sleeps that watch the caller
 * AbortSignal. A bare `new Error("Aborted")` surfaced as an opaque, unnamed
 * error and dropped `signal.reason` (issue #176). This mirrors the fetch-path
 * behavior and the `isAbortError` convention in lib/codex-usage.ts: when the
 * signal carries an Error reason it is propagated as-is; otherwise a fresh
 * Error named "AbortError" is returned (carrying a string reason if present).
 */
export declare function createAbortError(signal?: AbortSignal | null): Error;
export declare const DEFAULT_UNSUPPORTED_CODEX_FALLBACK_CHAIN: Record<string, string[]>;
export interface UnsupportedCodexModelInfo {
    isUnsupported: boolean;
    code?: string;
    message?: string;
    unsupportedModel?: string;
}
export interface ResolveUnsupportedCodexFallbackOptions {
    requestedModel: string | undefined;
    errorBody: unknown;
    attemptedModels?: Iterable<string>;
    fallbackOnUnsupportedCodexModel: boolean;
    fallbackToGpt52OnUnsupportedGpt53: boolean;
    customChain?: Record<string, string[]>;
}
export declare function extractUnsupportedCodexModelFromText(bodyText: string): string | undefined;
export declare function getUnsupportedCodexModelInfo(errorBody: unknown): UnsupportedCodexModelInfo;
/**
 * Whether the default auto-fallback (the one that does NOT require
 * `unsupportedCodexPolicy: "fallback"`) currently applies to `currentModel`.
 *
 * Exported so a caller degrading for a reason OTHER than an entitlement 400 —
 * notably a fully quota-blocked pool — gates on exactly the same entry models
 * and opt-out env vars instead of inventing a second policy.
 */
export declare function isDefaultAutoFallbackModel(currentModel: string, attemptedModels?: Iterable<string>): boolean;
export interface PickFallbackChainTargetOptions {
    currentModel: string;
    attemptedModels?: Iterable<string>;
    customChain?: Record<string, string[]>;
    fallbackToGpt52OnUnsupportedGpt53?: boolean;
}
/**
 * Walk the fallback chain and return the next model worth trying.
 *
 * This is the single chain-walking policy: both the entitlement fallback and
 * the quota/rate-limit fallback go through it, so the two can never drift.
 * It decides only what comes NEXT in the chain — whether degrading is allowed
 * at all is the caller's gate.
 */
export declare function pickFallbackChainTarget(options: PickFallbackChainTargetOptions): string | undefined;
export declare function resolveUnsupportedCodexFallbackModel(options: ResolveUnsupportedCodexFallbackOptions): string | undefined;
/**
 * Returns true when the legacy `gpt-5.3-codex -> gpt-5.2-codex` edge is available.
 */
export declare function shouldFallbackToGpt52OnUnsupportedGpt53(requestedModel: string | undefined, errorBody: unknown): boolean;
/**
 * Checks if an error code indicates an entitlement/subscription issue
 * These errors should NOT be treated as rate limits because:
 * 1. They won't resolve by waiting
 * 2. They won't resolve by switching accounts (all accounts likely have same issue)
 * 3. User needs to upgrade their subscription
 */
export declare function isEntitlementError(code: string, bodyText: string): boolean;
/**
 * Creates a user-friendly entitlement error response
 */
export declare function createEntitlementErrorResponse(_bodyText: string): Response;
export interface ErrorHandlingResult {
    response: Response;
    rateLimit?: RateLimitInfo;
    errorBody?: unknown;
    retryAsServerError?: boolean;
    /**
     * Whether this response's `x-codex-*` quota headers describe the account's
     * real quota state. See {@link isQuotaHeaderAuthority}.
     */
    quotaHeadersAuthoritative?: boolean;
}
export interface ErrorHandlingOptions {
    requestCorrelationId?: string;
    threadId?: string;
}
export interface ErrorDiagnostics {
    requestId?: string;
    cfRay?: string;
    correlationId?: string;
    threadId?: string;
    httpStatus?: number;
}
/**
 * Detects the "authentication token invalidated" failure on the *request* path
 * (as opposed to the token-refresh path in {@link refreshAndUpdateToken}).
 *
 * The backend returns HTTP 401 with a body like
 * "Your authentication token has been invalidated. Please try signing in
 * again." When the access token presented for a request is rejected, the owning
 * account must be cooled down and the request rotated to the next healthy
 * account — otherwise persisted family routing keeps pinning every request to
 * the dead account slot (issue #171).
 *
 * Driven primarily by the HTTP 401 status; the structured code and message are
 * fallbacks for paths (probe/exception) that only carry an error string.
 */
export declare function isInvalidatedAuthTokenError(errorBody: unknown, status?: number): boolean;
export declare function isDeactivatedWorkspaceError(errorBody: unknown, status?: number): boolean;
/**
 * Determines if the current auth token needs to be refreshed
 * @param auth - Current authentication state
 * @param skewMs - Refresh this many ms before actual expiry (clamped to >= 0)
 * @returns True if token is expired, invalid, or expires within `skewMs`
 */
export declare function shouldRefreshToken(auth: Auth, skewMs?: number): boolean;
/**
 * Refreshes the OAuth token and updates stored credentials
 * @param currentAuth - Current auth state
 * @param client - Opencode client for updating stored credentials
 * @returns Updated auth (throws on failure)
 */
export declare function refreshAndUpdateToken(currentAuth: OAuthAuthDetails, client: OpencodeClient | undefined, identity?: Omit<PersistedRefreshIdentity, "refreshToken">): Promise<OAuthAuthDetails>;
/**
 * Extracts URL string from various request input types
 * @param input - Request input (string, URL, or Request object)
 * @returns URL string
 */
export declare function extractRequestUrl(input: Request | string | URL): string;
/**
 * Rewrites OpenAI API URLs to Codex backend URLs
 * @param url - Original URL
 * @returns Rewritten URL for Codex backend
 */
export declare function rewriteUrlForCodex(url: string): string;
/**
 * Transforms request body and logs the transformation
 * Fetches model-specific Codex instructions based on the request model
 *
 * @param init - Request init options
 * @param url - Request URL
 * @param userConfig - User configuration
 * @param codexMode - Enable CODEX_MODE (bridge prompt instead of tool remap)
 * @param parsedBody - Pre-parsed body to avoid double JSON.parse (optional)
 * @param options - Transform overrides: `requestTransformMode` (`native` | `legacy`),
 *   `fastSession`, `fastSessionStrategy`, and `fastSessionMaxInputItems`
 * @returns Transformed body and updated init, or undefined if no body
 */
export declare function transformRequestForCodex(init: RequestInit | undefined, url: string, userConfig: UserConfig, codexMode?: boolean, parsedBody?: Record<string, unknown>, options?: {
    requestTransformMode?: "native" | "legacy";
    fastSession?: boolean;
    fastSessionStrategy?: "hybrid" | "always";
    fastSessionMaxInputItems?: number;
}): Promise<{
    body: RequestBody;
    updatedInit: RequestInit;
} | undefined>;
/**
 * Creates headers for Codex API requests
 * @param init - Request init options
 * @param accountId - ChatGPT account ID
 * @param accessToken - OAuth access token
 * @param opts - Optional parameters including model, promptCacheKey, and organizationId
 * @returns Headers object with all required Codex headers
 */
export declare function createCodexHeaders(init: RequestInit | undefined, accountId: string, accessToken: string, opts?: {
    model?: string;
    promptCacheKey?: string;
    organizationId?: string;
}): Headers;
/**
 * Handles error responses from the Codex API
 * @param response - Error response from API
 * @param options - Diagnostic-extraction options used to enrich the error
 * @returns An `ErrorHandlingResult` bundling the (possibly remapped) response,
 *   parsed rate-limit info, and the decoded error body
 */
export declare function handleErrorResponse(response: Response, options?: ErrorHandlingOptions): Promise<ErrorHandlingResult>;
/**
 * Handles successful responses from the Codex API
 * Converts SSE to JSON for non-streaming requests (generateText)
 * Passes through SSE for streaming requests (streamText)
 * @param response - Success response from API
 * @param isStreaming - Whether this is a streaming request (stream=true in body)
 * @param options - Optional `streamStallTimeoutMs` (inter-chunk gap) and
 *   `maxStreamDurationMs` (total post-headers deadline) overrides
 * @returns Processed response (SSE→JSON for non-streaming, stream for streaming)
 */
export declare function handleSuccessResponse(response: Response, isStreaming: boolean, options?: {
    streamStallTimeoutMs?: number;
    maxStreamDurationMs?: number;
}): Promise<Response>;
