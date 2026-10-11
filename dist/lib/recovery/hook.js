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
import { createLogger } from "../logger.js";
import { readParts, findMessagesWithThinkingBlocks, findMessagesWithOrphanThinking, findMessageByIndexNeedingThinking, prependThinkingPart, stripThinkingParts, } from "./storage.js";
const RECOVERY_RESUME_TEXT = "[session recovered - continuing previous task]";
function getErrorMessage(error) {
    if (!error)
        return "";
    if (typeof error === "string")
        return error.toLowerCase();
    const errorObj = error;
    const paths = [
        errorObj.data,
        errorObj.error,
        errorObj,
        errorObj.data?.error,
    ];
    for (const obj of paths) {
        if (obj && typeof obj === "object") {
            const msg = obj.message;
            if (typeof msg === "string" && msg.length > 0) {
                return msg.toLowerCase();
            }
        }
    }
    try {
        return JSON.stringify(error).toLowerCase();
    }
    catch {
        return "";
    }
}
function extractMessageIndex(error) {
    const message = getErrorMessage(error);
    const match = message.match(/messages\.(\d+)/);
    if (!match || !match[1])
        return null;
    return parseInt(match[1], 10);
}
export function detectErrorType(error) {
    const message = getErrorMessage(error);
    if (message.includes("tool_use") && message.includes("tool_result")) {
        return "tool_result_missing";
    }
    if (message.includes("thinking") &&
        (message.includes("first block") ||
            message.includes("must start with") ||
            message.includes("preceeding") ||
            (message.includes("expected") && message.includes("found")))) {
        return "thinking_block_order";
    }
    if (message.includes("thinking is disabled") && message.includes("cannot contain")) {
        return "thinking_disabled_violation";
    }
    return null;
}
export function isRecoverableError(error) {
    return detectErrorType(error) !== null;
}
function extractToolUseIds(parts) {
    return parts
        .filter((p) => p.type === "tool_use" && !!p.id)
        .map((p) => p.id);
}
async function sendToolResultsForRecovery(client, sessionID, toolResultParts) {
    const bodyWithParts = {
        parts: toolResultParts,
    };
    await client.session.prompt({
        path: { id: sessionID },
        body: bodyWithParts,
    });
}
async function recoverToolResultMissing(client, sessionID, failedMsg) {
    let parts = failedMsg.parts || [];
    if (parts.length === 0 && failedMsg.info?.id) {
        const storedParts = readParts(failedMsg.info.id);
        parts = storedParts.map((p) => ({
            type: p.type === "tool" ? "tool_use" : p.type,
            id: "callID" in p ? p.callID : p.id,
            name: "tool" in p ? p.tool : undefined,
            input: "state" in p ? p.state?.input : undefined,
        }));
    }
    const toolUseIds = extractToolUseIds(parts);
    if (toolUseIds.length === 0) {
        return false;
    }
    const toolResultParts = toolUseIds.map((id) => ({
        type: "tool_result",
        tool_use_id: id,
        content: "Operation cancelled by user (ESC pressed)",
    }));
    try {
        await sendToolResultsForRecovery(client, sessionID, toolResultParts);
        return true;
    }
    catch {
        return false;
    }
}
function recoverThinkingBlockOrder(sessionID, _failedMsg, error) {
    const targetIndex = extractMessageIndex(error);
    if (targetIndex !== null) {
        const targetMessageID = findMessageByIndexNeedingThinking(sessionID, targetIndex);
        if (targetMessageID) {
            return prependThinkingPart(sessionID, targetMessageID);
        }
    }
    const orphanMessages = findMessagesWithOrphanThinking(sessionID);
    if (orphanMessages.length === 0) {
        return false;
    }
    let anySuccess = false;
    for (const messageID of orphanMessages) {
        if (prependThinkingPart(sessionID, messageID)) {
            anySuccess = true;
        }
    }
    return anySuccess;
}
function recoverThinkingDisabledViolation(sessionID, _failedMsg) {
    const messagesWithThinking = findMessagesWithThinkingBlocks(sessionID);
    if (messagesWithThinking.length === 0) {
        return false;
    }
    let anySuccess = false;
    for (const messageID of messagesWithThinking) {
        if (stripThinkingParts(messageID)) {
            anySuccess = true;
        }
    }
    return anySuccess;
}
function findLastUserMessage(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.info?.role === "user") {
            return messages[i];
        }
    }
    return undefined;
}
function extractResumeConfig(userMessage, sessionID) {
    return {
        sessionID,
        agent: userMessage?.info?.agent,
        model: userMessage?.info?.model,
    };
}
async function resumeSession(client, config, directory) {
    try {
        await client.session.prompt({
            path: { id: config.sessionID },
            body: {
                parts: [{ type: "text", text: RECOVERY_RESUME_TEXT }],
                agent: config.agent,
                model: config.model,
            },
            query: { directory },
        });
        return true;
    }
    catch {
        return false;
    }
}
const TOAST_TITLES = {
    tool_result_missing: "Tool Crash Recovery",
    thinking_block_order: "Thinking Block Recovery",
    thinking_disabled_violation: "Thinking Strip Recovery",
};
const TOAST_MESSAGES = {
    tool_result_missing: "Injecting cancelled tool results...",
    thinking_block_order: "Fixing message structure...",
    thinking_disabled_violation: "Stripping thinking blocks...",
};
export function getRecoveryToastContent(errorType) {
    if (!errorType) {
        return {
            title: "Session Recovery",
            message: "Attempting to recover session...",
        };
    }
    return {
        title: TOAST_TITLES[errorType] || "Session Recovery",
        message: TOAST_MESSAGES[errorType] || "Attempting to recover session...",
    };
}
export function getRecoverySuccessToast() {
    return {
        title: "Session Recovered",
        message: "Continuing where you left off...",
    };
}
export function getRecoveryFailureToast() {
    return {
        title: "Recovery Failed",
        message: "Please retry or start a new session.",
    };
}
export function createSessionRecoveryHook(ctx, config) {
    if (!config.sessionRecovery) {
        return null;
    }
    const { client, directory } = ctx;
    const processingErrors = new Set();
    let onAbortCallback = null;
    let onRecoveryCompleteCallback = null;
    const setOnAbortCallback = (callback) => {
        onAbortCallback = callback;
    };
    const setOnRecoveryCompleteCallback = (callback) => {
        onRecoveryCompleteCallback = callback;
    };
    const handleSessionRecovery = async (info) => {
        if (!info || info.role !== "assistant" || !info.error)
            return false;
        const errorType = detectErrorType(info.error);
        if (!errorType)
            return false;
        const sessionID = info.sessionID;
        if (!sessionID)
            return false;
        let assistantMsgID = info.id;
        const log = createLogger("session-recovery");
        log.debug("Recovery attempt started", {
            errorType,
            sessionID,
            providedMsgID: assistantMsgID ?? "none",
        });
        if (onAbortCallback) {
            onAbortCallback(sessionID);
        }
        await client.session.abort({ path: { id: sessionID } }).catch(() => { });
        const messagesResp = await client.session.messages({
            path: { id: sessionID },
            query: { directory },
        });
        const msgs = messagesResp.data;
        if (!assistantMsgID && msgs && msgs.length > 0) {
            for (let i = msgs.length - 1; i >= 0; i--) {
                const m = msgs[i];
                if (m && m.info?.role === "assistant" && m.info?.id) {
                    assistantMsgID = m.info.id;
                    log.debug("Found assistant message ID from session messages", {
                        msgID: assistantMsgID,
                        msgIndex: i,
                    });
                    break;
                }
            }
        }
        if (!assistantMsgID) {
            log.debug("No assistant message ID found, cannot recover");
            return false;
        }
        if (processingErrors.has(assistantMsgID))
            return false;
        processingErrors.add(assistantMsgID);
        try {
            const failedMsg = msgs?.find((m) => m.info?.id === assistantMsgID);
            if (!failedMsg) {
                return false;
            }
            const toastContent = getRecoveryToastContent(errorType);
            await client.tui
                .showToast({
                body: {
                    title: toastContent.title,
                    message: toastContent.message,
                    variant: "warning",
                },
            })
                .catch(() => { });
            let success = false;
            if (errorType === "tool_result_missing") {
                success = await recoverToolResultMissing(client, sessionID, failedMsg);
            }
            else if (errorType === "thinking_block_order") {
                success = recoverThinkingBlockOrder(sessionID, failedMsg, info.error);
                if (success && config.autoResume) {
                    const lastUser = findLastUserMessage(msgs ?? []);
                    const resumeConfig = extractResumeConfig(lastUser, sessionID);
                    await resumeSession(client, resumeConfig, directory);
                }
            }
            else if (errorType === "thinking_disabled_violation") {
                success = recoverThinkingDisabledViolation(sessionID, failedMsg);
                if (success && config.autoResume) {
                    const lastUser = findLastUserMessage(msgs ?? []);
                    const resumeConfig = extractResumeConfig(lastUser, sessionID);
                    await resumeSession(client, resumeConfig, directory);
                }
            }
            return success;
        }
        catch (err) {
            log.error("Recovery failed", { error: String(err) });
            return false;
        }
        finally {
            processingErrors.delete(assistantMsgID);
            if (sessionID && onRecoveryCompleteCallback) {
                onRecoveryCompleteCallback(sessionID);
            }
        }
    };
    return {
        handleSessionRecovery,
        isRecoverableError,
        setOnAbortCallback,
        setOnRecoveryCompleteCallback,
    };
}
//# sourceMappingURL=hook.js.map