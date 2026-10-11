/**
 * Multi-worktree collision detection for per-project account storage.
 *
 * Problem: when multiple OpenCode sessions (tabs, IDE windows, detached
 * worktrees, or CI runs) point at the same per-project accounts file, their
 * writes can interleave and lose rotation updates, health-score changes, or
 * rate-limit state. The in-process `withStorageLock` mutex solves intra-process
 * races but cannot see another Node process mutating the same file.
 *
 * Strategy: sidecar lock file at `<storage>.lock`. Every `loadAccounts` /
 * `saveAccounts` call verifies ownership:
 *
 *   - No lock on disk -> write our own, proceed.
 *   - Lock owned by us (same pid + hostname) -> refresh `lastActive`, proceed.
 *   - Foreign lock with dead owner (same host, pid gone) -> take over.
 *   - Foreign lock stale (`lastActive` older than STALE_THRESHOLD_MS) -> take
 *     over. Required because a prior process that SIGKILL'd never released
 *     its lock, so "dead pid" detection alone leaks locks on long-lived hosts.
 *   - Foreign lock live -> surface a WARNING to the logger identifying both
 *     worktrees and proceed anyway. The locking contract here is advisory
 *     (Phase 4 F2 audit recommendation): blocking would strand the user when
 *     two legitimate sessions share a project, so we prefer visibility over
 *     enforcement.
 *
 * Cross-host note: we cannot probe a PID on a different machine, so a lock
 * written from another hostname is always treated as live until its
 * `lastActive` timestamp ages past STALE_THRESHOLD_MS. This is conservative
 * but matches the audit requirement to "not block" — the worst case is a
 * warning the user can dismiss.
 *
 * Guards against two worktrees of the same repository racing on one
 * account file.
 */
/**
 * Time after which a lock whose owner never refreshed it is considered
 * abandoned, regardless of PID liveness. One hour matches the roadmap spec
 * and is long enough to avoid stealing a lock from a session that is merely
 * idle between saves.
 */
export declare const STALE_THRESHOLD_MS: number;
/**
 * Persisted lock-file payload. Written as pretty-printed JSON so a human
 * inspecting the file can immediately tell which worktree holds the lock.
 */
export interface WorktreeLockInfo {
    pid: number;
    hostname: string;
    cwd: string;
    startedAt: string;
    lastActive: string;
}
export interface AcquireLockResult {
    /** True when we now own the lock on disk. */
    acquired: boolean;
    /** Populated only when a foreign live lock was detected. */
    foreign?: WorktreeLockInfo;
}
/**
 * Checks ownership of the worktree lock and acquires it when possible.
 *
 * Contract:
 *   - Never throws on lock I/O errors *other than* propagating read/write
 *     failures the caller needs to know about (disk full, EACCES).
 *   - Always returns a discriminated result: either `acquired: true` (we
 *     now own or refreshed the lock) or `acquired: false` with `foreign`
 *     populated (another live worktree owns it; caller should warn).
 *   - Never blocks. This is advisory locking by design.
 */
export declare function acquireOrDetectLock(storagePath: string): Promise<AcquireLockResult>;
export declare function releaseLock(storagePath: string): Promise<void>;
/**
 * Test-only reset hook. Vitest reuses a single Node process across files,
 * so `ownedLockPaths` state would leak between suites and confuse the
 * "no lock on disk" acquire branch. Not re-exported from the barrel.
 */
export declare function __resetWorktreeLockForTests(): void;
/** Test-only: inspect owned paths without exposing the internal Set. */
export declare function __getOwnedLockPathsForTests(): readonly string[];
