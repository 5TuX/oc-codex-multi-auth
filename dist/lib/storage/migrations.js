/**
 * Storage migration utilities for account data format upgrades.
 * Extracted from storage.ts to reduce module size.
 */
import { MODEL_FAMILIES } from "../prompts/codex.js";
/**
 * StorageError code emitted when a `version: 2` account file is loaded.
 *
 * V2 is an intermediate account schema produced by legacy 4.x plugin builds
 * that never shipped with a documented shape nor a forward-migrator to V3.
 * The safe behaviour is to refuse to load V2 explicitly so the user's
 * credentials are not silently discarded; callers surface this code to the
 * user alongside a recovery hint.
 */
export const UNKNOWN_V2_FORMAT_CODE = "UNKNOWN_V2_FORMAT";
/**
 * Diagnostic message shown when the loader refuses a V2 storage file.
 * Pulled into a helper so storage.ts, import paths, and tests produce
 * identical copy without drifting.
 */
export function buildV2RejectionMessage() {
    return ("Unsupported account storage schema version 2; this plugin only ships " +
        "migrations for v1 and v3. V2 files were produced by an intermediate " +
        "4.x build that never documented its shape, so migrating blindly would " +
        "risk silent account corruption.");
}
/**
 * Recovery hint shown alongside the V2 rejection message.
 * @param path - Absolute path of the offending storage file, or a placeholder
 *   when the caller cannot determine the source (e.g. in-memory normalization).
 */
export function buildV2RecoveryHint(path) {
    const resolvedPath = path || "<unknown>";
    return (`The storage file at ${resolvedPath} uses account schema v2, which ` +
        "this plugin cannot migrate automatically. To recover: " +
        "(1) back up the file outside the .opencode directory, " +
        "(2) remove or rename the original so the plugin can start fresh, " +
        "(3) run `opencode auth login` to create a v3 account pool, then " +
        "(4) if you need the old credentials, open each account manually or " +
        "re-run login per account. If you believe this file was produced by " +
        "the current plugin, please open an issue so V2 can be documented.");
}
function nowMs() {
    return Date.now();
}
export function migrateV1ToV3(v1) {
    const now = nowMs();
    return {
        version: 3,
        accounts: v1.accounts.map((account) => {
            const rateLimitResetTimes = {};
            if (typeof account.rateLimitResetTime === "number" && account.rateLimitResetTime > now) {
                for (const family of MODEL_FAMILIES) {
                    rateLimitResetTimes[family] = account.rateLimitResetTime;
                }
            }
            return {
                accountId: account.accountId,
                accountUserId: account.accountUserId,
                organizationId: account.organizationId,
                accountIdSource: account.accountIdSource,
                accountLabel: account.accountLabel,
                accountTags: account.accountTags,
                accountNote: account.accountNote,
                email: account.email,
                refreshToken: account.refreshToken,
                accessToken: account.accessToken,
                expiresAt: account.expiresAt,
                oauthScope: account.oauthScope,
                enabled: account.enabled,
                addedAt: account.addedAt,
                lastUsed: account.lastUsed,
                lastSwitchReason: account.lastSwitchReason,
                rateLimitResetTimes: Object.keys(rateLimitResetTimes).length > 0 ? rateLimitResetTimes : undefined,
                coolingDownUntil: account.coolingDownUntil,
                cooldownReason: account.cooldownReason,
            };
        }),
        activeIndex: v1.activeIndex,
        activeIndexByFamily: Object.fromEntries(MODEL_FAMILIES.map((family) => [family, v1.activeIndex])),
    };
}
//# sourceMappingURL=migrations.js.map