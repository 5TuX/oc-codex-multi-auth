import type { TokenResult } from "../types.js";
export interface DeviceCodeSession {
    verificationUrl: string;
    userCode: string;
    deviceAuthId: string;
    intervalSeconds: number;
}
type DeviceCodeReadyResult = {
    type: "ready";
    session: DeviceCodeSession;
};
type DeviceCodeFailureResult = {
    type: "failed";
    failure: Extract<TokenResult, {
        type: "failed";
    }>;
};
export declare function buildDeviceCodeInstructions(session: DeviceCodeSession): string;
export declare function createDeviceCodeSession(options?: {
    authBaseUrl?: string;
    clientId?: string;
}): Promise<DeviceCodeReadyResult | DeviceCodeFailureResult>;
export declare function completeDeviceCodeSession(session: DeviceCodeSession, options?: {
    authBaseUrl?: string;
    maxWaitMs?: number;
}): Promise<TokenResult>;
export {};
