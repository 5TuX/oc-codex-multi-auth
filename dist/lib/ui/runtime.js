import { createUiTheme, shouldUseColor, } from "./theme.js";
function buildDefaultOptions() {
    return {
        v2Enabled: true,
        colorProfile: "truecolor",
        glyphMode: "ascii",
        theme: createUiTheme({ profile: "truecolor", glyphMode: "ascii" }),
        colorEnabled: shouldUseColor(),
    };
}
let runtimeOptions = buildDefaultOptions();
export function setUiRuntimeOptions(options) {
    const v2Enabled = options.v2Enabled ?? runtimeOptions.v2Enabled;
    const colorProfile = options.colorProfile ?? runtimeOptions.colorProfile;
    const glyphMode = options.glyphMode ?? runtimeOptions.glyphMode;
    // Re-resolve colorEnabled on every apply so that a test or caller
    // flipping `NO_COLOR` / `FORCE_COLOR` between invocations is honoured,
    // while an explicit override via `options.colorEnabled` still wins.
    const colorEnabled = options.colorEnabled ?? shouldUseColor();
    runtimeOptions = {
        v2Enabled,
        colorProfile,
        glyphMode,
        theme: createUiTheme({ profile: colorProfile, glyphMode }),
        colorEnabled,
    };
    return runtimeOptions;
}
export function getUiRuntimeOptions() {
    return runtimeOptions;
}
export function resetUiRuntimeOptions() {
    runtimeOptions = buildDefaultOptions();
    return runtimeOptions;
}
//# sourceMappingURL=runtime.js.map