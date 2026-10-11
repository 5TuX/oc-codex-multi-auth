/**
 * Consolidated utility functions for the Codex plugin.
 * Extracted from various modules to eliminate duplication.
 */
/**
 * Type guard for plain objects (not arrays, not null).
 * @param value - The value to check
 * @returns True if value is a plain object
 */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
/**
 * Returns the current timestamp in milliseconds.
 * Wrapper for Date.now() to enable testing with mocked time.
 * @returns Current time in milliseconds since epoch
 */
export declare function nowMs(): number;
/**
 * Safely converts any value to a string representation.
 * @param value - The value to convert
 * @returns String representation of the value
 */
export declare function toStringValue(value: unknown): string;
/**
 * Promisified setTimeout for async/await usage.
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export declare function sleep(ms: number): Promise<void>;
