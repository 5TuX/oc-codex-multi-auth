/**
 * Session recovery orchestration hook.
 *
 * High-level entry point (`createSessionRecoveryHook`) plus the helpers that
 * classify recoverable errors, dispatch recovery strategies, and surface toast
 * notifications to the OpenCode TUI.
 *
 * Low-level storage primitives live alongside this file under
 * `lib/recovery/storage.ts`; constants and types live in their own sibling
 * modules. The public API is re-exported from `lib/recovery.ts` (barrel) so
 * consumers keep importing from `./recovery`.
 */
import type { PluginInput } from "@opencode-ai/plugin";
import type { PluginConfig } from "../types.js";
import type { MessageInfo, RecoveryErrorType } from "./types.js";
type PluginClient = PluginInput["client"];
export declare function detectErrorType(error: unknown): RecoveryErrorType;
export declare function isRecoverableError(error: unknown): boolean;
export declare function getRecoveryToastContent(errorType: RecoveryErrorType): {
    title: string;
    message: string;
};
export declare function getRecoverySuccessToast(): {
    title: string;
    message: string;
};
export declare function getRecoveryFailureToast(): {
    title: string;
    message: string;
};
export interface SessionRecoveryHook {
    handleSessionRecovery: (info: MessageInfo) => Promise<boolean>;
    isRecoverableError: (error: unknown) => boolean;
    setOnAbortCallback: (callback: (sessionID: string) => void) => void;
    setOnRecoveryCompleteCallback: (callback: (sessionID: string) => void) => void;
}
export interface SessionRecoveryContext {
    client: PluginClient;
    directory: string;
}
export declare function createSessionRecoveryHook(ctx: SessionRecoveryContext, config: PluginConfig): SessionRecoveryHook | null;
export {};
