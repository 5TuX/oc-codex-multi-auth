/** Stable model-pool identities for individual ChatGPT accounts and Business seats. */
export type ModelPoolAccount = {
    accountId?: string;
    accountUserId?: string;
    /** Stored records expose `accessToken`; live `ManagedAccount`s expose `access`. */
    accessToken?: string;
    access?: string;
};
/** True when a stored pool entry is already a member-scoped seat key. */
export declare function isSeatPoolKey(key: string): boolean;
export declare function getModelPoolAccountKey(account: ModelPoolAccount): string | undefined;
export declare function matchesModelPoolAccountKey(account: ModelPoolAccount, key: string): boolean;
export declare function expandLegacyModelPoolKeys(keys: readonly string[], accounts: readonly ModelPoolAccount[]): string[];
