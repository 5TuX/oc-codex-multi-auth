/**
 * Proactive Token Refresh Module
 *
 * Refreshes OAuth tokens before they expire to prevent auth failures mid-request.
 * Default buffer: 5 minutes before expiry (configurable via tokenRefreshSkewMs).
 *
 * This is a production hardening feature that:
 * - Reduces mid-request auth failures
 * - Improves user experience with seamless token rotation
 * - Works alongside the existing reactive refresh in fetch-helpers
 */
import type { ManagedAccount } from "./accounts.js";
import type { TokenResult } from "./types.js";
/** Default buffer before expiry to trigger proactive refresh (5 minutes) */
export declare const DEFAULT_PROACTIVE_BUFFER_MS: number;
/** Minimum buffer to prevent unnecessary refreshes (30 seconds) */
export declare const MIN_PROACTIVE_BUFFER_MS: number;
/**
 * Result of a proactive refresh operation.
 */
export interface ProactiveRefreshResult {
    refreshed: boolean;
    tokenResult?: TokenResult;
    reason: "not_needed" | "no_refresh_token" | "success" | "failed" | "exception";
    errorMessage?: string;
}
/**
 * Determines if an account's token should be proactively refreshed.
 *
 * @param account - The managed account to check
 * @param bufferMs - Time buffer before expiry to trigger refresh (default: 5 minutes)
 * @returns True if token is approaching expiry and should be refreshed
 */
export declare function shouldRefreshProactively(account: ManagedAccount, bufferMs?: number): boolean;
/**
 * Calculates milliseconds until an account's token expires.
 *
 * @param account - The managed account to check
 * @returns Milliseconds until expiry, or Infinity if no expiry set
 */
export declare function getTimeUntilExpiry(account: ManagedAccount): number;
/**
 * Proactively refreshes an account's token if it's approaching expiry.
 *
 * @param account - The managed account to refresh
 * @param bufferMs - Time buffer before expiry to trigger refresh
 * @returns Result indicating whether refresh was performed and outcome
 */
export declare function proactiveRefreshAccount(account: ManagedAccount, bufferMs?: number): Promise<ProactiveRefreshResult>;
/**
 * Refreshes all accounts that are approaching token expiry.
 *
 * @param accounts - Array of managed accounts to check
 * @param bufferMs - Time buffer before expiry to trigger refresh
 * @returns Map of account index to refresh result
 */
export declare function refreshExpiringAccounts(accounts: ManagedAccount[], bufferMs?: number): Promise<Map<number, ProactiveRefreshResult>>;
/**
 * Updates a ManagedAccount with fresh token data from a successful refresh.
 *
 * @param account - The account to update
 * @param result - Successful token refresh result
 */
export declare function applyRefreshResult(account: ManagedAccount, result: Extract<TokenResult, {
    type: "success";
}>): void;
