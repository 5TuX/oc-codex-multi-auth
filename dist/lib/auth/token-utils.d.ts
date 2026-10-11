/**
 * Token utility functions for JWT parsing and account ID extraction.
 * Extracted from accounts.ts to reduce module size and improve cohesion.
 */
import type { AccountIdSource } from "../types.js";
/**
 * Account ID candidate from token or organization data.
 */
export interface AccountIdCandidate {
    accountId: string;
    organizationId?: string;
    label: string;
    source: AccountIdSource;
    isDefault?: boolean;
    isPersonal?: boolean;
}
/**
 * Whether a stored label may be replaced by a login.
 *
 * A blank label counts as generated so an account that never had one can pick
 * one up. Anything that does not carry the `[id:…]` marker is treated as a
 * name a user chose and is left alone.
 */
export declare function isGeneratedAccountLabel(label: string | undefined): boolean;
/**
 * Whether a stored label is one this plugin generated for *this* account.
 *
 * {@link isGeneratedAccountLabel} answers a softer question - may a login
 * replace this label - and deliberately treats any trailing `[id:…]` as
 * generated, because the worst case there is that a login overwrites a name
 * with a fresh one. Deleting a label outright is not reversible, and
 * `codex-label` accepts any string, so `Work [id:mine]` is a name someone is
 * allowed to have typed.
 *
 * Every generator here emits the account's own id suffix in that marker, so
 * the stricter test compares it against what this account's id would produce.
 * A label carrying an arbitrary word, someone else's suffix, or belonging to
 * an account with no stored id to compare against, is left alone.
 *
 * A user who types a label ending in their own real id suffix is
 * indistinguishable from the generator and loses it. Nothing in the stored
 * data separates those two cases; the alternative is deleting every
 * `[id:…]` label, which is the strictly worse trade.
 */
export declare function isStaleGeneratedAccountLabel(label: string | undefined, accountId: string | undefined): boolean;
/**
 * Select the best workspace candidate for OAuth account binding.
 * Preference order:
 * 1) org default that is not personal
 * 2) org default (any)
 * 3) id_token candidate
 * 4) non-personal org candidate
 * 5) token candidate
 * 6) first candidate
 */
export declare function selectBestAccountCandidate(candidates: AccountIdCandidate[]): AccountIdCandidate | undefined;
/**
 * Extracts the ChatGPT account ID from a JWT access token.
 * @param accessToken - JWT access token from OAuth flow
 * @returns Account ID string or undefined if not found
 */
export declare function extractAccountId(accessToken?: string): string | undefined;
/**
 * Extracts the account-scoped ChatGPT user id from an access token.
 *
 * Business workspace members share `chatgpt_account_id`, but each seat has a
 * distinct `chatgpt_account_user_id`. Keeping both values prevents the last
 * OAuth login for a workspace from replacing every member's credential.
 */
export declare function extractAccountUserId(accessToken?: string): string | undefined;
/**
 * Extracts the email address from OAuth tokens.
 * Checks id_token first (where OpenAI puts email), then falls back to access_token.
 */
export declare function extractAccountEmail(accessToken?: string, idToken?: string): string | undefined;
/**
 * Extracts all accountId candidates from access/id tokens.
 * Used to support business workspaces/organizations that are not the token default.
 */
export declare function getAccountIdCandidates(accessToken?: string, idToken?: string): AccountIdCandidate[];
/**
 * Determines if accountId should be updated from a token-derived value.
 * We keep org/manual selections stable across refreshes.
 */
export declare function shouldUpdateAccountIdFromToken(source: AccountIdSource | undefined, currentAccountId?: string): boolean;
/**
 * Resolve which accountId to use for runtime API calls.
 * Preserves explicit org/manual selections; only token/id_token sources auto-follow token changes.
 */
export declare function resolveRequestAccountId(storedAccountId: string | undefined, source: AccountIdSource | undefined, tokenAccountId: string | undefined): string | undefined;
/**
 * Sanitizes an email address by stripping control characters, trimming
 * whitespace, and lowercasing.
 * @param email - Email string to sanitize
 * @returns Sanitized email or undefined if invalid
 */
export declare function sanitizeEmail(email: string | undefined): string | undefined;
