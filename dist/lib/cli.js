import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { formatSeatSuffix, resolveDisplayEmail } from "./account-display.js";
import { showAuthMenu, showAccountDetails, isTTY, } from "./ui/auth-menu.js";
import { sanitizeDisplayText } from "./ui/display-text.js";
import { terminalSupportsAnsi } from "./ui/theme.js";
/**
 * `readline` question that settles on EOF as well as on an answer.
 *
 * When stdin closes mid-prompt (piped input ending, the TUI reclaiming the
 * stream) the pending `rl.question` is left in a state where whether it
 * resolves is version-dependent; racing it against `close` makes EOF answer
 * with `""` — the same as pressing Enter on an empty line.
 */
function askLine(rl, query) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (answer) => {
            if (settled)
                return;
            settled = true;
            rl.off("close", onClose);
            resolve(answer);
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            rl.off("close", onClose);
            reject(error instanceof Error ? error : new Error(String(error)));
        };
        const onClose = () => finish("");
        rl.once("close", onClose);
        rl.question(query).then(finish, fail);
    });
}
/**
 * Detect if running in OpenCode Desktop/TUI mode where readline prompts don't work.
 * In TUI mode, stdin/stdout are controlled by the TUI renderer, so readline breaks.
 * Exported for testing purposes.
 */
