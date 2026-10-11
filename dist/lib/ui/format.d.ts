import type { UiRuntimeOptions } from "./runtime.js";
export type UiTextTone = "heading" | "accent" | "muted" | "success" | "warning" | "danger" | "normal";
export declare function paintUiText(ui: UiRuntimeOptions, text: string, tone?: UiTextTone): string;
export declare function formatUiHeader(ui: UiRuntimeOptions, title: string): string[];
export declare function formatUiSection(ui: UiRuntimeOptions, title: string): string[];
export declare function formatUiItem(ui: UiRuntimeOptions, text: string, tone?: UiTextTone, suffix?: string, maxLength?: number): string;
export declare function formatUiKeyValue(ui: UiRuntimeOptions, key: string, value: string, valueTone?: UiTextTone, maxLength?: number): string;
export declare function formatUiBadge(ui: UiRuntimeOptions, label: string, tone?: Exclude<UiTextTone, "normal" | "heading">): string;
