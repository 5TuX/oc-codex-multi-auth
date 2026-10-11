import type { TokenResult } from "../types.js";
import type { AccountMetadataV3 } from "./migrations.js";
export type PersistedRefreshIdentity = Pick<AccountMetadataV3, "organizationId" | "accountId" | "accountUserId" | "refreshToken">;
export type CoordinatedRefreshSuccess = Extract<TokenResult, {
    type: "success";
}> & {
    readonly adopted: boolean;
    readonly rotatedAt?: number;
};
export type CoordinatedRefreshResult = CoordinatedRefreshSuccess | Exclude<TokenResult, {
    type: "success";
}>;
export declare function coordinatePersistedRefresh(identity: PersistedRefreshIdentity): Promise<CoordinatedRefreshResult>;
export declare function coordinateFlaggedPersistedRefresh(identity: PersistedRefreshIdentity): Promise<CoordinatedRefreshResult>;
