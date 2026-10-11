export declare const REQUIRED_OAUTH_SCOPES: readonly ["openid", "profile", "email", "offline_access"];
export declare const SCOPE: string;
/**
 * Canonicalizes a raw scope string: trims, collapses whitespace, drops
 * duplicates, and returns `undefined` when nothing is left. Blank and absent
 * scope must be indistinguishable, because an empty string that survives into
 * storage overwrites known-good metadata through `scope ?? existing` chains
 * (issue #213).
 */
export declare function normalizeScope(scope: string | undefined): string | undefined;
export declare function getMissingRequiredOAuthScopes(scope: string | undefined): string[];
export declare function hasRequiredOAuthScopes(scope: string | undefined): boolean;
