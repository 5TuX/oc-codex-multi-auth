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
export const ErrorCode = {
    NETWORK_ERROR: "CODEX_NETWORK_ERROR",
    API_ERROR: "CODEX_API_ERROR",
    AUTH_ERROR: "CODEX_AUTH_ERROR",
    VALIDATION_ERROR: "CODEX_VALIDATION_ERROR",
    RATE_LIMIT: "CODEX_RATE_LIMIT",
    TIMEOUT: "CODEX_TIMEOUT",
    STORAGE_ERROR: "CODEX_STORAGE_ERROR",
    CIRCUIT_OPEN: "CODEX_CIRCUIT_OPEN",
    RECOVERY_ERROR: "CODEX_RECOVERY_ERROR",
    PROMPT_ERROR: "CODEX_PROMPT_ERROR",
    REQUEST_ERROR: "CODEX_REQUEST_ERROR",
    CONFIG_ERROR: "CODEX_CONFIG_ERROR",
    CONFIG_LOCK_CONTENTION: "CODEX_CONFIG_LOCK_CONTENTION",
    STORAGE_TRANSACTION_CONTENTION: "CODEX_STORAGE_TRANSACTION_CONTENTION",
};
/**
 * Base error class for all Codex plugin errors.
 * Supports error chaining via `cause` and arbitrary context data.
 */
export class CodexError extends Error {
    name = "CodexError";
    code;
    context;
    constructor(message, options) {
        super(message, { cause: options?.cause });
        this.code = options?.code ?? ErrorCode.API_ERROR;
        this.context = options?.context;
        // istanbul ignore next -- Error.captureStackTrace always exists in Node.js
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Error for HTTP/API response errors.
 */
export class CodexApiError extends CodexError {
    name = "CodexApiError";
    status;
    headers;
    constructor(message, options) {
        super(message, { ...options, code: options.code ?? ErrorCode.API_ERROR });
        this.status = options.status;
        this.headers = options.headers;
    }
}
/**
 * Error for authentication failures.
 */
export class CodexAuthError extends CodexError {
    name = "CodexAuthError";
    accountId;
    retryable;
    refreshFailureReason;
    statusCode;
    constructor(message, options) {
        super(message, { ...options, code: options?.code ?? ErrorCode.AUTH_ERROR });
        this.accountId = options?.accountId;
        this.retryable = options?.retryable ?? false;
        this.refreshFailureReason = options?.refreshFailureReason;
        this.statusCode = options?.statusCode;
    }
}
/**
 * Error for network/connection failures.
 *
 * Wired into real throw sites via `lib/prompts/codex.ts` (prompt fetch
 * transport failures) — kept distinct from {@link CodexApiError} (an HTTP
 * response that arrived) so callers can tell "no response" from "bad response".
 */
export class CodexNetworkError extends CodexError {
    name = "CodexNetworkError";
    retryable;
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.NETWORK_ERROR,
        });
        this.retryable = options?.retryable ?? true;
    }
}
/**
 * Error for deadline-elapsed failures.
 *
 * Wired into real throw sites: `createUsageRequestTimeoutError` in
 * `error-sentinels.ts` (the usage-probe sentinel consumed by the orchestrator)
 * and the prompt-fetch timeout helpers in `lib/prompts/`.
 */
export class CodexTimeoutError extends CodexError {
    name = "CodexTimeoutError";
    timeoutMs;
    retryable;
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.TIMEOUT,
        });
        this.timeoutMs = options?.timeoutMs;
        this.retryable = options?.retryable ?? true;
    }
}
/**
 * Error for input validation failures.
 */
export class CodexValidationError extends CodexError {
    name = "CodexValidationError";
    field;
    expected;
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.VALIDATION_ERROR,
        });
        this.field = options?.field;
        this.expected = options?.expected;
    }
}
/**
 * Error for rate limit exceeded.
 */
export class CodexRateLimitError extends CodexError {
    name = "CodexRateLimitError";
    retryAfterMs;
    accountId;
    constructor(message, options) {
        super(message, { ...options, code: options?.code ?? ErrorCode.RATE_LIMIT });
        this.retryAfterMs = options?.retryAfterMs;
        this.accountId = options?.accountId;
    }
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
export class StorageError extends CodexError {
    name = "StorageError";
    path;
    hint;
    constructor(message, code, path, hint, cause) {
        super(hint ? `${message} (hint: ${hint})` : message, { code, cause });
        this.path = path;
        this.hint = hint;
    }
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
export class CircuitOpenError extends CodexError {
    name = "CircuitOpenError";
    breakerKey;
    state;
    reason;
    constructor(message = "Circuit is open", options) {
        super(message, { code: ErrorCode.CIRCUIT_OPEN });
        this.breakerKey = options?.breakerKey;
        this.state = options?.state;
        this.reason = options?.reason;
    }
}
/**
 * Error for session recovery failures (conversation state persistence, id
 * validation, part/message storage integrity).
 */
export class RecoveryError extends CodexError {
    name = "RecoveryError";
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.RECOVERY_ERROR,
        });
    }
}
/**
 * Error for prompt template fetching or cache failures (GitHub ETag cache,
 * release tag resolution, upstream prompt source fetches).
 */
export class PromptError extends CodexError {
    name = "PromptError";
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.PROMPT_ERROR,
        });
    }
}
/**
 * Error for request/response pipeline failures that are not auth, network,
 * or rate-limit related (SSE stream shape, missing body, size limits).
 */
export class RequestError extends CodexError {
    name = "RequestError";
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.REQUEST_ERROR,
        });
    }
}
/**
 * Error for configuration/environment failures (missing TTY, malformed CLI
 * input, bad format flags, missing required options).
 */
export class ConfigError extends CodexError {
    name = "ConfigError";
    constructor(message, options) {
        super(message, {
            ...options,
            code: options?.code ?? ErrorCode.CONFIG_ERROR,
        });
    }
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
export class ConfigLockContentionError extends CodexError {
    name = "ConfigLockContentionError";
    path;
    retryable = true;
    constructor(path, cause) {
        super(`Plugin configuration at ${path} is locked by another process.`, {
            code: ErrorCode.CONFIG_LOCK_CONTENTION,
            cause,
            context: { path },
        });
        this.path = path;
    }
}
export class StorageTransactionContentionError extends CodexError {
    name = "StorageTransactionContentionError";
    path;
    retryable = true;
    constructor(path, cause) {
        super(`Account storage transaction at ${path} is locked by another process.`, {
            code: ErrorCode.STORAGE_TRANSACTION_CONTENTION,
            cause,
            context: { path },
        });
        this.path = path;
    }
}
//# sourceMappingURL=errors.js.map