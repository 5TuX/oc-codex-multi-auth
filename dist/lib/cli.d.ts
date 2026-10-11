import type { AccountIdSource } from "./types.js";
import { isTTY, type AccountStatus } from "./ui/auth-menu.js";
/**
 * Detect if running in OpenCode Desktop/TUI mode where readline prompts don't work.
 * In TUI mode, stdin/stdout are controlled by the TUI renderer, so readline breaks.
 * Exported for testing purposes.
 */
export declare function isNonInteractiveMode(): boolean;
export declare function promptAddAnotherAccount(currentCount: number): Promise<boolean>;
export type LoginMode = "add" | "fresh" | "manage" | "check" | "deep-check" | "verify-flagged" | "cancel";
export interface ExistingAccountInfo {
    accountId?: string;
    accountUserId?: string;
    accountLabel?: string;
    email?: string;
    index: number;
    addedAt?: number;
    lastUsed?: number;
    status?: AccountStatus;
    isCurrentAccount?: boolean;
    enabled?: boolean;
}
export interface LoginMenuOptions {
    flaggedCount?: number;
    maskEmail?: boolean;
}
export interface LoginMenuResult {
    mode: LoginMode;
    deleteAccountIndex?: number;
    refreshAccountIndex?: number;
    toggleAccountIndex?: number;
    deleteAll?: boolean;
}
export declare function promptLoginMode(existingAccounts: ExistingAccountInfo[], options?: LoginMenuOptions): Promise<LoginMenuResult>;
export interface AccountSelectionCandidate {
    accountId: string;
    label: string;
    source?: AccountIdSource;
    isDefault?: boolean;
}
export interface AccountSelectionOptions {
    defaultIndex?: number;
    title?: string;
}
export declare function promptAccountSelection(candidates: AccountSelectionCandidate[], options?: AccountSelectionOptions): Promise<AccountSelectionCandidate | null>;
export { isTTY };
export type { AccountStatus };
