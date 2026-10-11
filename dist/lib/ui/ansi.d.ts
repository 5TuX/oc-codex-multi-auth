/**
 * ANSI escape helpers and keyboard parsing for interactive TUI menus.
 */
export declare const ANSI: {
    readonly hide: "\u001B[?25l";
    readonly show: "\u001B[?25h";
    readonly up: (lines?: number) => string;
    readonly clearLine: "\u001B[2K";
    readonly clearScreen: "\u001B[2J";
    readonly moveTo: (row: number, col: number) => string;
    readonly cyan: "\u001B[36m";
    readonly green: "\u001B[32m";
    readonly red: "\u001B[31m";
    readonly yellow: "\u001B[33m";
    readonly dim: "\u001B[2m";
    readonly bold: "\u001B[1m";
    readonly reset: "\u001B[0m";
};
export type KeyAction = "up" | "down" | "enter" | "escape" | "escape-start" | null;
export type KeyPressAction = Exclude<KeyAction, "escape-start" | null>;
export interface KeyMatch {
    action: KeyPressAction | null;
    /** Characters of the input consumed by this key event. */
    length: number;
}
/**
 * Consumes the leading key event from `input`.
 *
 * - `{ action, length }` for a recognized key (arrow, enter, ctrl-c).
 * - `{ action: null, length }` for input that is complete but unbound —
 *   other escape sequences (function keys, OSC) or ordinary characters.
 * - `"incomplete"` when `input` is a strict prefix of a recognizable
 *   sequence — the caller should buffer it and wait for more bytes (or an
 *   escape timeout) rather than dropping half a keystroke.
 */
export declare function matchKeyInput(input: string): KeyMatch | "incomplete" | null;
/**
 * Single-buffer keystroke parser (legacy semantics). Prefer
 * {@link matchKeyInput} for streaming input where escape sequences may be
 * split across `data` events.
 */
export declare function parseKey(data: Buffer): KeyAction;
export declare function isTTY(): boolean;
