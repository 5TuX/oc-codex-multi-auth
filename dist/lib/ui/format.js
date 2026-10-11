import { displayWidth, sanitizeDisplayText } from "./display-text.js";
const TONE_TO_COLOR = {
    heading: "heading",
    accent: "accent",
    muted: "muted",
    success: "success",
    warning: "warning",
    danger: "danger",
    normal: null,
};
export function paintUiText(ui, text, tone = "normal") {
    if (!ui.v2Enabled)
        return text;
    // `colorEnabled === false` means NO_COLOR / FORCE_COLOR=0 / no TTY;
    // return the unstyled text so the layout (bullets, labels, spacing)
    // is preserved but no ANSI escape sequences are emitted.
    if (ui.colorEnabled === false)
        return text;
    const colorKey = TONE_TO_COLOR[tone];
    if (!colorKey)
        return text;
    return `${ui.theme.colors[colorKey]}${text}${ui.theme.colors.reset}`;
}
/**
 * Untrusted text (titles, account labels, server-provided strings) is
 * sanitized before interpolation: control characters, bidi overrides, and
 * every escape sequence — SGR included — are stripped so a persisted value
 * cannot smuggle cursor movement, reordering, or concealment (`ESC[8m`) into
 * rendered output. Intentional styling enters through `paintUiText` tones or
 * the `suffix` channel below, never through the sanitized text itself.
 *
 * `maxLength` bounds the untrusted-label default (160): trusted but
 * legitimately long strings — warnings that interpolate storage paths — pass
 * an explicit, larger bound so a hard cut cannot eat the message's reason.
 */
function sanitizeUiText(value, maxLength) {
    return sanitizeDisplayText(value, { preserveSgr: false, maxLength }) ?? "";
}
export function formatUiHeader(ui, title) {
    const text = sanitizeUiText(title);
    if (!ui.v2Enabled)
        return [text];
    const divider = "-".repeat(Math.max(8, displayWidth(text)));
    return [
        paintUiText(ui, text, "heading"),
        paintUiText(ui, divider, "muted"),
    ];
}
export function formatUiSection(ui, title) {
    const text = sanitizeUiText(title);
    if (!ui.v2Enabled)
        return [text];
    return [paintUiText(ui, text, "accent")];
}
export function formatUiItem(ui, text, tone = "normal", suffix = "", maxLength) {
    const item = sanitizeUiText(text, maxLength);
    if (!ui.v2Enabled)
        return `- ${item}${suffix}`;
    const bullet = paintUiText(ui, ui.theme.glyphs.bullet, "muted");
    return `${bullet} ${paintUiText(ui, item, tone)}${suffix}`;
}
export function formatUiKeyValue(ui, key, value, valueTone = "normal", maxLength) {
    const safeKey = sanitizeUiText(key);
    const safeValue = sanitizeUiText(value, maxLength);
    if (!ui.v2Enabled)
        return `${safeKey}: ${safeValue}`;
    const keyText = paintUiText(ui, `${safeKey}:`, "muted");
    const valueText = paintUiText(ui, safeValue, valueTone);
    return `${keyText} ${valueText}`;
}
export function formatUiBadge(ui, label, tone = "accent") {
    const text = `[${sanitizeUiText(label)}]`;
    return paintUiText(ui, text, tone);
}
//# sourceMappingURL=format.js.map