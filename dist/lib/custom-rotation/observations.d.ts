import type { AccountMetadataV3 } from "../storage.js";
import { type UsagePayload } from "../codex-usage.js";
import type { RotationAccount, RotationObservation } from "./contract.js";
type Identity = Pick<AccountMetadataV3, "accountId" | "accountUserId" | "organizationId" | "refreshToken" | "lastUsed" | "accessToken" | "addedAt">;
export declare function rotationAccountId(account: Identity, scope: string): string;
export declare function unknownObservation<T>(): RotationObservation<T>;
export declare function emptyRotationAccount(id: string, lastUsed?: number): RotationAccount;
export declare class RotationObservations {
    private readonly accounts;
    snapshot(account: Identity, scope: string, now: number): RotationAccount;
    private field;
    private window;
    usage(account: Identity, scope: string, payload: UsagePayload, now: number): void;
    headers(account: Identity, scope: string, headers: Headers, now: number): void;
    resets(account: Identity, scope: string, count: number, now: number): void;
    retain(ids: ReadonlySet<string>): void;
    clear(): void;
}
export {};
