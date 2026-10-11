/**
 * Pre-write snapshots of the credential stores.
 *
 * The stores are the JSON files holding live refresh tokens: the V3 account
 * store and the flagged-accounts file beside it, which retains quarantined
 * records' refresh tokens so they can be restored later. Anything that
 * replaces either wholesale — a bad merge, a test run that escaped
 * its sandbox, a partial restore — takes the tokens with it, and a backup old
 * enough to predate the last few refreshes restores accounts whose refresh
 * tokens have since been rotated and are therefore dead. This module keeps a
 * bounded ring of recent snapshots so there is always a *live-token* copy to
 * restore from.
 *
 * Two decisions carry the design:
 *
 *   1. The snapshot captures the document already on disk, taken before the
 *      new one replaces it. Snapshotting the incoming document would be
 *      useless for the case this exists for: a clobber would simply be
 *      snapshotted as a clobber. What is worth keeping is the last good state.
 *
 *   2. Significance is a denylist, not an allowlist. Everything counts as a
 *      significant change unless it is explicitly ignored below. A field added
 *      to the schema later therefore cannot silently switch snapshots off; the
 *      worst it can do is cost one extra snapshot, which is recoverable, where
 *      a missing snapshot is not.
 */
import type { AccountStorageV3 } from "./migrations.js";
import type { FlaggedAccountStorageV1 } from "./flagged.js";
/**
 * The documents this module diffs: the V3 account store and the V1
 * flagged-account store. Both are `{ version, accounts }` JSON documents, and
 * the significance projection below reads them generically, so the union is a
 * name for the contract rather than a shape the code depends on. The import
 * is type-only on purpose — `flagged.ts` calls back into this module at
 * runtime.
 */
export type CredentialStoreDocument = AccountStorageV3 | FlaggedAccountStorageV1;
/**
 * Filename prefix owned exclusively by this module.
 *
 * `backups/` is shared with `codex-pre-import-backup-*`, `codex-backup-*`,
 * `*.migrated-to-keychain.*` and `pre-global-migration-*`. Retention deletes
 * strictly by this prefix, because deleting one of those would be a
 * data-loss bug inside a feature whose only purpose is preventing data loss.
 */
export declare const CREDENTIAL_SNAPSHOT_PREFIX = "codex-credential-snapshot";
export declare function isCredentialSnapshotFileName(name: string): boolean;
export declare function isSignificantStorageChange(previousContent: string, next: CredentialStoreDocument): boolean;
/**
 * The retention limit used for every credential-adjacent artifact family —
 * snapshots, `.migrated-to-keychain` markers, `pre-rollback` archives, and
 * pre-import backups. One knob keeps all the lifecycles bounded by the same
 * user-controlled budget instead of inventing a second retention surface.
 *
 * `credentialSnapshots.maxCount <= 0` means "keep everything", and that
 * choice is honoured for every family.
 */
export declare function getCredentialArtifactRetentionLimit(): number;
/**
 * Delete all but the newest `maxCount` files in `directory` selected by
 * `match` — the generic form of the snapshot ring, used for the other
 * bounded artifact families (keychain-migration markers, pre-rollback
 * archives, pre-import backups) that share `backups/` or the store
 * directory. `match` is either a filename-prefix string or a predicate.
 *
 * The selector is the whole contract: it must name a single artifact family
 * owned by a single producer, because anything else matching it is deleted.
 *
 * `maxCount <= 0` keeps every artifact; turning the feature off is the
 * boolean setting's job, not a magic zero.
 */
export declare function pruneStorageArtifacts(directory: string, match: string | ((name: string) => boolean), maxCount: number): Promise<void>;
/**
 * Delete all but the newest `maxCount` snapshots — the credential-snapshot
 * specialisation of {@link pruneStorageArtifacts}. `maxCount <= 0` keeps
 * every snapshot; turning the feature off is the boolean setting's job, not
 * a magic zero.
 */
export declare function pruneCredentialSnapshots(backupDirectory: string, maxCount: number): Promise<void>;
/**
 * Preserve the document currently at `storagePath` before it is replaced.
 *
 * `next` is the document about to be written, or `null` when the store is
 * about to be deleted outright — deletion is unconditionally significant.
 *
 * Callers must already hold the storage lock, so the snapshot is consistent
 * with the write it precedes.
 */
export declare function snapshotCredentialStoreBeforeWrite(storagePath: string, next: CredentialStoreDocument | null): Promise<void>;
/**
 * {@link snapshotCredentialStoreBeforeWrite}, with every failure downgraded to
 * a warning.
 *
 * A snapshot is a safety net, never a precondition. Letting a transient disk
 * error fail the write it precedes would break a token refresh, and therefore
 * the user's live sessions, to protect a copy of the file — strictly worse
 * than having no snapshot. The one exception is the test-home guard: that
 * exists to stop a test run writing over real credentials, so swallowing it
 * would disarm it.
 */
export declare function trySnapshotCredentialStoreBeforeWrite(storagePath: string, next: CredentialStoreDocument | null): Promise<void>;
