/**
 * Shared terminal theme primitives for legacy and Codex-style TUI rendering.
 */
/**
 * Resolve whether ANSI color output is permitted, honouring the widely
 * supported `NO_COLOR` (https://no-color.org) and `FORCE_COLOR`
 * conventions before falling back to TTY detection.
 *
 * Precedence:
 *   1. `NO_COLOR` — if set to any non-empty value, colors are disabled.
 *      An empty string is treated as "not set" (matches the spec).
 *   2. `FORCE_COLOR` — if set to any value other than `"0"` / `"false"`,
 *      colors are forced on even without a TTY. `"0"` or `"false"`
 *      forces colors OFF regardless of TTY.
 *   3. `TERM=dumb` (and equally limited terminals) cannot render color;
 *      this check sits after `FORCE_COLOR` because a positive force is an
 *      explicit operator override.
 *   4. Fallback: enable colors when the stream is a TTY. Non-TTY output —
 *      pipes, files, and CI logs — therefore gets plain text automatically.
 *
 * The helper takes its dependencies as parameters so it is trivially
 * testable and can be reused from non-process contexts.
 */
export declare function shouldUseColor(stdout?: {
    isTTY?: boolean;
}, env?: NodeJS.ProcessEnv): boolean;
/**
 * Resolve whether the terminal accepts ANSI *control* sequences — cursor
 * movement, screen clearing, hide/show cursor. This is a separate, stricter
 * question than {@link shouldUseColor}: `FORCE_COLOR` can force styling on
 * but must never unlock cursor controls, because a positive FORCE_COLOR
 * does not prove the terminal can move the cursor (e.g. `TERM=dumb` with
 * `FORCE_COLOR=1` still cannot reposition). Conversely `NO_COLOR` does not
 * disable cursor movement.
 *
 * Requirement: the stream is a TTY *and* `TERM` is ANSI-capable.
 */
export declare function terminalSupportsAnsi(stdout?: {
    isTTY?: boolean;
}, env?: NodeJS.ProcessEnv): boolean;
export type UiColorProfile = "ansi16" | "ansi256" | "truecolor";
export type UiGlyphMode = "ascii" | "unicode" | "auto";
export interface UiGlyphSet {
    selected: string;
    unselected: string;
    bullet: string;
    check: string;
    cross: string;
    /** Inline separator between status segments: `·` / `-`. */
    separator: string;
    /** Truncation marker: `…` / `...`. */
    ellipsis: string;
    /** Filled marker for the active entry: `●` / `*`. */
    active: string;
    /** Hollow marker for inactive entries: `○` / `o`. */
    inactive: string;
    /** Directional marker: `→` / `->`. */
    arrow: string;
    /** Sentence-level dash: `—` / `-`. */
    emDash: string;
}
export interface UiThemeColors {
    reset: string;
    dim: string;
    muted: string;
    heading: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    border: string;
}
export interface UiTheme {
    profile: UiColorProfile;
    glyphMode: UiGlyphMode;
    glyphs: UiGlyphSet;
    colors: UiThemeColors;
}
/**
 * Resolves an `auto` glyph mode against the current environment, leaving
 * explicit `ascii`/`unicode` untouched. Exported so surfaces outside the
 * {@link UiTheme} carrier (status lines, V2 slots, tables) can honour
 * `codexTuiGlyphMode` as well.
 */
export declare function resolveUiGlyphMode(mode: UiGlyphMode): Exclude<UiGlyphMode, "auto">;
/** Glyph set for a (possibly `auto`) glyph mode, resolved once. */
export declare function resolveUiGlyphs(mode: UiGlyphMode): UiGlyphSet;
export declare function createUiTheme(options?: {
    profile?: UiColorProfile;
    glyphMode?: UiGlyphMode;
}): UiTheme;
