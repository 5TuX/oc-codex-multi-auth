import type { QuotaOverviewAccount, QuotaOverviewRecovery } from "./quota-overview.js";
export declare function resolveNextQuotaRecovery(accounts: readonly QuotaOverviewAccount[], now: number): QuotaOverviewRecovery | undefined;
/** Simulate known ordinary windows once; deltas telescope rather than repeating cumulative gains. */
export declare function resolveQuotaRecoveryEvents(accounts: readonly QuotaOverviewAccount[], now?: number): QuotaOverviewRecovery[];
