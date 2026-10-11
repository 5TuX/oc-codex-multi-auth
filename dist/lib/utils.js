/**
 * Consolidated utility functions for the Codex plugin.
 * Extracted from various modules to eliminate duplication.
 */
/**
 * Type guard for plain objects (not arrays, not null).
 * @param value - The value to check
 * @returns True if value is a plain object
 */
export function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Returns the current timestamp in milliseconds.
 * Wrapper for Date.now() to enable testing with mocked time.
 * @returns Current time in milliseconds since epoch
 */
export function nowMs() {
    return Date.now();
}
/**
 * Safely converts any value to a string representation.
 * @param value - The value to convert
 * @returns String representation of the value
 */
export function toStringValue(value) {
    if (typeof value === "string") {
        return value;
    }
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
    return String(value);
}
/**
 * Promisified setTimeout for async/await usage.
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=utils.js.map