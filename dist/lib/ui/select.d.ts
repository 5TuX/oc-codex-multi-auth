import { type UiTheme } from "./theme.js";
export interface MenuItem<T = string> {
    label: string;
    value: T;
    hint?: string;
    disabled?: boolean;
    separator?: boolean;
    kind?: "heading";
    color?: "red" | "green" | "yellow" | "cyan";
}
export interface SelectOptions {
    message: string;
    subtitle?: string;
    help?: string;
    clearScreen?: boolean;
    variant?: "legacy" | "codex";
    theme?: UiTheme;
}
export declare function select<T>(items: MenuItem<T>[], options: SelectOptions): Promise<T | null>;
