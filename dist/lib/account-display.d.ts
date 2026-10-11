/**
 * Shared account-display helpers.
 *
 * Account identity is rendered across several UI surfaces (interactive auth
 * menu, command output, runtime/log messages, standalone CLI login menu, TUI
 * quota status). Historically each surface formatted the email independently
 * and only the TUI quota path honored the `maskEmail` config, so full emails
 * could still leak into screenshots, screen shares, and terminal recordings.
 *
 * These helpers centralize the privacy behavior so every human-facing surface
 * masks the email consistently when `maskEmail` is enabled, while preferring a
 * user-defined account label when one exists.
 */
/**
 * Mask an email for display while preserving the domain so collisions between
 * accounts on the same provider remain distinguishable.
 *
 * `user@example.com` -> `us***@example.com`
 * `a@example.org`    -> `a***@example.org`
 * `not-an-email`     -> `*****`
 *
 * Returns `undefined` for empty/whitespace input so callers can fall back to
 * other identity fields.
 */
export declare function maskEmailForDisplay(email: string | undefined): string | undefined;
/**
 * Resolve the email value to display for an account, applying masking when
 * requested. Returns `undefined` when there is no email to show.
 */
export declare function resolveDisplayEmail(email: string | undefined, maskEmail: boolean): string | undefined;
export declare function maskIdentityValue(value: string | undefined, includeSensitive: boolean): string | undefined;
/**
 * Render the short seat suffix that separates two accounts sharing one
 * workspace `accountId`.
 *
 * A ChatGPT Business workspace is a single `accountId` shared by every member
 * of it; `accountUserId` is that member's own id and the only stored field
 * that tells their seats apart. Upstream meters each seat separately - its own
 * quota, its own weekly reset - so seats sharing a workspace are distinct
 * accounts, not copies of one.
 *
 * Every display surface used to render `accountId` alone, so four members of
 * one Business workspace printed an identical `id:` string and read as the
 * same account duplicated four times. Appending this suffix is what makes the
 * rendered rows match the accounts they describe.
 *
 * A six-character tail by default, matching what the surfaces already print
 * for `accountId`. Six characters are not an identity on their own - member
 * ids sharing a six-character tail were observed, which is the same false
 * "these are duplicates" reading this suffix exists to prevent - so pass
 * `peerAccountUserIds` (the other accounts rendered alongside this one) and
 * {@link resolveSeatRenderer} picks a rendering that separates them inside
 * {@link SEAT_RENDER_MAX_LENGTH}: a wider or relocated excerpt of the id
 * where one fits, and an opaque hash prefix where none does.
 *
 * Returns `undefined` when there is no member id, so a token-only record
 * renders exactly as it did before.
 */
export declare function formatSeatSuffix(accountUserId: string | undefined, peerAccountUserIds?: readonly (string | undefined)[]): string | undefined;
/**
 * Seat suffixes for a whole rendered set, all built the same way so the rows
 * line up and no two distinct member ids share a rendering. Entries without a
 * member id come back `undefined`, holding their position.
 */
export declare function resolveSeatSuffixes(accountUserIds: readonly (string | undefined)[]): (string | undefined)[];
/**
 * Whether a member id may be shown as a seat suffix next to masked fields.
 * The suffix is a bounded excerpt of the id, so on a short id it could be
 * most of the id itself - more than `maskIdentityValue` discloses of the same
 * value. Masked output shows the seat only when the id is long enough that
 * {@link SEAT_RENDER_MAX_LENGTH} characters cannot be the whole thing.
 *
 * The standalone CLI keeps its own copy as `seatIsDisclosable`; keep the two
 * in step.
 */
export declare function seatIsDisclosable(accountUserId: string | undefined, includeSensitive: boolean): boolean;
