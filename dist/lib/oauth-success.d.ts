export declare function renderOAuthSuccessHtml(styleNonce: string): string;
/**
 * OAuth callback error page, rendered for non-success callback responses
 * (state mismatch, missing code, handler failure). A bare text 400 was a
 * dead end that left users staring at "State mismatch" with no recovery path;
 * this keeps the same CSP posture as the success page (nonce'd style, no
 * scripts) and tells the user to return to the terminal and restart login.
 */
export declare function renderOAuthErrorHtml(styleNonce: string, heading: string, detail: string): string;
export declare const oauthSuccessHtml: string;
