/**
 * Typed error hierarchy for the Codex plugin.
 *
 * Single source of truth for all domain error classes. `CodexError` plays the
 * role of `BaseError`: every subclass inherits `code: string`, `cause?: unknown`,
 * optional `context`, stack capture, and a stable `name`.
 *
 * Consolidated error surface:
 * - `StorageError` moved here from `lib/storage/errors.ts` (that path stays as
 *   a thin re-export so existing imports keep working).
 * - `CircuitOpenError` moved here from `lib/circuit-breaker.ts` (same re-export
 *   compatibility pattern).
 * - New domain classes added: `RecoveryError`, `PromptError`, `RequestError`,
 *   `ConfigError` — used by the throw-site port.
 *
 * All ad-hoc `throw new Error(...)` sites in `lib/**` should throw one of the
 * classes in this file so callers can switch on `err.code` or `instanceof`
 * instead of parsing message strings.
 */
/**
 * Error codes for categorizing errors.
 *
 * These are the default codes attached to each domain class when no explicit
 * `code` is passed. Sub-codes (e.g. `LOAD_FAILED`, `PARSE_JSON_FAILED`) flow
 * through the `options.code` field and remain free-form strings.
 */
export declare const ErrorCode: {
    readonly NETWORK_ERROR: "CODEX_NETWORK_ERROR";
    readonly API_ERROR: "CODEX_API_ERROR";
    readonly AUTH_ERROR: "CODEX_AUTH_ERROR";
    readonly VALIDATION_ERROR: "CODEX_VALIDATION_ERROR";
    readonly RATE_LIMIT: "CODEX_RATE_LIMIT";
    readonly TIMEOUT: "CODEX_TIMEOUT";
    readonly STORAGE_ERROR: "CODEX_STORAGE_ERROR";
    readonly CIRCUIT_OPEN: "CODEX_CIRCUIT_OPEN";
    readonly RECOVERY_ERROR: "CODEX_RECOVERY_ERROR";
    readonly PROMPT_ERROR: "CODEX_PROMPT_ERROR";
    readonly REQUEST_ERROR: "CODEX_REQUEST_ERROR";
    readonly CONFIG_ERROR: "CODEX_CONFIG_ERROR";
    readonly CONFIG_LOCK_CONTENTION: "CODEX_CONFIG_LOCK_CONTENTION";
    readonly STORAGE_TRANSACTION_CONTENTION: "CODEX_STORAGE_TRANSACTION_CONTENTION";
};
export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
/**
 * Options for creating a CodexError.
 */
export interface CodexErrorOptions {
    code?: string;
    cause?: unknown;
    context?: Record<string, unknown>;
}
/**
 * Base error class for all Codex plugin errors.
 * Supports error chaining via `cause` and arbitrary context data.
 */
export declare class CodexError extends Error {
    readonly name: string;
    readonly code: string;
    readonly context?: Record<string, unknown>;
    constructor(message: string, options?: CodexErrorOptions);
}
/**
 * Options for creating a CodexApiError.
 */
export interface CodexApiErrorOptions extends CodexErrorOptions {
    status: number;
    headers?: Record<string, string>;
}
/**
 * Error for HTTP/API response errors.
 */
export declare class CodexApiError extends CodexError {
    readonly name = "CodexApiError";
    readonly status: number;
    readonly headers?: Record<string, string>;
    constructor(message: string, options: CodexApiErrorOptions);
}
/**
 * Options for creating a CodexAuthError.
 */
export interface CodexAuthErrorOptions extends CodexErrorOptions {
    accountId?: string;
    retryable?: boolean;
    /**
     * The underlying token-refresh failure reason, if known. Lets callers
     * distinguish transient failures (network_error / 5xx http_error) from
     * genuine auth invalidation (4xx http_error / missing_refresh) so a flaky
     * network or upstream outage does not count toward permanent account removal.
     */
    refreshFailureReason?: string;
    /** HTTP status code from the refresh attempt, when reason is http_error. */
    statusCode?: number;
}
/**
 * Error for authentication failures.
 */
export declare class CodexAuthError extends CodexError {
    readonly name = "CodexAuthError";
    readonly accountId?: string;
    readonly retryable: boolean;
    readonly refreshFailureReason?: string;
    readonly statusCode?: number;
    constructor(message: string, options?: CodexAuthErrorOptions);
}
/**
 * Options for creating a CodexNetworkError.
 */
export interface CodexNetworkErrorOptions extends CodexErrorOptions {
    retryable?: boolean;
}
/**
 * Error for network/connection failures.
 *
 * Wired into real throw sites via `lib/prompts/codex.ts` (prompt fetch
 * transport failures) — kept distinct from {@link CodexApiError} (an HTTP
 * response that arrived) so callers can tell "no response" from "bad response".
 */
export declare class CodexNetworkError extends CodexError {
    readonly name = "CodexNetworkError";
    readonly retryable: boolean;
    constructor(message: string, options?: CodexNetworkErrorOptions);
}
/**
 * Options for creating a CodexTimeoutError.
 */
export interface CodexTimeoutErrorOptions extends CodexErrorOptions {
    /** The timeout budget that elapsed, in milliseconds, when known. */
    timeoutMs?: number;
    /** Timeouts are transient by default; pass false for a hard deadline. */
    retryable?: boolean;
}
/**
 * Error for deadline-elapsed failures.
 *
 * Wired into real throw sites: `createUsageRequestTimeoutError` in
 * `error-sentinels.ts` (the usage-probe sentinel consumed by the orchestrator)
 * and the prompt-fetch timeout helpers in `lib/prompts/`.
 */
