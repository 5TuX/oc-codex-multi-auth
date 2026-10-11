/**
 * Read a response body with a hard byte cap and a total timeout.
 *
 * `Response.text()` keeps pulling until the stream ends: a hostile or broken
 * upstream can make it buffer unboundedly (150MB bodies were observed) or
 * never finish (a slow drip defeats nothing — nothing was armed). This reader
 * stops at `maxBytes` or `timeoutMs`, cancels the rest of the stream so
 * backpressure reaches the socket, and returns whatever arrived — a
 * truncated body still feeds the downstream parsers/classifiers.
 *
 * Bodies that are not byte streams (test doubles, exotic implementations)
 * fall back to `text()` — still char-capped — since there is nothing to
 * cancel.
 */
export declare function readBoundedResponseText(response: Response, options?: {
    maxBytes?: number;
    timeoutMs?: number;
}): Promise<string>;
/**
 * Convert SSE stream response to JSON for generateText()
 * @param response - Fetch response with SSE stream
 * @param headers - Response headers
 * @param options - Optional `streamStallTimeoutMs` (floored at 1000ms,
 *   inter-chunk gap) and `maxStreamDurationMs` (floored at 1000ms, total
 *   post-headers deadline that a drip cannot keep resetting)
 * @returns Response with JSON body
 */
export declare function convertSseToJson(response: Response, headers: Headers, options?: {
    streamStallTimeoutMs?: number;
    maxStreamDurationMs?: number;
}): Promise<Response>;
/**
 * Ensure response has content-type header
 * @param headers - Response headers
 * @returns Headers with content-type set
 */
export declare function ensureContentType(headers: Headers): Headers;
/**
 * Check if a non-streaming response is empty or malformed.
 * Returns true if the response body is empty, null, or lacks meaningful content.
 * @param body - Parsed JSON body from the response
 * @returns True if response should be considered empty/malformed
 */
export declare function isEmptyResponse(body: unknown): boolean;
