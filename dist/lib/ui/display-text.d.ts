/**
 * Display-column text helpers.
 *
 * Every width budget, truncation, and padding decision in the terminal UI goes
 * through this module so CJK, emoji (including ZWJ sequences), grapheme
 * clusters, and ANSI styling are measured in the columns a renderer actually
 * gives them — never in UTF-16 code units.
 */
/** Removes every ANSI/OSC escape sequence from `text`. */
export declare function stripAnsiSequences(text: string): string;
/** Removes only SGR styling sequences, leaving other content untouched. */
export declare function stripSgrSequences(text: string): string;
/**
 * Visible column width of `text`. ANSI escape sequences count as zero and
 * grapheme clusters are measured as a unit, so emoji ZWJ sequences, flags,
 * keycaps, and combining marks are never split or miscounted.
 */
export declare function displayWidth(text: string): number;
/**
 * Truncates `input` to at most `maxCols` display columns, appending `suffix`
 * when content is dropped. ANSI escape sequences are copied through verbatim
 * and never split; grapheme clusters are never split. When a truncated string
 * still carries open SGR styling a reset is appended so the suffix and any
 * following output are not styled accidentally.
 */
export declare function truncateToDisplayWidth(input: string, maxCols: number, suffix?: string): string;
/** Pads `text` on the right with spaces to `cols` display columns. */
export declare function padEndDisplay(text: string, cols: number): string;
/** Pads `text` on the left with spaces to `cols` display columns. */
export declare function padStartDisplay(text: string, cols: number): string;
export interface SanitizeDisplayTextOptions {
    /** Keep complete SGR styling sequences (`ESC [ … m`) in the output. */
    preserveSgr?: boolean;
    /** Maximum length of the sanitized output (characters, incl. SGR). */
    maxLength?: number;
}
/**
 * Renders untrusted text (account labels, emails, tags, notes, server-provided
 * names) safe for terminal interpolation:
 *
 *  - escape sequences are removed (optionally preserving SGR styling),
 *  - C0/C1 controls and DEL collapse to a space,
 *  - bidi controls and other invisible format characters are removed,
 *  - runs of whitespace collapse to single spaces and the result is trimmed,
 *  - the result is bounded to `maxLength` characters.
 *
 * Returns `undefined` for empty input so callers can keep `?? fallback`
 * semantics.
 */
export declare function sanitizeDisplayText(value: string | null | undefined, options?: SanitizeDisplayTextOptions): string | undefined;
/**
 * {@link sanitizeDisplayText} for multi-line values: each line is sanitized
 * separately so embedded newlines survive (the single-line variant would
 * collapse them to spaces). Returns `undefined` when nothing printable
 * remains.
 */
export declare function sanitizeDisplayBlock(value: string | null | undefined, options?: SanitizeDisplayTextOptions): string | undefined;
/**
 * Sanitizing convenience for required display fields — returns `"unknown"`
 * when the input sanitizes to nothing.
 */
export declare function sanitizeDisplayTextOrUnknown(value: string | null | undefined, options?: SanitizeDisplayTextOptions): string;
/** `HH:MM` on a 24-hour clock — identical output under every locale. */
export declare function formatClockTime(date: Date): string;
/** Short English weekday such as `Tue` — identical under every locale. */
export declare function formatShortWeekday(date: Date): string;
/** `Sep 05` — fixed English month abbreviation, zero-padded day. */
export declare function formatShortDate(date: Date): string;
/** `2026-01-15` — ISO-style calendar date for tables and menus. */
export declare function formatIsoDate(date: Date): string;
