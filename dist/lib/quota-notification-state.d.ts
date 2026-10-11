export interface QuotaWindowNotificationState {
    /**
     * The remaining-percent reading this window was last seen at. It is the
     * only per-window state: which threshold is "armed" is derived from it, so
     * storing that separately would let a corrupt extra field invalidate an
     * otherwise usable file.
     */
    lastPercent?: number;
}
export interface QuotaNotificationState {
    fiveHour: QuotaWindowNotificationState;
    weekly: QuotaWindowNotificationState;
    lastDeliveredAt?: number;
    updatedAt: number;
}
export declare function getQuotaNotificationStatePath(activeProjectStoragePath: string): string;
export declare function readQuotaNotificationState(statePath: string): Promise<QuotaNotificationState | undefined>;
export declare function updateQuotaNotificationState<T>(statePath: string, update: (state: QuotaNotificationState | undefined) => Promise<{
    state: QuotaNotificationState;
    result: T;
}> | {
    state: QuotaNotificationState;
    result: T;
}): Promise<T>;
