import { ensureCodexUsageAccessToken, fetchCodexUsage } from "../codex-usage.js";
import { fetchCodexResetCredits } from "../codex-reset.js";
import { type AccountStorageV3 } from "../storage.js";
import { RotationObservations } from "./observations.js";
type Dependencies = {
    readonly enabled: () => boolean;
    readonly load: () => Promise<AccountStorageV3 | null>;
    readonly scope: () => string;
    readonly now: () => number;
    readonly onCredentialsPersisted: () => void;
    readonly usage: typeof fetchCodexUsage;
    readonly resets: typeof fetchCodexResetCredits;
    readonly credentials: typeof ensureCodexUsageAccessToken;
};
export type RotationMonitor = {
    readonly observations: RotationObservations;
    readonly signal: AbortSignal;
    runNow(): Promise<void>;
    dispose(): void;
    start(): void;
    refresh(): void;
};
export declare function createRotationMonitor(overrides?: Partial<Dependencies>): RotationMonitor;
export {};
