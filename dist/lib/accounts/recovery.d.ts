/**
 * Recovery + hydration surface for {@link AccountManager}.
 *
 * Covers:
 *  - auth-failure counter bookkeeping (per refresh token, serialized)
 *  - cross-process hydration from the Codex CLI `~/.codex/accounts.json`
 *  - merge-safe removal of all accounts sharing a refresh token
 */
import type { AccountPersistence } from "./persistence.js";
import { type AccountState, type ManagedAccount } from "./state.js";
export type CodexCliTokenCacheEntry = {
    accessToken: string;
    expiresAt?: number;
    refreshToken?: string;
    accountId?: string;
};
export declare function setCodexCliTokenCacheForTests(cache: Map<string, CodexCliTokenCacheEntry> | null | undefined): void;
export declare function lookupCodexCliTokensByEmail(email: string | undefined): Promise<CodexCliTokenCacheEntry | null>;
export declare class AccountRecovery {
    private readonly state;
    private readonly persistence;
    constructor(state: AccountState, persistence: AccountPersistence);
    hydrateFromCodexCli(): Promise<void>;
    /**
     * Atomically increment the auth-failure counter for the account's refresh
     * token and return the post-increment value.
     *
     * The read-modify-write is serialized through a per-refresh-token promise
     * chain so that concurrent callers (for example, two org-variant accounts
     * sharing a refresh token that fail auth simultaneously) cannot lose an
     * increment. Without serialization both callers could read the same stale
     * value, both compute `+1`, and both write the same result — masking a hard
     * auth failure and causing the manager to keep hammering a dead token.
     *
     * Callers must `await` the returned promise before branching on the
     * threshold (see `index.ts` auth-refresh failure path).
     */
    incrementAuthFailures(account: ManagedAccount): Promise<number>;
    /**
     * Return the current auth-failure counter for the account's refresh token
     * without mutating state. Intended for tests and diagnostics.
     */
    getAuthFailures(account: ManagedAccount): number;
    /**
     * Clear the authentication failure counter for the given account's refresh token.
     *
     * Notes:
     * - Failure counts are tracked per refresh token (not per account), so this clears
     *   shared failure state for all org variants that reuse the same token.
     * - Failure counts are in-memory only for the current AccountManager instance.
     */
    clearAuthFailures(account: ManagedAccount): void;
    /**
     * Keep credentials available for re-login when a shared refresh token fails.
     * The disable carries the plugin's own attribution note: a bare
     * `enabled: false` reads as operator intent everywhere (load/repair paths,
     * status, doctor), which made auto-disabled accounts indistinguishable
     * from deliberate ones (#288).
     */
    disableAccountsWithSameRefreshToken(account: ManagedAccount): number;
    /** Leave other workspaces that share this refresh token enabled. */
    disableAccountsByWorkspaceIdentity(account: ManagedAccount): number;
    /**
     * Remove all accounts that share the same refreshToken as the given account.
     * Explicit removal helper; automatic auth failures disable accounts instead.
     * @returns Number of accounts removed
     */
    removeAccountsWithSameRefreshToken(account: ManagedAccount): number;
    /**
     * Remove only the account(s) matching the given account's WORKSPACE identity
     * (org/account id), not every sibling that merely shares its refresh token.
     *
     * A single multi-org OAuth login produces several ManagedAccounts that share
     * one refresh token but represent distinct, independently-valid workspaces.
     * When ONE workspace is deactivated, removing all refresh-token siblings would
     * silently drop the still-valid workspaces from rotation. This scopes removal
     * to the deactivated workspace only.
     *
     * @returns Number of accounts removed
     */
    removeAccountsByWorkspaceIdentity(account: ManagedAccount): number;
}
