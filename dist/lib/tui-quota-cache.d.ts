import type { CreditsBalance } from "./codex-credits.js";
import type { CompactQuotaLimit } from "./tui-status.js";
export declare const TUI_QUOTA_CACHE_VERSION = 1;
export declare const TUI_QUOTA_CACHE_FILE = "oc-codex-multi-auth-tui-quota.json";
export declare const TUI_QUOTA_OVERVIEW_CACHE_FILE = "oc-codex-multi-auth-tui-quota-overview.json";
export declare const TUI_QUOTA_SNAPSHOT_FRESH_MS: number;
export type TuiQuotaSource = "headers" | "usage";
export type TuiQuotaLimit = CompactQuotaLimit & {
    usedPercent?: number;
    windowMinutes?: number;
    resetAtMs?: number;
};
export type TuiQuotaSnapshot = {
    version: typeof TUI_QUOTA_CACHE_VERSION;
    fingerprint: string;
    fetchedAt: number;
    source: TuiQuotaSource;
    accountIndex?: number;
    accountCount?: number;
    accountEmail?: string;
    accountLabel?: string;
    planType?: string;
    activeLimit?: number;
    limits: TuiQuotaLimit[];
};
export type TuiQuotaSnapshotInput = Omit<TuiQuotaSnapshot, "version" | "fetchedAt"> & {
    fetchedAt?: number;
};
export declare function getTuiQuotaCachePath(stateDir?: string): string;
export declare function getTuiQuotaOverviewCachePath(stateDir?: string): string;
/**
 * A window OpenAI reports with `window-minutes: 0` is switched off for the
 * plan, not a window of unknown length. Such a window still carries
 * `used-percent: 0`, so it must be recognized by the explicit zero rather than
 * by the absence of data — otherwise it renders as a full `quota 100%` segment.
 * A window whose header is absent entirely stays eligible: that is an unknown
 * window, and it is still shown under the generic `quota` label.
 */
export declare function isDisabledQuotaLimit(limit: TuiQuotaLimit): boolean;
export declare function createTuiQuotaSnapshot(input: TuiQuotaSnapshotInput): TuiQuotaSnapshot;
export declare function parseTuiQuotaSnapshotFromHeaders(headers: Headers, input: Omit<TuiQuotaSnapshotInput, "source" | "limits">): TuiQuotaSnapshot | undefined;
export declare function isTuiQuotaSnapshot(value: unknown): value is TuiQuotaSnapshot;
/**
 * Drop disabled windows from a snapshot read back from disk.
 *
 * A cache written by an older build can still hold a `windowMinutes: 0` entry.
 * Filtering on read lets those snapshots heal without the user deleting the
 * cache file, and keeps a stale-cache render consistent with a fresh one.
 */
export declare function sanitizeTuiQuotaSnapshot(snapshot: TuiQuotaSnapshot): TuiQuotaSnapshot;
/**
 * Whether a snapshot is recent enough to render as current (`stale=false`)
 * without re-querying `/wham/usage`. A future `fetchedAt` (clock skew between
 * the writing and reading process) counts as fresh rather than poisoning the
 * cache until the skew elapses.
 */
export declare function isFreshTuiQuotaSnapshot(snapshot: Pick<TuiQuotaSnapshot, "fetchedAt">, now?: number): boolean;
export declare function readTuiQuotaSnapshot(cachePath?: string): Promise<TuiQuotaSnapshot | undefined>;
export declare function writeTuiQuotaSnapshot(snapshot: TuiQuotaSnapshot, cachePath?: string): Promise<void>;
export declare function clearTuiQuotaSnapshot(cachePath?: string): Promise<void>;
export type TuiQuotaOverviewAccount = {
    fingerprint: string;
    /** 1-based, matching how `codex-list` and `codex-switch` number accounts. */
    index: number;
    /** ChatGPT email, for the surfaces that name an account rather than number it. */
    email?: string;
    /** `codex-label` label when one is set, else whatever identity storage has. */
    label?: string;
    planType?: string;
    /** Banked rate-limit resets redeemable now. */
    resetCredits?: number;
    resetCreditsApplicable?: number | null;
    /** Codex credit balance, present only when the account has some to spend. */
    credits?: CreditsBalance;
    limits: TuiQuotaLimit[];
    /**
     * When this account was read. The snapshot's own `fetchedAt` is its oldest
     * reading, so one account carried over from a failed poll would otherwise
     * date every other, fresher account with it. Absent in a snapshot an older
     * build wrote, where the snapshot's time is all there is.
     */
    fetchedAt?: number;
    /**
     * Set while the poller cannot read this account because its credentials
     * are dead, and keeps its previous reading instead: when the latest such
     * read failed, when they started failing, and why. The reading then
     * describes the account as it was at `fetchedAt`, not as it is - a dead
     * refresh token keeps failing, and its last reading would otherwise pass
     * for a healthy, idle seat. A transient failure (timeout, network, 429,
     * 5xx) sets none of these.
     */
    readFailedAt?: number;
    readFailedSince?: number;
    readError?: string;
};
/**
 * The pool-wide quota snapshot, held apart from the single-account one.
 *
 * The two are written on different schedules by different code paths - the
 * request path pushes one account per response, while the pool is polled - and
 * folding them into one file would make every request rewrite a document
 * describing accounts that request never touched. A separate file also leaves
 * the existing snapshot's shape, validator and tests untouched, so a build
 * that has never heard of the overview reads its own cache unchanged.
 */
export type TuiQuotaOverviewSnapshot = {
    version: typeof TUI_QUOTA_CACHE_VERSION;
    fetchedAt: number;
    accounts: TuiQuotaOverviewAccount[];
};
export declare function isTuiQuotaOverviewSnapshot(value: unknown): value is TuiQuotaOverviewSnapshot;
/** Drop disabled windows, for the reasons in {@link sanitizeTuiQuotaSnapshot}. */
export declare function sanitizeTuiQuotaOverviewSnapshot(snapshot: TuiQuotaOverviewSnapshot): TuiQuotaOverviewSnapshot;
export declare function readTuiQuotaOverviewSnapshot(cachePath?: string): Promise<TuiQuotaOverviewSnapshot | undefined>;
export declare function writeTuiQuotaOverviewSnapshot(snapshot: TuiQuotaOverviewSnapshot, cachePath?: string): Promise<void>;
