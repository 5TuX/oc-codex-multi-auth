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
export function shouldUseColor(stdout = process.stdout, env = process.env) {
    if (env.NO_COLOR !== undefined && env.NO_COLOR !== "")
        return false;
    const force = env.FORCE_COLOR;
    if (force !== undefined && force !== "") {
        if (force === "0" || force === "false")
            return false;
        return true;
    }
    if (!hasAnsiCapableTerm(env))
        return false;
    return Boolean(stdout.isTTY);
}
/**
 * Whether `TERM` describes a terminal that understands ANSI escape
 * sequences at all. `dumb`, `cons25`, and `emacs` (shell buffers) do not.
 * An unset `TERM` is treated as capable: on a real TTY every mainstream
 * terminal sets it, and silently disabling capability on odd setups would
 * remove styling users asked for via `FORCE_COLOR`/`codexTuiV2`.
 */
function hasAnsiCapableTerm(env) {
    const term = env.TERM?.toLowerCase();
    if (term === undefined || term === "")
        return true;
    return term !== "dumb" && term !== "cons25" && term !== "emacs";
}
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
export function terminalSupportsAnsi(stdout = process.stdout, env = process.env) {
    if (!stdout.isTTY)
        return false;
    return hasAnsiCapableTerm(env);
}
const ansi16 = (code) => `\x1b[${code}m`;
const ansi256 = (code) => `\x1b[38;5;${code}m`;
const truecolor = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
/**
 * Resolves an `auto` glyph mode against the current environment, leaving
 * explicit `ascii`/`unicode` untouched. Exported so surfaces outside the
 * {@link UiTheme} carrier (status lines, V2 slots, tables) can honour
 * `codexTuiGlyphMode` as well.
 */
export function resolveUiGlyphMode(mode) {
    if (mode !== "auto")
        return mode;
    const isLikelyUnicodeSafe = process.env.WT_SESSION !== undefined ||
        process.env.TERM_PROGRAM === "vscode" ||
        process.env.TERM?.toLowerCase().includes("xterm") === true;
    return isLikelyUnicodeSafe ? "unicode" : "ascii";
}
function getGlyphs(mode) {
    if (mode === "unicode") {
        return {
            selected: "◆",
            unselected: "○",
            bullet: "•",
            check: "✓",
            cross: "✗",
            separator: "·",
            ellipsis: "…",
            active: "●",
            inactive: "○",
            arrow: "→",
            emDash: "—",
        };
    }
    return {
        selected: ">",
        unselected: "o",
        bullet: "-",
        check: "+",
        cross: "x",
        separator: "-",
        ellipsis: "...",
        active: "*",
        inactive: "o",
        arrow: "->",
        emDash: "-",
    };
}
/** Glyph set for a (possibly `auto`) glyph mode, resolved once. */
export function resolveUiGlyphs(mode) {
    return getGlyphs(resolveUiGlyphMode(mode));
}
function getColors(profile) {
    switch (profile) {
        case "truecolor":
            return {
                reset: "\x1b[0m",
                dim: "\x1b[2m",
                muted: truecolor(148, 163, 184),
                heading: truecolor(226, 232, 240),
                accent: truecolor(56, 189, 248),
                success: truecolor(74, 222, 128),
                warning: truecolor(251, 191, 36),
                danger: truecolor(248, 113, 113),
                border: truecolor(100, 116, 139),
            };
        case "ansi256":
            return {
                reset: "\x1b[0m",
                dim: "\x1b[2m",
                muted: ansi256(109),
                heading: ansi256(255),
                accent: ansi256(45),
                success: ansi256(84),
                warning: ansi256(220),
                danger: ansi256(203),
                border: ansi256(67),
            };
        default:
            return {
                reset: "\x1b[0m",
                dim: "\x1b[2m",
                muted: ansi16(37),
                heading: ansi16(97),
                accent: ansi16(96),
                success: ansi16(92),
                warning: ansi16(93),
                danger: ansi16(91),
                border: ansi16(90),
            };
    }
}
export function createUiTheme(options) {
    const profile = options?.profile ?? "truecolor";
    const glyphMode = options?.glyphMode ?? "ascii";
    const resolvedGlyphMode = resolveUiGlyphMode(glyphMode);
    return {
        profile,
        glyphMode,
        glyphs: getGlyphs(resolvedGlyphMode),
        colors: getColors(profile),
    };
}
//# sourceMappingURL=theme.js.map