export function isNonInteractiveMode() {
    if (process.env.FORCE_INTERACTIVE_MODE === "1")
        return false;
    if (!input.isTTY || !output.isTTY)
        return true;
    if (process.env.OPENCODE_TUI === "1")
        return true;
    if (process.env.OPENCODE_DESKTOP === "1")
        return true;
    if (process.env.TERM_PROGRAM === "opencode")
        return true;
    if (process.env.ELECTRON_RUN_AS_NODE === "1")
        return true;
    return false;
}
export async function promptAddAnotherAccount(currentCount) {
    if (isNonInteractiveMode()) {
        return false;
    }
    const rl = createInterface({ input, output });
    try {
        console.log("\nTIP: use private browsing or sign out before adding another account.\n");
        const answer = await askLine(rl, `Add another account? (${currentCount} added) (y/n): `);
        const normalized = answer.trim().toLowerCase();
        return normalized === "y" || normalized === "yes";
    }
    finally {
        rl.close();
    }
}
function formatAccountLabel(account, index, options = {}) {
    const num = index + 1;
    // Label/email/id all originate from stored credentials — sanitize before
    // they are printed so escapes and bidi marks cannot reach the terminal.
    const label = sanitizeDisplayText(account.accountLabel, { maxLength: 64 });
    const email = sanitizeDisplayText(resolveDisplayEmail(account.email, options.maskEmail ?? false));
    const accountId = sanitizeDisplayText(account.accountId, { maxLength: 64 });
    const accountIdDisplay = accountId && accountId.length > 14
        ? `${accountId.slice(0, 8)}...${accountId.slice(-6)}`
        : accountId;
    const seatSuffix = formatSeatSuffix(account.accountUserId, options.peerAccounts?.map((peer) => peer.accountUserId));
    const details = [];
    if (email)
        details.push(email);
    if (label)
        details.push(`workspace:${label}`);
    if (accountIdDisplay)
        details.push(`id:${accountIdDisplay}`);
    if (seatSuffix)
        details.push(`seat:${seatSuffix}`);
    if (details.length > 0) {
        return `${num}. ${details.join(" | ")}`;
    }
    return `${num}. Account`;
}
async function promptDeleteAllTypedConfirm() {
    const rl = createInterface({ input, output });
    try {
        const answer = await askLine(rl, "Type DELETE to confirm removing all accounts: ");
        return answer.trim() === "DELETE";
    }
    finally {
        rl.close();
    }
}
async function promptLoginModeFallback(existingAccounts, maskEmail = false) {
    const rl = createInterface({ input, output });
    try {
        if (existingAccounts.length > 0) {
            console.log(`\n${existingAccounts.length} account(s) saved:`);
            for (const account of existingAccounts) {
                console.log(`  ${formatAccountLabel(account, account.index, { maskEmail, peerAccounts: existingAccounts })}`);
            }
            console.log("");
        }
        while (true) {
            const answer = await askLine(rl, "(a)dd, (f)resh, (c)heck, (d)eep, (v)erify flagged, or (q)uit? [a/f/c/d/v/q]: ");
            const normalized = answer.trim().toLowerCase();
            if (normalized === "a" || normalized === "add")
                return { mode: "add" };
            if (normalized === "f" || normalized === "fresh")
                return { mode: "fresh", deleteAll: true };
            if (normalized === "c" || normalized === "check")
                return { mode: "check" };
            if (normalized === "d" || normalized === "deep")
                return { mode: "deep-check" };
            if (normalized === "v" || normalized === "verify")
                return { mode: "verify-flagged" };
            if (normalized === "q" || normalized === "quit")
                return { mode: "cancel" };
            console.log("Please enter one of: a, f, c, d, v, q.");
        }
    }
    finally {
        rl.close();
    }
}
export async function promptLoginMode(existingAccounts, options = {}) {
    if (isNonInteractiveMode()) {
        return { mode: "add" };
    }
    const maskEmail = options.maskEmail ?? false;
    // A TTY that cannot move the cursor (`TERM=dumb`, `cons25`, emacs shell
    // buffers) gets the line-oriented fallback rather than a menu that would
    // paint escape sequences literally. `FORCE_COLOR` must NOT bypass this —
    // it covers styling, not cursor control.
    if (!isTTY() || !terminalSupportsAnsi()) {
        return promptLoginModeFallback(existingAccounts, maskEmail);
    }
    while (true) {
        const action = await showAuthMenu(existingAccounts, {
            flaggedCount: options.flaggedCount ?? 0,
            maskEmail,
        });
        switch (action.type) {
            case "add":
                return { mode: "add" };
            case "fresh":
                if (!(await promptDeleteAllTypedConfirm())) {
                    console.log("\nDelete-all cancelled.\n");
                    continue;
                }
                return { mode: "fresh", deleteAll: true };
            case "check":
                return { mode: "check" };
            case "deep-check":
                return { mode: "deep-check" };
            case "verify-flagged":
                return { mode: "verify-flagged" };
            case "select-account": {
                const accountAction = await showAccountDetails(action.account, {
                    maskEmail,
                    peerAccounts: existingAccounts,
                });
                if (accountAction === "delete") {
                    return { mode: "manage", deleteAccountIndex: action.account.index };
                }
                if (accountAction === "refresh") {
                    return { mode: "manage", refreshAccountIndex: action.account.index };
                }
                if (accountAction === "toggle") {
                    return { mode: "manage", toggleAccountIndex: action.account.index };
                }
                continue;
            }
            case "delete-all":
                if (!(await promptDeleteAllTypedConfirm())) {
                    console.log("\nDelete-all cancelled.\n");
                    continue;
                }
                return { mode: "fresh", deleteAll: true };
            case "cancel":
                return { mode: "cancel" };
        }
    }
}
export async function promptAccountSelection(candidates, options = {}) {
    if (candidates.length === 0)
        return null;
    const defaultIndex = typeof options.defaultIndex === "number" && Number.isFinite(options.defaultIndex)
        ? Math.max(0, Math.min(options.defaultIndex, candidates.length - 1))
        : 0;
    if (isNonInteractiveMode()) {
        return candidates[defaultIndex] ?? candidates[0] ?? null;
    }
    const rl = createInterface({ input, output });
    try {
        console.log(`\n${sanitizeDisplayText(options.title, { maxLength: 120 }) ?? "Multiple workspaces detected for this account:"}`);
        candidates.forEach((candidate, index) => {
            const isDefault = candidate.isDefault ? " (default)" : "";
            console.log(`  ${index + 1}. ${sanitizeDisplayText(candidate.label) ?? "unnamed"}${isDefault}`);
        });
        console.log("");
        while (true) {
            const answer = await askLine(rl, `Select workspace [${defaultIndex + 1}]: `);
            const normalized = answer.trim().toLowerCase();
            if (!normalized) {
                return candidates[defaultIndex] ?? candidates[0] ?? null;
            }
            if (normalized === "q" || normalized === "quit") {
                return candidates[defaultIndex] ?? candidates[0] ?? null;
            }
            const parsed = Number.parseInt(normalized, 10);
            if (Number.isFinite(parsed)) {
                const idx = parsed - 1;
                if (idx >= 0 && idx < candidates.length) {
                    return candidates[idx] ?? null;
                }
            }
            console.log(`Please enter a number between 1 and ${candidates.length}.`);
        }
    }
    finally {
        rl.close();
    }
}
export { isTTY };
//# sourceMappingURL=cli.js.map