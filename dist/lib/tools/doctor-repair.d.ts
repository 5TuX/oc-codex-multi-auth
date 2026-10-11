import { type AccountMetadataV3 } from "../storage.js";
import { type RefreshAccountIdentity } from "./refresh-account.js";
export declare function repairDoctorAccounts(accounts: AccountMetadataV3[]): Promise<{
    refreshedCount: number;
    verificationFailureIdentities: RefreshAccountIdentity[];
    reloginNeeded: number[];
    appliedFixes: string[];
    fixErrors: string[];
}>;
