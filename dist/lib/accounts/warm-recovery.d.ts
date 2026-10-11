import { type AccountMetadataV3 } from "../storage.js";
export interface WarmRecoveryObservation {
    account: AccountMetadataV3;
    model: string;
    accessToken: string;
}
export declare function recoverWarmedAccount(observation: WarmRecoveryObservation, onCleared?: (snapshot: AccountMetadataV3) => void): Promise<boolean>;
