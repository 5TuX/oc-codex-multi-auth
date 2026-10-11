/**
 * Context Overflow Handler
 *
 * Handles "Prompt too long" / context length exceeded errors by returning
 * a synthetic SSE response that advises the user to use /compact or /clear.
 * This prevents the OpenCode session from getting locked on 400 errors.
 */
/**
 * Check if an error body indicates context overflow
 */
export declare function isContextOverflowError(status: number, bodyText: string): boolean;
/**
 * Creates a synthetic SSE response for context overflow errors.
 * This returns a 200 OK with the error message as assistant text,
 * preventing the session from getting locked.
 */
export declare function createContextOverflowResponse(model?: string): Response;
/**
 * Check response for context overflow and return synthetic response if needed
 */
export declare function handleContextOverflow(response: Response, model?: string): Promise<{
    handled: true;
    response: Response;
} | {
    handled: false;
}>;