export declare class CodexTimeoutError extends CodexError {
    readonly name = "CodexTimeoutError";
    readonly timeoutMs?: number;
    readonly retryable: boolean;
    constructor(message: string, options?: CodexTimeoutErrorOptions);
}
/**
 * Options for creating a CodexValidationError.
 */
export interface CodexValidationErrorOptions extends CodexErrorOptions {
    field?: string;
    expected?: string;
}
/**
 * Error for input validation failures.
 */
export declare class CodexValidationError extends CodexError {
    readonly name = "CodexValidationError";
    readonly field?: string;
    readonly expected?: string;
    constructor(message: string, options?: CodexValidationErrorOptions);
}
/**
 * Options for creating a CodexRateLimitError.
 */
export interface CodexRateLimitErrorOptions extends CodexErrorOptions {
    retryAfterMs?: number;
    accountId?: string;
}
/**
 * Error for rate limit exceeded.
 */
export declare class CodexRateLimitError extends CodexError {
    readonly name = "CodexRateLimitError";
    readonly retryAfterMs?: number;
    readonly accountId?: string;
    constructor(message: string, options?: CodexRateLimitErrorOptions);
}
/**
 * Error for storage/persistence failures.
 *
 * Positional constructor kept for backward compatibility with existing call
 * sites and test assertions (the class was previously defined in
 * `lib/storage/errors.ts` with this exact signature).
 *
 * The `hint` is folded into `.message` because most error surfaces render only
 * `err.message` — a bare "Failed to write file" with the remediation stranded
 * in `.hint` leaves users without the one piece of text that tells them what
 * to do. `hint` remains a structured field for callers that format it
 * separately; they should render `hint` OR `message`, not both.
 */
export declare class StorageError extends CodexError {
    readonly name = "StorageError";
    readonly path: string;
    readonly hint: string;
    constructor(message: string, code: string, path: string, hint: string, cause?: Error);
}
/**
 * Options carried by {@link CircuitOpenError} when raised from the request
 * pipeline so callers can classify the short-circuit without parsing the
 * message string.
 */
export interface CircuitOpenErrorOptions {
    /** The breaker key that denied the call, e.g. `account:modelFamily`. */
    breakerKey?: string;
    /** Snapshot of the breaker state at denial time (`open` | `half-open`). */
    state?: "open" | "half-open";
    /** Machine-readable denial reason from `CanAttemptResult`. */
    reason?: "open" | "probe-in-flight";
}
/**
 * Error thrown when a circuit breaker is open (or half-open past its attempt
 * budget) and further calls must short-circuit instead of hitting the
 * protected dependency.
 *
 * When constructed from the request pipeline's gate check, {@link breakerKey},
 * {@link state}, and {@link reason} carry the metadata needed by the rotation
 * path to pick a different account/family without re-querying the breaker.
 */
export declare class CircuitOpenError extends CodexError {
    readonly name = "CircuitOpenError";
    readonly breakerKey?: string;
    readonly state?: "open" | "half-open";
    readonly reason?: "open" | "probe-in-flight";
    constructor(message?: string, options?: CircuitOpenErrorOptions);
}
/**
 * Error for session recovery failures (conversation state persistence, id
 * validation, part/message storage integrity).
 */
export declare class RecoveryError extends CodexError {
    readonly name = "RecoveryError";
    constructor(message: string, options?: CodexErrorOptions);
}
/**
 * Error for prompt template fetching or cache failures (GitHub ETag cache,
 * release tag resolution, upstream prompt source fetches).
 */
export declare class PromptError extends CodexError {
    readonly name = "PromptError";
    constructor(message: string, options?: CodexErrorOptions);
}
/**
 * Error for request/response pipeline failures that are not auth, network,
 * or rate-limit related (SSE stream shape, missing body, size limits).
 */
export declare class RequestError extends CodexError {
    readonly name = "RequestError";
    constructor(message: string, options?: CodexErrorOptions);
}
/**
 * Error for configuration/environment failures (missing TTY, malformed CLI
 * input, bad format flags, missing required options).
 */
export declare class ConfigError extends CodexError {
    readonly name: string;
    constructor(message: string, options?: CodexErrorOptions);
}
/**
 * Another process currently holds the plugin configuration lock.
 *
 * Deliberately NOT a {@link ConfigError}: that class means "the user's
 * configuration is wrong" (missing TTY, malformed CLI input, bad format flags),
 * and any handler catching it to print "fix your configuration" and stop
 * retrying would give exactly the wrong advice for a condition that resolves on
 * its own. It sits with the transient family instead and carries `retryable`
 * the same way {@link CodexNetworkError} does.
 */
export declare class ConfigLockContentionError extends CodexError {
    readonly name = "ConfigLockContentionError";
    readonly path: string;
    readonly retryable = true;
    constructor(path: string, cause?: unknown);
}
export declare class StorageTransactionContentionError extends CodexError {
    readonly name = "StorageTransactionContentionError";
    readonly path: string;
    readonly retryable = true;
    constructor(path: string, cause?: unknown);
}
