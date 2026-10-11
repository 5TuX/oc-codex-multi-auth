/**
 * Gather every account's quota for the pool-wide status line.
 *
 * The single-account status the request path maintains cannot answer "where
 * does the pool stand" - it only ever describes the account that served the
 * last response. This reads `/wham/usage` for each distinct account instead,
 * on a bounded interval, and caches the result where every OpenCode window on
 * the machine can share it.
 *
 * The cache is what keeps this cheap. A reader takes a snapshot that is still
 * fresh rather than issuing its own requests, so N terminals open on the same
 * pool cost one round of requests between them rather than N, and a terminal
 * that has just started renders immediately instead of showing nothing while
 * seven accounts are queried one after another.
 */
import { type CodexUsageSummary } from "./codex-usage.js";
import type { QuotaOverviewAccount } from "./quota-overview.js";
import { type AccountStorageV3 } from "./storage.js";
import { type TuiQuotaOverviewAccount, type TuiQuotaOverviewSnapshot, type TuiQuotaSnapshot } from "./tui-quota-cache.js";
/**
 * Reduce one account's usage document to what the status line needs.
 *
 * Only the primary and secondary windows are kept. Code-review and the other
 * additional quotas do not govern ordinary model requests, so counting them
 * would let a spent code-review allowance report an account as unusable for
 * work it can still do.
 */
export declare function toOverviewAccount(params: {
    fingerprint: string;
    index: number;
    usage: CodexUsageSummary;
    email?: string;
    label?: string;
}): TuiQuotaOverviewAccount;
export declare function fetchTuiQuotaOverview(params: {
    cachePath?: string;
    now?: number;
    loadStorage?: () => Promise<AccountStorageV3 | null>;
}): Promise<TuiQuotaOverviewSnapshot | undefined>;
/**
 * Fold the request path's live reading of one account into the polled pool.
 *
 * The pool is re-read on an interval, but the account currently serving
 * requests has its quota pushed from response headers after every single
 * response. Without this the line would show that account's numbers as they
 * were up to five minutes ago while the user watches their own requests spend
 * it - the one account whose figure a reader can check against their own
 * activity would be the one that looks wrong.
 *
 * Only a snapshot NEWER than the poll is merged, so a header reading left over
 * from before the poll cannot overwrite it with older numbers.
 */
export declare function mergeOverviewWithLatestAccount(snapshot: TuiQuotaOverviewSnapshot, latest: TuiQuotaSnapshot | undefined): TuiQuotaOverviewSnapshot;
export declare function toQuotaOverviewAccounts(snapshot: TuiQuotaOverviewSnapshot): QuotaOverviewAccount[];
