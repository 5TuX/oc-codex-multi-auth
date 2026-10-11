import { isTTY } from "./ansi.js";
export type AccountStatus = "active" | "ok" | "rate-limited" | "cooldown" | "disabled" | "error" | "flagged" | "unknown";
export interface AccountInfo {
    index: number;
    accountId?: string;
    accountUserId?: string;
    accountLabel?: string;
    email?: string;
    addedAt?: number;
    lastUsed?: number;
    status?: AccountStatus;
    isCurrentAccount?: boolean;
    enabled?: boolean;
}
export interface AuthMenuOptions {
    flaggedCount?: number;
    maskEmail?: boolean;
}
export type AuthMenuAction = {
    type: "add";
} | {
    type: "fresh";
} | {
    type: "check";
} | {
    type: "deep-check";
} | {
    type: "verify-flagged";
} | {
    type: "select-account";
    account: AccountInfo;
} | {
    type: "delete-all";
} | {
    type: "cancel";
};
export type AccountAction = "back" | "delete" | "refresh" | "toggle" | "cancel";
export declare function showAuthMenu(accounts: AccountInfo[], options?: AuthMenuOptions): Promise<AuthMenuAction>;
export declare function showAccountDetails(account: AccountInfo, options?: {
    maskEmail?: boolean;
    peerAccounts?: readonly AccountInfo[];
}): Promise<AccountAction>;
export { isTTY };
