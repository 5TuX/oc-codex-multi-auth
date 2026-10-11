import type { ToolDefinition } from "@opencode-ai/plugin/tool";
import { CodexError } from "../errors.js";
import type { PluginOrigin } from "../plugin-origin.js";
/**
 * The machine-readable failure payload emitted by `format:"json"` tool calls.
 */
export interface CodexToolErrorEnvelope {
    /** Stable failure discriminator for tool consumers. */
    ok: false;
    /** Registered tool id that produced the error. */
    tool: string;
    /** Machine-readable error code (a `CodexError.code` when available). */
    error: string;
    /** Masked, single-line, truncated copy of the underlying message. */
    message: string;
    /** True when the failure is transient and the call may be retried. */
    retryable: boolean;
    /** Operator-facing hint (from `StorageError.hint` or retryable defaults). */
    nextAction: string | null;
    /** Relevant filesystem path with the home directory redacted, if any. */
    path: string | null;
}
/**
 * Replaces occurrences of the user's home directory in free-form strings with
 * the placeholder `<HOME>` — the same redaction `codex-diag` applies. Both
 * POSIX- and Windows-style separators are covered so the replacement matches
 * regardless of how the path was embedded.
 *
 * In addition to the literal `homedir()`, generic `/home/<name>`,
 * `/Users/<name>`, and `X:\Users\<name>` prefixes are collapsed to `<HOME>`:
 * paths carried inside upstream errors or plugin-origin strings can point at
 * a *different* home (tests run under an isolated `HOME`, and a checkout can
 * live under another user's directory), and the username is the sensitive
 * part either way.
 */
export declare function redactHomePaths(input: string): string;
/**
 * Removes C0/C1/DEL control characters while keeping tab and newline —
 * enough to keep free-form `label`/`tags`/`note` text from smuggling terminal
 * escape sequences into rendered output without mangling ordinary whitespace.
 */
export declare function stripControlCharacters(input: string): string;
/**
 * Masks credential-shaped substrings, redacts embedded home paths, collapses
 * embedded newlines, and truncates to `limit` — the standard treatment for
 * upstream error bodies and `StorageError` text before it reaches tool output.
 * Home redaction runs inside the sanitizer (not only on the envelope's `path`
 * field) because messages like storage-contention errors interpolate the
 * account-file path inline.
 */
export declare function sanitizeToolErrorMessage(message: string, limit?: number): string;
/**
 * Returns a copy of a resolved plugin origin with `root` home-path redacted so
 * `pluginOrigin` stays safe to emit inside JSON tool payloads.
 */
export declare function redactPluginOrigin(origin: PluginOrigin | null): (PluginOrigin & {
    root: string;
}) | null;
/**
 * Builds the stable `{ ok:false, tool, error, message, retryable, nextAction,
 * path }` payload. Messages are masked + truncated; `StorageError.hint`
 * surfaces as `nextAction`; retryable errors get a retry suggestion when no
 * more specific hint exists.
 */
export declare function buildToolErrorEnvelope(toolId: string, error: unknown): CodexToolErrorEnvelope;
/**
 * Enriches a thrown error's message with `StorageError.hint` and a retry note
 * for transient failures — the text-mode counterpart of the JSON envelope.
 * Returns the original error unchanged when there is nothing to add, so call
 * sites can rethrow the returned value without checking identity.
 */
export declare function enrichThrownError(error: unknown): unknown;
/**
 * Rethrows `error` when it is a transient (retryable) `CodexError` such as
 * `StorageTransactionContentionError` or `ConfigLockContentionError`, and
 * returns otherwise.
 *
 * Persistence handlers inside `withAccountStorageTransaction` callbacks use
 * this before downgrading a `persist()` failure to an outcome value: a
 * compromised transaction lease surfaces through `persist()`, and folding it
 * into a "failed to persist" string would hide the retryable signal the
 * wrapper is meant to expose.
 */
export declare function rethrowIfRetryable(error: unknown): void;
/**
 * Builds the error a text-mode tool throws to report a failed action: the
 * action label ("Import failed") plus the masked/truncated cause, a `Hint:`
 * line for `StorageError`s, and a retry note for transient failures.
 */
export declare function toToolCallError(actionLabel: string, error: unknown): CodexError;
export interface ToolErrorEnvelopeOptions {
    /** Emit the JSON envelope even when the tool declares no `format` arg. */
    alwaysJson?: boolean;
}
/**
 * Wraps a built tool definition so thrown errors land on a contract-stable
 * shape: the JSON envelope when the caller requested `format:"json"` (or
 * `options.alwaysJson` for always-JSON tools like `codex-diag`), otherwise an
 * enriched error is rethrown so host-side display keeps `StorageError.hint`
 * and retryable guidance. Returned values pass through untouched.
 */
export declare function withToolErrorEnvelope(toolId: string, definition: ToolDefinition, options?: ToolErrorEnvelopeOptions): ToolDefinition;
