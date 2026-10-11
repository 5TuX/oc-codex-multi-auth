/**
 * Read the host's own `openai` OAuth credential from OpenCode's auth store.
 *
 * The plugin backfills that entry from the account pool (see
 * `backfillHostOpenAIAuthFromPool` in index.ts) and the host refreshes its
 * copy independently — so it can serve requests entirely outside pool
 * rotation, including while every pool account is disabled. Diagnostics
 * surface its presence so "traffic works but the pool says disabled" is
 * explainable instead of a paradox (#288).
 */
export interface HostOAuthEntry {
    access: string;
    refresh: string;
    expires: number;
    scope?: string;
}
export declare function hostAuthFilePath(): string;
export declare function readHostOpenAIOAuth(providerId?: string): Promise<HostOAuthEntry | null>;
