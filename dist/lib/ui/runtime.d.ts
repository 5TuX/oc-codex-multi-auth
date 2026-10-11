import { type UiColorProfile, type UiGlyphMode, type UiTheme } from "./theme.js";
export interface UiRuntimeOptions {
    v2Enabled: boolean;
    colorProfile: UiColorProfile;
    glyphMode: UiGlyphMode;
    theme: UiTheme;
    /**
     * Effective ANSI-color enablement after resolving `NO_COLOR` /
     * `FORCE_COLOR` / TTY detection via {@link shouldUseColor}.
     *
     * Optional so existing literals that build a `UiRuntimeOptions` in
     * tests or mocks without this field keep working; downstream
     * consumers must treat `undefined` as "colors allowed" to preserve
     * the pre-existing behaviour.
     */
    colorEnabled?: boolean;
}
export declare function setUiRuntimeOptions(options: Partial<Omit<UiRuntimeOptions, "theme">>): UiRuntimeOptions;
export declare function getUiRuntimeOptions(): UiRuntimeOptions;
export declare function resetUiRuntimeOptions(): UiRuntimeOptions;
