import type { QuotaOverviewAccount, QuotaOverviewWindow } from "./quota-overview.js";
export declare function resolveGoverningWindow(account: QuotaOverviewAccount): QuotaOverviewWindow | undefined;
export declare function computeWeightedLeftPercent(accounts: readonly QuotaOverviewAccount[], precision?: "rounded" | "exact"): number | undefined;
