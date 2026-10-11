/**
 * Shared parser for the per-window quota headers the Codex backend puts on
 * every response (`x-codex-primary-*` = the rolling ~5h window,
 * `x-codex-secondary-*` = the weekly window).
 *
 * These headers were previously only read for the TUI status line
 * (`lib/tui-quota-cache.ts`), so the rotation layer had no idea an account had
 * spent its weekly quota until the backend 429'd — and even then it could not
 * tell *which* window was spent. Issue #218: an account at 0% weekly was picked
 * again on every prompt, failed, and rotated away, forever.
 *
 * This module is deliberately a leaf (no imports): both the request path and
 * the TUI cache depend on it, and it must not drag either into the other.
 */
export type CodexQuotaWindowKind = "primary" | "secondary";
export interface CodexQuotaWindow {
    kind: CodexQuotaWindowKind;
    /** 0-100. Values >= 100 mean the window is spent. */
    usedPercent?: number;
    /** Window length in minutes. An explicit `0` means "disabled for this plan". */
    windowMinutes?: number;
    /** Absolute reset time in ms since epoch. */
    resetAtMs?: number;
}
export declare const CODEX_QUOTA_WINDOW_KINDS: readonly CodexQuotaWindowKind[];
export declare const CODEX_QUOTA_HEADER_PREFIXES: Record<CodexQuotaWindowKind, string>;
/**
 * The furthest ahead a reset time can be and still be believable.
 *
 * The longest window Codex has is the weekly one, so anything past a month is
 * not a quota reset — it is a garbled header, a wrong-unit value, or a gateway
 * inventing a number. Believing it is not a small error: the reset is written
 * into the persisted `rateLimitResetTimes` map through a deliberately monotonic
 * writer, so a single bogus header takes the account out of rotation for as
 * long as it claims (measured: `-reset-after-seconds: 4000000000` = 127 years)
 * and nothing in the product can shorten it again.
 */
export declare const MAX_QUOTA_RESET_HORIZON_MS: number;
/**
 * Resolve a window's absolute reset time.
 *
 * `-reset-after-seconds` is preferred over `-reset-at` because it is immune to
 * clock skew between this host and the backend. `-reset-at` is accepted both as
 * an epoch stamp (seconds or milliseconds) and as an ISO-8601 date string.
 *
 * Every branch returns through {@link withinResetHorizon}: this is the one
 * choke point all three header forms pass through, so bounding it here is what
 * keeps an implausible value out of both the durable rotation block and the
 * retry-after delay derived from the same headers.
 */
export declare function parseQuotaResetAtMs(headers: Headers, prefix: string, now?: number): number | undefined;
export declare function hasCodexQuotaHeaders(headers: Headers): boolean;
export declare function parseCodexQuotaWindow(headers: Headers, kind: CodexQuotaWindowKind, now?: number): CodexQuotaWindow;
/**
 * Parse every quota window the response describes. Windows with no headers at
 * all are omitted, so an empty array means the backend reported no quota state.
 */
export declare function parseCodexQuotaWindows(headers: Headers, now?: number): CodexQuotaWindow[];
/**
 * A window reported with `window-minutes: 0` is switched off for the plan, not
 * a window of unknown length. It still reports a used-percent, so it has to be
 * rejected on the explicit zero rather than on missing data.
 */
export declare function isQuotaWindowDisabled(window: Pick<CodexQuotaWindow, "windowMinutes">): boolean;
export declare function isQuotaWindowExhausted(window: Pick<CodexQuotaWindow, "windowMinutes" | "usedPercent">): boolean;
/**
 * The instant at which every spent window has reset, or `undefined` when no
 * window is spent (or the backend gave no usable reset time).
 *
 * The *latest* reset wins, not the soonest: an account whose weekly window is
 * gone stays unusable even after its 5h window rolls over, so collapsing the
 * two with `Math.min` is what let issue #218's account back into rotation every
 * five hours.
 */
export declare function getQuotaExhaustedResetAtMs(headers: Headers, now?: number): number | undefined;
