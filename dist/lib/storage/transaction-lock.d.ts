import * as nodeFs from "node:fs";
export interface StorageTransactionLease {
    assertValid(): void;
}
export interface StorageTransactionOptions<Current, Persisted extends Current, Result> {
    readonly storagePath: string;
    readonly load: () => Promise<Current>;
    readonly persist: (storage: Persisted) => Promise<void>;
    readonly handler: (current: Current, persist: (storage: Persisted) => Promise<void>) => Promise<Result>;
}
export declare function getStorageTransactionLockPath(storagePath: string): string;
export declare function getRefreshLeasePath(storagePath: string): string;
/**
 * Self-verification state for one lease, maintained by the fs shim in
 * {@link leaseAwareFs} and consumed by {@link verifyLeaseHeld}.
 *
 * proper-lockfile detects a stolen lease only on its heartbeat timer: it
 * stats the lock dir, compares the mtime against the value it last wrote, and
 * flips `onCompromised` on a mismatch or a missing dir. On a stalled event
 * loop (sync busy work, a debugger pause, GC) that timer never runs, so a
 * holder whose lease was already stolen keeps believing it is valid — and
 * proceeds to overwrite the thief's committed work or re-spend a single-use
 * refresh token. The state below exists so `assertValid()` can instead
 * *synchronously* re-verify ownership on demand.
 */
interface LeaseOwnershipState {
    /**
     * Every mtime (integer ms) observed on our own lock dir: utimes values we
     * issued plus post-write stat results. A re-stat whose mtime is not in
     * this set means the dir was removed and re-created by someone else —
     * the lease was stolen — even if the heartbeat has not noticed yet.
     */
    readonly ownMtimesMs: Set<number>;
    /**
     * `Date.now()` when we last proved the lock dir still carries our mtime
     * (acquisition, heartbeat stat, heartbeat utimes). If this ages past the
     * stale window, the lease is *claimable* by contenders — whether or not a
     * steal has happened yet — so spending a single-use token on it is unsafe.
     */
    lastOwnershipProofAt: number;
    /**
     * mtime of the foreign lock dir most recently observed while contending —
     * the evidence a steal is based on. At removal time the dir must still
     * carry exactly this mtime; a different one means a fresh holder replaced
     * the stale dir between the staleness stat and the rmdir, and breaking it
     * would delete a live lease.
     */
    foreignMtimeMs: number | undefined;
    /**
     * True once this process's `mkdir` created the lock dir — the point at
     * which stats of the lock path start describing our own dir rather than
     * a foreign holder's.
     */
    created: boolean;
}
type LockFsCallback = (error: NodeJS.ErrnoException | null) => void;
interface LockFsShim {
    mkdir(path: string, callback: LockFsCallback): void;
    stat(path: string, callback: (error: NodeJS.ErrnoException | null, stats?: nodeFs.Stats) => void): void;
    rmdir(path: string, callback: LockFsCallback): void;
    utimes(path: string, atime: number | Date, mtime: number | Date, callback: LockFsCallback): void;
    rmdirSync(path: string): void;
    realpath(path: string, callback: (error: NodeJS.ErrnoException | null, resolved?: string) => void): void;
}
/**
 * An fs shim interposed between proper-lockfile and `node:fs`.
 *
 * Besides feeding {@link LeaseOwnershipState} it hardens two remove paths:
 *
 *  - **Stale-break (pre-acquire `rmdir`)**: re-verifies the dir synchronously —
 *    the mtime must still be exactly the one the staleness stat observed (a
 *    swapped-in fresh lockdir must never be deleted), and it must not lie in
 *    the future. A future mtime means the writer's clock ran ahead of ours, so
 *    our `mtime < now - stale` arithmetic is untrustworthy and the steal is
 *    refused as `ELOCKED` (retried, then surfaced as contention).
 *  - **Release/exit (`rmdir`/`rmdirSync`)**: refuses to remove a dir whose
 *    mtime is not one we wrote, so a compromised holder cannot delete the live
 *    lockdir of whichever process stole its lease.
 *
 * Both removal paths also recover `ENOTDIR`/`ENOTEMPTY` — a regular file or a
 * dir with foreign contents at the lock path cannot be `rmdir`'d; without the
 * `rm -rf` fallback a stray file at `*.transaction.lock` would brick every
 * future mutation on that store with a raw error.
 *
 * Residual risk, documented: if the *system* clock jumps forward across the
 * stale window, a contender sees a genuinely old stored mtime and the steal
 * cannot be distinguished from a dead holder — the holder-side
 * `assertValid()` re-verification is the backstop that keeps a stolen lease
 * from being used.
 */
declare function leaseAwareFs(lockPath: string, targetPath: string, state: LeaseOwnershipState): LockFsShim;
/**
 * Synchronously prove that the lease is still ours. Runs inside
 * `lease.assertValid()` — no timer, no microtask — so it works even on an
 * event loop the heartbeat cannot currently reach:
 *
 *  1. the lock dir must still exist on disk;
 *  2. its mtime must be one this process wrote (a recreated dir means a thief
 *     holds the lease now);
 *  3. our last ownership proof must be inside the stale window — past it, the
 *     lease is *claimable* whether or not anyone has claimed it yet.
 *
 * All failures surface as {@link StorageTransactionContentionError}, which
 * callers classify as retryable: aborting before spending a single-use token
 * is always cheaper than losing the exchange race.
 */
declare function verifyLeaseHeld(lockPath: string, reportPath: string, state: LeaseOwnershipState, staleMs: number, compromised: Error | undefined): void;
/**
 * Serialize a refresh-token exchange for one storage file across processes.
 *
 * The callback runs with NO storage lease held, so it is free to perform the
 * provider round trip and to open short storage transactions of its own for the
 * pre-check and the commit.
 */
export declare function withRefreshLease<T>(storagePath: string, operation: (lease: StorageTransactionLease) => Promise<T>): Promise<T>;
export declare function withStorageTransaction<Current, Persisted extends Current, Result>(options: StorageTransactionOptions<Current, Persisted, Result>): Promise<Result>;
/**
 * Internal seams exposed only to the `storage-lease-*` test suites so the
 * fs-shim guards (stale-break re-verification, foreign-dir release refusal,
 * malformed-lockpath recovery) can be exercised deterministically.
 */
export declare const __testOnly: {
    createOwnershipState(): LeaseOwnershipState;
    leaseAwareFs: typeof leaseAwareFs;
    verifyLeaseHeld: typeof verifyLeaseHeld;
};
export {};
