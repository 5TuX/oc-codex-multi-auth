/**
 * Low-level atomic-write primitives shared by account storage, flagged
 * storage, and pre-import backups.
 *
 * Split out of `lib/storage.ts` in RC-2. These helpers intentionally contain
 * no business logic — every caller handles dedup/normalization above this
 * layer. The retry + timeout knobs here exist to tolerate Windows file-lock
 * contention from antivirus scanners and to keep a misbehaving disk from
 * hanging the plugin indefinitely.
 */
export declare const WINDOWS_RENAME_RETRY_ATTEMPTS = 5;
export declare const WINDOWS_RENAME_RETRY_BASE_DELAY_MS = 10;
export declare const PRE_IMPORT_BACKUP_WRITE_TIMEOUT_MS = 3000;
export declare function isWindowsLockError(error: unknown): error is NodeJS.ErrnoException;
/**
 * `fs.rename` with capped exponential retry on Windows EPERM/EBUSY.
 *
 * Windows reports transient lock contention (antivirus scanning the temp
 * file, indexer holding a handle open, etc.) as EPERM/EBUSY and surfaces it
 * to `rename`. A few short retries turn that into a successful atomic swap
 * without the caller needing to know anything about the platform.
 */
export declare function renameWithWindowsRetry(sourcePath: string, destinationPath: string): Promise<void>;
/**
 * fsync the directory holding `filePath`, best effort.
 *
 * A rename only makes the directory *entry* durable once the directory itself
 * is flushed: without this a crash between rename and the next automatic
 * writeback can resurrect the old file or drop the new one, which for the
 * credential stores means restoring a consumed refresh token (or losing the
 * rotated one). Windows cannot fsync a directory handle, so it is skipped
 * there outright; every other failure is absorbed because the write already
 * landed — a skipped directory flush narrows crash durability but is not an
 * I/O failure worth failing the save over.
 */
export declare function fsyncParentDirectory(filePath: string): Promise<void>;
/**
 * Write `content` to `filePath` atomically and crash-durably:
 *
 *   temp file (mode 0600) -> fsync(fd) -> rename -> fsync(parent dir)
 *
 * Temp+rename alone makes the write atomic for *readers*, but not durable
 * across a crash: the rename can hit disk while the file's pages are still in
 * the writeback cache, leaving an empty or torn file under the final name —
 * for the credential stores that reads back as a wiped account pool. The fd
 * fsync orders the payload before the rename, and the directory fsync orders
 * the rename itself. Callers keep their own "directory exists" and snapshot
 * steps; this helper owns the temp file's lifecycle (including unlinking it
 * on failure) so every store gets identical crash semantics.
 */
export declare function writeFileAtomic(filePath: string, content: string): Promise<void>;
/**
 * `fs.writeFile` with a hard wall-clock timeout, flushed to disk before the
 * handle closes.
 *
 * Used by the pre-import backup writer so a stuck disk or hanging FS driver
 * cannot block the import transaction forever; every other write path uses
 * {@link writeFileAtomic} or the normal, untimed `fs.writeFile`.
 */
export declare function writeFileWithTimeout(filePath: string, content: string, timeoutMs: number, onHandleAbandoned?: (closed: Promise<void>) => void): Promise<void>;
