import { type QuotaNotificationsConfig } from "./config.js";
import { type QuotaDisplayMode } from "./quota-display.js";
import { type CodexUsageSummary } from "./codex-usage.js";
import { type DesktopNotifier } from "./desktop-notifications.js";
import { type QuotaNotificationState, type QuotaWindowNotificationState } from "./quota-notification-state.js";
import { type AccountMetadataV3, type AccountStorageV3 } from "./storage.js";
export type QuotaWindowName = "fiveHour" | "weekly";
export interface AggregatedQuotaWindow {
    /** Headroom of the enabled account with the most room left in this window. */
    remainingPercent?: number;
    /**
     * Reset time of the account `remainingPercent` was taken from. Always the
     * same account, so the pair describes a quota one account actually has.
     */
    resetAtMs?: number;
    /**
     * Earliest reset across every enabled account with usable usage, set only
     * when some other account recovers before {@link resetAtMs}. Reported as its
     * own value rather than folded into `resetAtMs`, because a max-percent /
     * min-reset pair describes a quota no account holds.
     */
    earliestResetAtMs?: number;
}
export interface AggregatedQuotaUsage {
    fiveHour: AggregatedQuotaWindow;
    weekly: AggregatedQuotaWindow;
}
export interface QuotaThresholdCrossing {
    window: QuotaWindowName;
    threshold: number;
    remainingPercent: number;
    /** Reset of the account `remainingPercent` came from; never a different one. */
    resetAtMs?: number;
    /** Earliest reset in the pool, when it is not `resetAtMs`. */
    earliestResetAtMs?: number;
}
export interface AccountQuotaSummary {
    usage: CodexUsageSummary;
}
export interface QuotaMonitor {
    start(): void;
    dispose(): void;
    runNow(): Promise<void>;
}
type MonitorDependencies = {
    loadConfig: () => QuotaNotificationsConfig;
    loadStorage: () => Promise<AccountStorageV3 | null>;
    fetchSummary: (storage: AccountStorageV3, account: AccountMetadataV3 | undefined, onCredentialsPersisted: () => void, autoProtectCredits: boolean, autoRedeemBelowPercent?: number) => Promise<AccountQuotaSummary | null>;
    notify: DesktopNotifier;
    notificationsSupported: () => boolean;
    /**
     * Called once per check when refreshing an account rotated its single-use
     * refresh token to disk. The host wires this to its account-manager cache
     * invalidation; see {@link fetchUsageForAccount} for why it is mandatory.
     */
    onCredentialsPersisted: () => void;
    now: () => number;
    initialDelayMs: number;
};
export declare function aggregateQuotaUsage(summaries: readonly AccountQuotaSummary[], now?: number): AggregatedQuotaUsage;
/**
 * Decide whether this observation crosses a threshold downward.
 *
 * A threshold fires when the window is at or below it *and* the previous
 * observation was strictly above it, which is the "rises above it after a
 * reset" contract in `docs/configuration.md`. The most severe matching
 * threshold wins, and the selection does not assume `thresholds` is sorted.
 */
export declare function transitionQuotaWindow(previous: QuotaWindowNotificationState, current: AggregatedQuotaWindow, thresholds: readonly number[]): {
    state: QuotaWindowNotificationState;
    threshold?: number;
};
export declare function transitionQuotaState(previous: QuotaNotificationState | undefined, usage: AggregatedQuotaUsage, thresholds: readonly number[], now?: number): {
    state: QuotaNotificationState;
    crossings: QuotaThresholdCrossing[];
};
export declare function formatQuotaNotification(usage: AggregatedQuotaUsage, mode?: QuotaDisplayMode): string;
export declare function createQuotaMonitor(overrides?: Partial<MonitorDependencies>): QuotaMonitor;
export {};
