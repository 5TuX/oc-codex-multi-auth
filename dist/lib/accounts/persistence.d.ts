/**
 * Persistence surface for {@link AccountManager}: debounced disk saves,
 * pending-save coalescing, and shutdown-flush registration.
 *
 * All on-disk format concerns live in `lib/storage.ts`. This module owns the
 * *lifecycle* (when to save, how to flush before exit, how to dispose the
 * shutdown hook) rather than the serialization shape itself.
 */
import { type AccountMetadataV3 } from "../storage.js";
import { type AccountState, type ManagedAccount } from "./state.js";
export declare class AccountPersistence {
    private readonly state;
    private saveDebounceTimer;
    private pendingSave;
    private shutdownHandler;
    /**
     * Set by {@link disposeShutdownHandler}. From that point this manager has
     * been replaced, so its account list is no longer authoritative and every
     * further write degrades to {@link mergeVolatileState}.
     */
    private disposed;
    private readonly pendingDisabledAccounts;
    private externalReloadSnapshot?;
    constructor(state: AccountState);
    markAccountDisabled(account: ManagedAccount): void;
    saveToDisk(repairScopes?: boolean): Promise<void>;
    /**
     * Persist only the volatile rotation state this manager holds: rate-limit
     * blocks, cooldowns, and last-used stamps, each resolved to whichever side
     * runs longer or later.
     *
     * Account membership, credentials, and the active-index routing are taken
     * from `disk` untouched. That is what makes the write safe for a manager
     * that has already been replaced: a 429 recorded on it still reaches disk,
     * and it cannot delete an account its successor loaded or added.
     *
     * Live in-memory state is left alone for the same reason
     * {@link adoptLongerDiskRateLimits} leaves it alone: a missing block is
     * self-correcting from the next response's quota headers.
     */
    private mergeVolatileState;
    /**
     * Keep a `codex-doctor --fix` quota-stamp clear that landed on disk after
     * this process loaded its snapshot.
     *
     * The #218 monotonic merge is one-directional by design: it adopts longer
     * stamps so a stale process cannot wipe out a fresh week-long block, but
     * that same direction resurrects a stamp a doctor verification just
     * cleared — this process still holds the stamp in memory and writes it
     * back verbatim on its next save. The doctor clear cannot distinguish
     * "stale snapshot" from "new evidence" through values alone, so it dates
     * its clear (`quotaExhaustedClearedAt`) and every authoritative stamp
     * write dates itself (`quotaExhaustedStampAt`). A stamp at least as old
     * as the clear stays cleared; a newer stamp (real 429/poller evidence
     * recorded after the clear) wins and is kept.
     *
     * Stamps without provenance (`quotaExhaustedStampAt` undefined — written
     * by pre-upgrade builds or hand-edited files) are treated as predating
     * the clear, so the tombstone stays effective across mixed-version pools.
     * The cost of a wrongly-suppressed legacy stamp is one upstream 429 that
     * immediately re-stamps the account.
     */
    private applyDiskQuotaClearTombstones;
    /**
     * Merges still-active rate-limit blocks from `disk` into `outgoing`, keeping
     * whichever block runs longer per quota key.
     *
     * Rate-limit state is otherwise last-writer-wins, which is fine for a 5h
     * window that both processes rediscover within minutes. It is not fine for a
     * quota block: a second opencode process holding a stale snapshot would save
     * over the weekly block another process had just recorded, and the exhausted
     * account would be back in rotation after the next reload (issue #218).
     *
     * Only blocks still in the future are adopted, so an expired entry another
     * process has not pruned yet cannot be resurrected, and a block this process
     * deliberately cleared stays cleared once it has elapsed. `codex-doctor --fix`
     * is unaffected: it persists through its own storage transaction rather than
     * this method.
     *
     * Live in-memory state is intentionally left alone — unlike a consumed
     * refresh token, a missing block is self-correcting, since the very next
     * response re-applies it from the quota headers.
     */
    private adoptLongerDiskRateLimits;
    /**
     * Merges credentials from `disk` into `outgoing` (and the live in-memory
     * accounts) for every account whose on-disk refresh token differs and
     * carries a NEWER `tokenRotatedAt` stamp — i.e. another process rotated
     * the token after this process loaded its snapshot. Records without a
     * stamp (pre-upgrade files) keep this process's value, matching the old
     * behavior. Only credential fields are merged; rotation/health/rate-limit
     * state intentionally stays last-writer-wins.
     */
    private adoptNewerDiskCredentials;
    /**
     * A disposed manager still accepts saves. `index.ts` hands the request
     * pipeline a manager reference and swaps the cached instance underneath it,
     * so an in-flight request records its 429 block on the outgoing manager
     * after the reload has already flushed and disposed it. Refusing the write
     * there would lose the block entirely — the account would be handed straight
     * back to rotation for another 429. `saveToDisk` routes it through
     * {@link mergeVolatileState} instead, which is safe to run at any time.
     */
    saveToDiskDebounced(delayMs?: number): void;
    flushPendingSave(): Promise<void>;
    /**
     * Registers a process-shutdown cleanup that awaits any pending debounced
     * save. Without this, a rotation queued inside the 500ms debounce window
     * would be lost when SIGINT/SIGTERM fires before the timer resolves.
     * Registration is lazy (only when `saveToDiskDebounced` is first invoked)
     * so idle managers do not leak handlers into the shutdown queue.
     */
    private ensureShutdownFlushRegistered;
    /**
     * Tears down this manager's process-level side effects. Call this when
     * replacing an `AccountManager` instance (e.g., on cache invalidation) to
     * avoid unbounded growth of the global cleanup queue.
     *
     * From here on this manager's account list is no longer authoritative.
     * Although live saves now take membership from disk, the replaced manager
     * must not overwrite the successor's credentials or active selection.
     *
     * Neither the queued timer nor an already-started save is cancelled, which
     * would drop real state: the only save a cancel can still reach is one
     * armed *after* the caller's flush, and that is the fresh rate-limit or
     * cooldown block an in-flight request just recorded, not a stale rotation
     * stamp. Both paths are marked instead, and `saveToDisk` degrades them to
     * {@link mergeVolatileState}: the block lands, membership stays as the
     * successor left it. Marking rather than cancelling is also what covers the
     * save that had already begun by the time this ran, which a `clearTimeout`
     * cannot touch at all.
     *
     * The flag is set before the handler guard because the handler is one-shot —
     * it clears its own slot when it runs, so a manager whose shutdown flush has
     * already fired must still be marked here.
     */
    disposeShutdownHandler(externalReload?: boolean, clearedSnapshots?: readonly AccountMetadataV3[]): void;
}
