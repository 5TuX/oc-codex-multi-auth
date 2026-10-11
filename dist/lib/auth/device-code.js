import { setTimeout as sleep } from "node:timers/promises";
import { logError, maskString } from "../logger.js";
import { AUTHORIZE_URL, CLIENT_ID, exchangeAuthorizationCode } from "./auth.js";
const DEFAULT_DEVICE_CODE_MAX_WAIT_MS = 15 * 60 * 1000;
const DEFAULT_DEVICE_CODE_INTERVAL_SECONDS = 5;
const DEVICE_CODE_LOG_BODY_LIMIT = 120;
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function getAuthOrigin(authBaseUrl = AUTHORIZE_URL) {
    return new URL(authBaseUrl).origin;
}
function getDeviceAuthApiBase(authBaseUrl) {
    return `${getAuthOrigin(authBaseUrl)}/api/accounts/deviceauth`;
}
function getDeviceVerificationUrl(authBaseUrl) {
    return `${getAuthOrigin(authBaseUrl)}/codex/device`;
}
function getDeviceRedirectUri(authBaseUrl) {
    return `${getAuthOrigin(authBaseUrl)}/deviceauth/callback`;
}
function truncateBody(bodyText) {
    const trimmed = bodyText.trim();
    if (trimmed.length <= DEVICE_CODE_LOG_BODY_LIMIT) {
        return trimmed;
    }
    return `${trimmed.slice(0, DEVICE_CODE_LOG_BODY_LIMIT)}...`;
}
// The auth-server error body is untrusted upstream text: it can echo
// identifiers like device_auth_id and is otherwise unbounded, so both the log
// copy and the user-facing copy are masked and truncated before use.
function getErrorMessage(status, bodyText, fallback) {
    const trimmed = bodyText.trim();
    if (!trimmed) {
        return fallback;
    }
    return `${fallback} (${status}): ${maskString(truncateBody(trimmed))}`;
}
function getRedactedErrorBody(bodyText) {
    const trimmed = bodyText.trim();
    if (!trimmed) {
        return "<empty>";
    }
    // Mask here too, not only in the user-facing path: this text is built for
    // the log line, and relying on the logger to catch a token-shaped leak in
    // an upstream body is one layer of defence too few.
    return maskString(truncateBody(trimmed));
}
function parseIntervalSeconds(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return Math.max(1, Math.floor(value));
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value.trim(), 10);
        if (Number.isFinite(parsed) && parsed > 0) {
            return Math.max(1, parsed);
        }
    }
    return DEFAULT_DEVICE_CODE_INTERVAL_SECONDS;
}
function parseDeviceCodeRequestResponse(raw) {
    if (!isRecord(raw))
        return null;
    const deviceAuthId = typeof raw.device_auth_id === "string" && raw.device_auth_id.trim()
        ? raw.device_auth_id.trim()
        : undefined;
    const userCode = typeof raw.user_code === "string" && raw.user_code.trim()
        ? raw.user_code.trim()
        : typeof raw.usercode === "string" && raw.usercode.trim()
            ? raw.usercode.trim()
            : undefined;
    if (!deviceAuthId || !userCode) {
        return null;
    }
    return {
        deviceAuthId,
        userCode,
        intervalSeconds: parseIntervalSeconds(raw.interval),
    };
}
function parseDeviceCodePollResponse(raw) {
    if (!isRecord(raw))
        return null;
    const authorizationCode = typeof raw.authorization_code === "string" && raw.authorization_code.trim()
        ? raw.authorization_code.trim()
        : undefined;
    const codeVerifier = typeof raw.code_verifier === "string" && raw.code_verifier.trim()
        ? raw.code_verifier.trim()
        : undefined;
    if (!authorizationCode || !codeVerifier) {
        return null;
    }
    return {
        authorizationCode,
        codeVerifier,
    };
}
export function buildDeviceCodeInstructions(session) {
    return [
        `Open this link and sign in: ${session.verificationUrl}`,
        `Enter this one-time code: ${session.userCode}`,
        "This code expires in about 15 minutes.",
    ].join("\n");
}
export async function createDeviceCodeSession(options) {
    const authBaseUrl = options?.authBaseUrl ?? AUTHORIZE_URL;
    const clientId = options?.clientId ?? CLIENT_ID;
    try {
        const response = await fetch(`${getDeviceAuthApiBase(authBaseUrl)}/usercode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: clientId }),
        });
        if (!response.ok) {
            const bodyText = await response.text().catch(() => "");
            const message = response.status === 404
                ? "Device code login is not enabled for this auth server. Retry with browser login or manual URL paste."
                : getErrorMessage(response.status, bodyText, "Device code login could not be started");
            logError(`device-code usercode request failed: ${response.status} ${getRedactedErrorBody(bodyText)}`);
            return {
                type: "failed",
                failure: {
                    type: "failed",
                    reason: "http_error",
                    statusCode: response.status,
                    message,
                },
            };
        }
        const rawJson = (await response.json());
        const parsed = parseDeviceCodeRequestResponse(rawJson);
        if (!parsed) {
            logError("device-code usercode response validation failed", rawJson);
            return {
                type: "failed",
                failure: {
                    type: "failed",
                    reason: "invalid_response",
                    message: "Device code login returned an invalid response",
                },
            };
        }
        return {
            type: "ready",
            session: {
                verificationUrl: getDeviceVerificationUrl(authBaseUrl),
                userCode: parsed.userCode,
                deviceAuthId: parsed.deviceAuthId,
                intervalSeconds: parsed.intervalSeconds,
            },
        };
    }
    catch (error) {
        const err = error;
        logError("device-code usercode request error", err);
        return {
            type: "failed",
            failure: {
                type: "failed",
                reason: "network_error",
                // Raw Node error text is kept for diagnosability (paths/hosts are
                // fine), but it is still run through the credential masker before
                // reaching the user-facing auth result.
                message: typeof err?.message === "string" ? maskString(err.message) : undefined,
            },
        };
    }
}
export async function completeDeviceCodeSession(session, options) {
    const authBaseUrl = options?.authBaseUrl ?? AUTHORIZE_URL;
    const maxWaitMs = options?.maxWaitMs ?? DEFAULT_DEVICE_CODE_MAX_WAIT_MS;
    const pollUrl = `${getDeviceAuthApiBase(authBaseUrl)}/token`;
    const startedAt = Date.now();
    try {
        while (Date.now() - startedAt < maxWaitMs) {
            const response = await fetch(pollUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    device_auth_id: session.deviceAuthId,
                    user_code: session.userCode,
                }),
            });
            if (response.ok) {
                const rawJson = (await response.json());
                const parsed = parseDeviceCodePollResponse(rawJson);
                if (!parsed) {
                    logError("device-code token poll response validation failed", rawJson);
                    return {
                        type: "failed",
                        reason: "invalid_response",
                        message: "Device code login returned an invalid authorization payload",
                    };
                }
                return await exchangeAuthorizationCode(parsed.authorizationCode, parsed.codeVerifier, getDeviceRedirectUri(authBaseUrl));
            }
            if (response.status === 403 || response.status === 404) {
                await sleep(session.intervalSeconds * 1000);
                continue;
            }
            const bodyText = await response.text().catch(() => "");
            logError(`device-code token poll failed: ${response.status} ${getRedactedErrorBody(bodyText)}`);
            return {
                type: "failed",
                reason: "http_error",
                statusCode: response.status,
                message: getErrorMessage(response.status, bodyText, "Device code authorization failed"),
            };
        }
        return {
            type: "failed",
            reason: "unknown",
            message: "Device code authorization timed out after 15 minutes; restart login for a fresh code",
        };
    }
    catch (error) {
        const err = error;
        logError("device-code token poll error", err);
        return {
            type: "failed",
            reason: "network_error",
            message: typeof err?.message === "string" ? maskString(err.message) : undefined,
        };
    }
}
//# sourceMappingURL=device-code.js.map