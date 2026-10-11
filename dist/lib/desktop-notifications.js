import { execFile } from "node:child_process";
import { logDebug, logWarn } from "./logger.js";
import { sanitizeDisplayText } from "./ui/display-text.js";
const DELIVERY_TIMEOUT_MS = 10_000;
const MACOS_NOTIFICATION_SCRIPT = `
function run(argv) {
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	app.displayNotification(argv[1], { withTitle: argv[0] });
}
`.trim();
const executeFile = (file, args, options, callback) => {
    return execFile(file, args, options, (error) => callback(error));
};
function getErrorCode(error) {
    if (typeof error !== "object" || error === null)
        return "unknown";
    const code = error.code;
    return typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
}
export function isDesktopNotificationSupported(platform = process.platform) {
    return platform === "darwin";
}
export function createDesktopNotifier(options) {
    const platform = options?.platform ?? process.platform;
    const run = options?.executeFile ?? executeFile;
    let warningLogged = false;
    const warnOnce = (message) => {
        if (warningLogged)
            return;
        warningLogged = true;
        logWarn(message);
    };
    return async (title, message) => {
        if (!isDesktopNotificationSupported(platform)) {
            warnOnce("Desktop quota notifications are supported only on macOS.");
            return false;
        }
        // Notification text is built from quota/account strings — strip
        // controls, escapes and bidi marks before it reaches Notification
        // Center (which honours a subset of them).
        const safeTitle = sanitizeDisplayText(title) ?? "Codex";
        const safeMessage = sanitizeDisplayText(message) ?? "";
        return await new Promise((resolve) => {
            try {
                run("/usr/bin/osascript", ["-l", "JavaScript", "-e", MACOS_NOTIFICATION_SCRIPT, safeTitle, safeMessage], { timeout: DELIVERY_TIMEOUT_MS, windowsHide: true }, (error) => {
                    if (!error) {
                        resolve(true);
                        return;
                    }
                    logDebug(`Desktop quota notification failed with code ${getErrorCode(error)}`);
                    warnOnce("Desktop quota notification delivery failed on macOS.");
                    resolve(false);
                });
            }
            catch (error) {
                logDebug(`Desktop quota notification threw with code ${getErrorCode(error)}`);
                warnOnce("Desktop quota notification delivery failed on macOS.");
                resolve(false);
            }
        });
    };
}
export const sendDesktopNotification = createDesktopNotifier();
//# sourceMappingURL=desktop-notifications.js.map