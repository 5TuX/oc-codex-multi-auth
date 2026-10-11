export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogClient {
    app?: {
        log?: (options: {
            body: {
                service: string;
                level: LogLevel;
                message: string;
                extra?: Record<string, unknown>;
            };
        }) => unknown;
    };
}
declare function maskEmail(email: string): string;
declare function maskString(value: string): string;
declare function sanitizeValue(value: unknown, depth?: number): unknown;
export declare const LOGGING_ENABLED: boolean;
export declare const REQUEST_BODY_LOGGING_ENABLED: boolean;
export declare const DEBUG_ENABLED: boolean;
export declare const LOG_LEVEL: LogLevel;
export declare const LOG_DIR: string;
export declare function setCorrelationId(id?: string): string;
export declare function getCorrelationId(): string | null;
export declare function clearCorrelationId(): void;
export declare function initLogger(newClient: LogClient): void;
declare function formatDuration(ms: number): string;
export declare function logRequest(stage: string, data: Record<string, unknown>): void;
export declare function logDebug(message: string, data?: unknown): void;
export declare function logInfo(message: string, data?: unknown): void;
export declare function logWarn(message: string, data?: unknown): void;
export declare function logError(message: string, data?: unknown): void;
export interface ScopedLogger {
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    time(label: string): () => number;
    timeEnd(label: string, startTime: number): void;
}
export declare function createLogger(scope: string): ScopedLogger;
export declare function getRequestId(): number;
export { formatDuration, maskEmail, maskString, sanitizeValue };
/**
 * Test-only exports. Internal helpers surfaced here so their redaction
 * invariants can be unit-tested directly rather than through the
 * side-effect-heavy logDebug/logRequest code paths. Do NOT import from this
 * namespace outside of tests.
 */
export declare const __testOnly: {
    maskString: typeof maskString;
    sanitizeValue: typeof sanitizeValue;
};
