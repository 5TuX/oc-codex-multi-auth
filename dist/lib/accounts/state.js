/**
 * In-memory account registry for {@link AccountManager}.
 *
 * Owns the mutable account list, per-family cursors/active indices, and
 * auxiliary in-memory state (toast debounce, auth-failure counters).
 * Other account services (persistence, rotation, recovery) receive a reference
 * to an `AccountState` instance and mutate it through this narrow surface.
 */
import { MODEL_FAMILIES } from "../prompts/codex.js";
import { nowMs } from "../utils.js";
import { clampNonNegativeInt, clearExpiredQuotaExhaustion, clearExpiredRateLimits, getQuotaKey, isQuotaExhausted, isRateLimitedForFamily, } from "./rate-limits.js";
import { extractAccountEmail, extractAccountId, extractAccountUserId, sanitizeEmail, shouldUpdateAccountIdFromToken, } from "../auth/token-utils.js";
import { extractPlanType } from "../auth/plan-tier.js";
import { getMissingRequiredOAuthScopes, normalizeScope } from "../auth/scopes.js";
import { getWorkspaceIdentityKey } from "../storage/identity.js";
import { getHealthTracker, getTokenTracker } from "../rotation.js";
import { remapRateLimitBackoffAfterRemoval } from "../request/rate-limit-backoff.js";
import { logWarn } from "../logger.js";
function initFamilyState(defaultValue) {
    return Object.fromEntries(MODEL_FAMILIES.map((family) => [family, defaultValue]));
}
function getStoredAccountUserId(account) {
    return account.accountUserId?.trim() || extractAccountUserId(account.accessToken);
}
function selectUniqueIndex(indices) {
    return indices.length === 1 ? indices[0] : undefined;
}
function resolveFallbackMatches(params) {
    const refreshMatches = [];
    const memberMatches = [];
    const legacyCandidates = [];
    for (let index = 0; index < params.accounts.length; index += 1) {
        const account = params.accounts[index];
        if (!account)
            continue;
        if (account.refreshToken === params.refreshToken)
            refreshMatches.push(index);
        const storedMemberId = getStoredAccountUserId(account);
        if (params.accountUserId && storedMemberId === params.accountUserId) {
            memberMatches.push(index);
        }
        if (!storedMemberId)
            legacyCandidates.push(index);
    }
    // One historical OAuth grant may intentionally back several legacy org
    // variants, so an exact refresh-token match remains authoritative.
    if (refreshMatches.length > 0) {
        return { indices: new Set(refreshMatches), ambiguous: false };
    }
    if (params.accountUserId) {
        const exactMember = selectUniqueIndex(memberMatches);
        if (exactMember !== undefined) {
            return { indices: new Set([exactMember]), ambiguous: false };
        }
        if (memberMatches.length > 1) {
            return { indices: new Set(), ambiguous: true };
        }
    }
    const candidates = params.accountUserId
        ? legacyCandidates
        : params.accounts.map((_, index) => index);
    const normalizedEmail = sanitizeEmail(params.email);
    const accountAndEmailMatches = candidates.filter((index) => {
        const account = params.accounts[index];
        return (!!account &&
            !!params.accountId &&
            account.accountId === params.accountId &&
            !!normalizedEmail &&
            sanitizeEmail(account.email) === normalizedEmail);
    });
    const exactComposite = selectUniqueIndex(accountAndEmailMatches);
    if (exactComposite !== undefined) {
        return { indices: new Set([exactComposite]), ambiguous: false };
    }
    const emailMatches = normalizedEmail
        ? candidates.filter((index) => sanitizeEmail(params.accounts[index]?.email) === normalizedEmail)
        : [];
    const exactEmail = selectUniqueIndex(emailMatches);
    if (exactEmail !== undefined) {
        return { indices: new Set([exactEmail]), ambiguous: false };
    }
    // `candidates` already excludes every record that carries a DIFFERENT member
    // id, so matching on accountId here cannot bind two Business seats together.
    // Refusing to match at all would strand a legacy record that predates member
    // ids: the fallback would miss it and push a duplicate slot for the same
    // credential instead of hydrating the record in place.
    const accountIdMatches = params.accountId
        ? candidates.filter((index) => params.accounts[index]?.accountId === params.accountId)
        : [];
    const exactAccount = selectUniqueIndex(accountIdMatches);
    if (exactAccount !== undefined) {
        return { indices: new Set([exactAccount]), ambiguous: false };
    }
    return {
        indices: new Set(),
        ambiguous: accountAndEmailMatches.length > 1 ||
            emailMatches.length > 1 ||
            accountIdMatches.length > 1,
    };
}
/**
 * Replaces any re-auth note already on the record with one describing the
 * currently missing scopes, keeping operator-authored text intact.
 *
 * Replace, not append: the previous exact-match guard only recognized an
 * identical sentence, so a record whose missing set had changed since it was
 * written — the whole 6.11.2 population, once a real scope became known —
 * ended up carrying both sentences, the stale one first and contradicting the
 * accurate one.
 */
function appendReauthNote(accountNote, missingScopes) {
    const suffix = `Re-auth required for missing OAuth scope(s): ${missingScopes.join(", ")}.`;
    const preserved = stripReauthNote(accountNote);
    return preserved ? `${preserved} ${suffix}` : suffix;
}
const MISSING_SCOPE_NOTE_MARKER = "Re-auth required for missing OAuth scope(s):";
function hasExplicitOAuthScope(scope) {
    return typeof scope === "string" && scope.trim().length > 0;
}
export function hasMissingScopeReauthNote(accountNote) {
    return typeof accountNote === "string" && accountNote.includes(MISSING_SCOPE_NOTE_MARKER);
}
/**
 * Removes a re-auth note this class previously appended, preserving any
 * operator-authored text that came before it. `appendReauthNote` always appends
 * its sentence last, so everything from the marker onward is ours to drop.
 */
export function stripReauthNote(accountNote) {
    if (!accountNote)
        return undefined;
    const markerIndex = accountNote.indexOf(MISSING_SCOPE_NOTE_MARKER);
    if (markerIndex < 0)
        return accountNote;
    const preserved = accountNote.slice(0, markerIndex).trim();
    return preserved.length > 0 ? preserved : undefined;
}
/**
 * Markers plugin code writes onto records it disables itself, so an
 * `enabled: false` it produced stays distinguishable from the operator's own
 * choice — which the load/repair paths honor as intentional (#288). A bare
 * `enabled: false` had meant "operator did it", leaving auto-disabled
 * accounts unexplainable in diagnostics and unreachable except via the TUI.
 * Re-enabling strips the marker; operator text around it survives.
 */
export const AUTH_FAILURE_DISABLE_NOTE_MARKER = "Disabled automatically after repeated authentication failures.";
export const WORKSPACE_DEACTIVATED_NOTE_MARKER = "Disabled automatically after workspace deactivation.";
const AUTO_DISABLE_NOTE_MARKERS = [
    AUTH_FAILURE_DISABLE_NOTE_MARKER,
    WORKSPACE_DEACTIVATED_NOTE_MARKER,
];
export function hasAuthFailureDisableNote(accountNote) {
    return (typeof accountNote === "string" &&
        accountNote.includes(AUTH_FAILURE_DISABLE_NOTE_MARKER));
}
export function hasAutoDisableNote(accountNote) {
    return (typeof accountNote === "string" &&
        AUTO_DISABLE_NOTE_MARKERS.some((marker) => accountNote.includes(marker)));
}
/** Reason string for the selection explainability `reasons` list. */
export function describeDisabledReason(accountNote) {
    if (hasAuthFailureDisableNote(accountNote))
        return "disabled:auth-failures";
    if (typeof accountNote === "string" &&
        accountNote.includes(WORKSPACE_DEACTIVATED_NOTE_MARKER)) {
        return "disabled:workspace-deactivated";
    }
    if (hasMissingScopeReauthNote(accountNote))
        return "disabled:reauth-required";
    return "disabled";
}
export function appendAutoDisableNote(accountNote, marker) {
    const preserved = stripAutoDisableNote(accountNote);
    return preserved ? `${preserved} ${marker}` : marker;
}
/**
 * Removes only the auto-disable sentence, wherever it sits — operator text
 * before it and a later re-auth sentence after it both survive, unlike the
 * cut-to-end semantics `stripReauthNote` gets away with by always appending
 * last.
 */
export function stripAutoDisableNote(accountNote) {
    if (!accountNote)
        return undefined;
    let note = accountNote;
    for (const marker of AUTO_DISABLE_NOTE_MARKERS) {
        const markerIndex = note.indexOf(marker);
        if (markerIndex < 0)
            continue;
        // Swallow the joining space `appendAutoDisableNote` put in so removing
        // a mid-string marker does not leave a double gap behind.
        const start = markerIndex > 0 && note[markerIndex - 1] === " "
            ? markerIndex - 1
            : markerIndex;
        note = `${note.slice(0, start)}${note.slice(markerIndex + marker.length)}`;
    }
    const preserved = note.trim();
    return preserved.length > 0 ? preserved : undefined;
}
/**
 * Required-scope check that only fires when the granted scope is actually
 * known. Absent scope metadata means "unknown", NOT "nothing was granted":
 * `refreshAccessToken` deliberately omits `scope` when the token response does,
 * and host credentials restored by the OpenAI backfill carry no scope either.
 * Treating that absence as a total scope failure disabled freshly-authenticated
 * accounts with "missing: openid, profile, email, offline_access" (issue #213).
 */
function getEnforceableMissingOAuthScopes(scope) {
    return hasExplicitOAuthScope(scope) ? getMissingRequiredOAuthScopes(scope) : [];
}
/**
 * Same check across several records of the *same* grant — typically the pool's
 * stored scope and the host credential's scope. If any known source shows the
 * required scopes, the account is fine; disabling on the weaker of two sources
 * would strand an account the other already vouches for. When none satisfies,
 * the smallest missing set wins so the note reports the best evidence held.
 */
function getEnforceableMissingOAuthScopesAcross(scopes) {
    let fewestMissing;
    for (const scope of scopes) {
        if (!hasExplicitOAuthScope(scope))
            continue;
        const missing = getMissingRequiredOAuthScopes(scope);
        if (missing.length === 0)
            return [];
        if (!fewestMissing || missing.length < fewestMissing.length) {
            fewestMissing = missing;
        }
    }
    return fewestMissing ?? [];
}
function getAuthScope(auth) {
    return normalizeScope(auth?.scope);
}
export class AccountState {
    accounts = [];
    cursorByFamily = initFamilyState(0);
    currentAccountIndexByFamily = initFamilyState(-1);
    lastToastAccountIndex = -1;
    lastToastTime = 0;
    authFailuresByRefreshToken = new Map();
    /**
     * Per-refresh-token promise chain used to serialize concurrent
     * `incrementAuthFailures` calls. Prevents lost updates when two org-variant
     * accounts that share a refresh token observe an auth failure at once — see
     * the lost-update fix for shared-refresh-token accounts.
     */
    incrementAuthFailuresChain = new Map();
    /**
     * Set when `initializeFromStorage` re-enabled an account that an earlier
     * build had wrongly disabled for missing scopes. The repair happens in
     * memory, so it must be flushed to disk or every surface that reads storage
     * directly keeps showing the stale disabled state and re-auth note.
     * `consumeScopeRepairs()` clears it, so the extra write happens once.
     */
    scopeRepairsPending = false;
    /**
     * Identity keys of accounts this manager pushed in memory that no persisted
     * record is known to carry yet — the host OAuth credential bootstrap is the
     * main one. A live save takes membership from the on-disk store, so without
     * this marker the very save meant to persist such an account would drop it.
     * Persistence consumes the keys once the merged write carries the account.
     */
    addedAccountIdentities = new Set();
    markAccountAdded(account) {
        this.addedAccountIdentities.add(getWorkspaceIdentityKey(account));
    }
    peekAddedAccountIdentities() {
        return this.addedAccountIdentities;
    }
    consumeAddedAccountIdentities() {
        this.addedAccountIdentities.clear();
    }
    consumeScopeRepairs() {
        const pending = this.scopeRepairsPending;
        this.scopeRepairsPending = false;
        return pending;
    }
    initializeFromStorage(authFallback, stored) {
        const fallbackAccountId = extractAccountId(authFallback?.access);
        const fallbackAccountUserId = extractAccountUserId(authFallback?.access);
        const fallbackAccountEmail = sanitizeEmail(extractAccountEmail(authFallback?.access));
        const fallbackOAuthScope = getAuthScope(authFallback);
        const fallbackMissingOAuthScopes = getEnforceableMissingOAuthScopes(fallbackOAuthScope);
        if (stored && stored.accounts.length > 0) {
            const baseNow = nowMs();
            const fallbackMatch = authFallback
                ? resolveFallbackMatches({
                    accounts: stored.accounts,
                    refreshToken: authFallback.refresh,
                    accountId: fallbackAccountId,
                    accountUserId: fallbackAccountUserId,
                    email: fallbackAccountEmail,
                })
                : { indices: new Set(), ambiguous: false };
            if (authFallback && fallbackMatch.ambiguous) {
                logWarn("Stored OAuth fallback matches multiple account records; ignoring the fallback rather than replacing multiple credentials.");
            }
            this.accounts = stored.accounts
                .map((account, index) => {
                if (!account.refreshToken || typeof account.refreshToken !== "string") {
                    return null;
                }
                // Canonicalize at the load boundary so a legacy blank on disk is
                // carried as absent rather than as an explicit empty grant.
                const accountOAuthScope = normalizeScope(account.oauthScope);
                const matchesFallback = !!authFallback && fallbackMatch.indices.has(index);
                const refreshToken = matchesFallback && authFallback ? authFallback.refresh : account.refreshToken;
                const oauthScope = matchesFallback && fallbackOAuthScope ? fallbackOAuthScope : accountOAuthScope;
                // The stored record and the matching host credential describe the
                // same grant, so weigh both before disabling anything.
                const missingOAuthScopes = getEnforceableMissingOAuthScopesAcross(matchesFallback
                    ? [accountOAuthScope, fallbackOAuthScope]
                    : [accountOAuthScope]);
                // An account this class disabled carries the re-auth note. Once the
                // scope check stops firing, undo our own damage instead of leaving
                // it disabled forever — 6.11.2 disabled accounts whose scope was
                // merely unknown, and re-login alone could not clear that (#213).
                // A note-less `enabled: false` stays disabled: that one is the
                // operator's own choice.
                const disabledByScopeCheck = account.enabled === false && hasMissingScopeReauthNote(account.accountNote);
                if (disabledByScopeCheck && missingOAuthScopes.length === 0) {
                    this.scopeRepairsPending = true;
                }
                return {
                    index,
                    accountId: matchesFallback
                        ? fallbackAccountId ?? account.accountId
                        : account.accountId,
                    accountUserId: matchesFallback
                        ? fallbackAccountUserId ?? getStoredAccountUserId(account)
                        : getStoredAccountUserId(account),
                    organizationId: account.organizationId,
                    accountIdSource: account.accountIdSource,
                    accountLabel: account.accountLabel,
                    planType: account.planType,
                    accountTags: account.accountTags,
                    accountNote: missingOAuthScopes.length > 0
                        ? appendReauthNote(account.accountNote, missingOAuthScopes)
                        : disabledByScopeCheck
                            ? stripReauthNote(account.accountNote)
                            : account.accountNote,
                    email: matchesFallback
                        ? fallbackAccountEmail ?? sanitizeEmail(account.email)
                        : sanitizeEmail(account.email),
                    refreshToken,
                    enabled: missingOAuthScopes.length === 0 &&
                        (disabledByScopeCheck || account.enabled !== false),
                    access: matchesFallback && authFallback ? authFallback.access : account.accessToken,
                    expires: matchesFallback && authFallback ? authFallback.expires : account.expiresAt,
                    oauthScope,
                    tokenRotatedAt: matchesFallback &&
                        authFallback &&
                        authFallback.refresh !== account.refreshToken
                        ? baseNow
                        : account.tokenRotatedAt,
                    addedAt: clampNonNegativeInt(account.addedAt, baseNow),
                    lastUsed: clampNonNegativeInt(account.lastUsed, 0),
                    lastSwitchReason: account.lastSwitchReason,
                    rateLimitResetTimes: account.rateLimitResetTimes ?? {},
                    quotaExhaustedUntil: account.quotaExhaustedUntil,
                    quotaExhaustedStampAt: account.quotaExhaustedStampAt,
                    quotaExhaustedClearedAt: account.quotaExhaustedClearedAt,
                    coolingDownUntil: account.coolingDownUntil,
                    cooldownReason: account.cooldownReason,
                };
            })
                .filter((account) => account !== null);
            const hasMatchingFallback = !!authFallback && fallbackMatch.indices.size > 0;
            if (authFallback && !hasMatchingFallback && !fallbackMatch.ambiguous) {
                const now = nowMs();
                if (fallbackMissingOAuthScopes.length === 0) {
                    this.accounts.push({
                        index: this.accounts.length,
                        accountId: fallbackAccountId,
                        accountUserId: fallbackAccountUserId,
                        organizationId: undefined,
                        accountIdSource: fallbackAccountId ? "token" : undefined,
                        email: fallbackAccountEmail,
                        refreshToken: authFallback.refresh,
                        enabled: true,
                        access: authFallback.access,
                        expires: authFallback.expires,
                        oauthScope: fallbackOAuthScope,
                        addedAt: now,
                        lastUsed: now,
                        lastSwitchReason: "initial",
                        rateLimitResetTimes: {},
                    });
                }
                else {
                    logWarn(`Stored OAuth fallback is missing required OAuth scope(s): ${fallbackMissingOAuthScopes.join(", ")}. Re-auth required.`);
                    this.accounts.push({
                        index: this.accounts.length,
                        accountId: fallbackAccountId,
                        accountUserId: fallbackAccountUserId,
                        organizationId: undefined,
                        accountIdSource: fallbackAccountId ? "token" : undefined,
                        email: fallbackAccountEmail,
                        refreshToken: authFallback.refresh,
                        enabled: false,
                        accountNote: appendReauthNote(undefined, fallbackMissingOAuthScopes),
                        access: authFallback.access,
                        expires: authFallback.expires,
                        oauthScope: fallbackOAuthScope,
                        addedAt: now,
                        lastUsed: 0,
                        lastSwitchReason: "initial",
                        rateLimitResetTimes: {},
                    });
                }
                const pushed = this.accounts[this.accounts.length - 1];
                if (pushed)
                    this.markAccountAdded(pushed);
            }
            if (this.accounts.length > 0) {
                const defaultIndex = clampNonNegativeInt(stored.activeIndex, 0) % this.accounts.length;
                for (const family of MODEL_FAMILIES) {
                    const rawIndex = stored.activeIndexByFamily?.[family];
                    const nextIndex = clampNonNegativeInt(rawIndex, defaultIndex) % this.accounts.length;
                    this.currentAccountIndexByFamily[family] = nextIndex;
                    this.cursorByFamily[family] = nextIndex;
                }
            }
            return;
        }
        if (authFallback) {
            const now = nowMs();
            const enabled = fallbackMissingOAuthScopes.length === 0;
            if (!enabled) {
                logWarn(`Stored OAuth fallback is missing required OAuth scope(s): ${fallbackMissingOAuthScopes.join(", ")}. Re-auth required.`);
            }
            this.accounts = [
                {
                    index: 0,
                    accountId: fallbackAccountId,
                    accountUserId: fallbackAccountUserId,
                    organizationId: undefined,
                    accountIdSource: fallbackAccountId ? "token" : undefined,
                    email: fallbackAccountEmail,
                    refreshToken: authFallback.refresh,
                    enabled,
                    accountNote: enabled
                        ? undefined
                        : appendReauthNote(undefined, fallbackMissingOAuthScopes),
                    access: authFallback.access,
                    expires: authFallback.expires,
                    oauthScope: fallbackOAuthScope,
                    addedAt: now,
                    lastUsed: 0,
                    lastSwitchReason: "initial",
                    rateLimitResetTimes: {},
                },
            ];
            const bootstrap = this.accounts[0];
            if (bootstrap)
                this.markAccountAdded(bootstrap);
            for (const family of MODEL_FAMILIES) {
                this.currentAccountIndexByFamily[family] = 0;
                this.cursorByFamily[family] = 0;
            }
        }
    }
    hasRefreshToken(refreshToken) {
        return this.accounts.some((account) => account.refreshToken === refreshToken);
    }
    getAccountCount() {
        return this.accounts.length;
    }
    getActiveIndexForFamily(family) {
        const index = this.currentAccountIndexByFamily[family];
        if (index < 0 || index >= this.accounts.length) {
            return this.accounts.length > 0 ? 0 : -1;
        }
        return index;
    }
    getAccountsSnapshot() {
        return this.accounts.map((account) => ({
            ...account,
            rateLimitResetTimes: { ...account.rateLimitResetTimes },
        }));
    }
    getSelectionExplainability(family, model, now = nowMs()) {
        const quotaKey = model ? `${family}:${model}` : family;
        const baseQuotaKey = getQuotaKey(family);
        const modelQuotaKey = model ? getQuotaKey(family, model) : null;
        const currentIndex = this.currentAccountIndexByFamily[family];
        const healthTracker = getHealthTracker();
        const tokenTracker = getTokenTracker();
        return this.accounts.map((account) => {
            clearExpiredRateLimits(account);
            clearExpiredQuotaExhaustion(account);
            const enabled = account.enabled !== false;
            const reasons = [];
            let rateLimitedUntil;
            const baseRateLimit = account.rateLimitResetTimes[baseQuotaKey];
            const modelRateLimit = modelQuotaKey
                ? account.rateLimitResetTimes[modelQuotaKey]
                : undefined;
            if (typeof baseRateLimit === "number" && baseRateLimit > now) {
                rateLimitedUntil = baseRateLimit;
            }
            if (typeof modelRateLimit === "number" &&
                modelRateLimit > now &&
                (rateLimitedUntil === undefined || modelRateLimit > rateLimitedUntil)) {
                rateLimitedUntil = modelRateLimit;
            }
            const coolingDownUntil = typeof account.coolingDownUntil === "number" && account.coolingDownUntil > now
                ? account.coolingDownUntil
                : undefined;
            const quotaExhaustedUntil = isQuotaExhausted(account, now)
                ? account.quotaExhaustedUntil
                : undefined;
            if (!enabled) {
                reasons.push(describeDisabledReason(account.accountNote));
            }
            if (rateLimitedUntil !== undefined)
                reasons.push("rate-limited");
            if (quotaExhaustedUntil !== undefined)
                reasons.push("quota-exhausted");
            if (coolingDownUntil !== undefined) {
                reasons.push(account.cooldownReason ? `cooldown:${account.cooldownReason}` : "cooldown");
            }
            const tokensAvailable = tokenTracker.getTokens(account.index, quotaKey);
            if (tokensAvailable < 1)
                reasons.push("token-bucket-empty");
            const eligible = enabled &&
                rateLimitedUntil === undefined &&
                quotaExhaustedUntil === undefined &&
                coolingDownUntil === undefined &&
                tokensAvailable >= 1;
            if (reasons.length === 0)
                reasons.push("eligible");
            return {
                index: account.index,
                enabled,
                isCurrentForFamily: currentIndex === account.index,
                eligible,
                reasons,
                healthScore: healthTracker.getScore(account.index, quotaKey),
                tokensAvailable,
                rateLimitedUntil,
                quotaExhaustedUntil,
                coolingDownUntil,
                cooldownReason: coolingDownUntil !== undefined ? account.cooldownReason : undefined,
                lastUsed: account.lastUsed,
            };
        });
    }
    setActiveIndex(index) {
        if (!Number.isFinite(index))
            return null;
        if (index < 0 || index >= this.accounts.length)
            return null;
        const account = this.accounts[index];
        if (!account)
            return null;
        if (account.enabled === false)
            return null;
        for (const family of MODEL_FAMILIES) {
            this.currentAccountIndexByFamily[family] = index;
            this.cursorByFamily[family] = index;
        }
        account.lastUsed = nowMs();
        account.lastSwitchReason = "rotation";
        return account;
    }
    getCurrentAccountForFamily(family) {
        const index = this.currentAccountIndexByFamily[family];
        if (index < 0 || index >= this.accounts.length) {
            return null;
        }
        const account = this.accounts[index];
        if (!account) {
            return null;
        }
        return account;
    }
    shouldShowAccountToast(accountIndex, debounceMs = 30000) {
        const now = nowMs();
        if (accountIndex === this.lastToastAccountIndex &&
            now - this.lastToastTime < debounceMs) {
            return false;
        }
        return true;
    }
    markToastShown(accountIndex) {
        this.lastToastAccountIndex = accountIndex;
        this.lastToastTime = nowMs();
    }
    updateFromAuth(account, auth) {
        const previousRefreshToken = account.refreshToken;
        account.refreshToken = auth.refresh;
        account.access = auth.access;
        account.expires = auth.expires;
        const scope = getAuthScope(auth);
        if (scope) {
            account.oauthScope = scope;
        }
        // Re-read from the token that just arrived. Reading it only at login
        // would pin the tier a Plus -> Pro upgrade left behind until the user
        // re-authenticated, while the live `x-codex-plan-type` header already
        // reported the new one. A token that carries no claim leaves the stored
        // value alone rather than erasing it.
        const planType = extractPlanType(auth.access);
        if (planType) {
            account.planType = planType;
        }
        if (previousRefreshToken !== account.refreshToken) {
            // Stamp the rotation so a concurrent process persisting a stale
            // snapshot can recognize this token as the newer one and adopt it
            // instead of clobbering it (single-use refresh tokens).
            account.tokenRotatedAt = Math.max(nowMs(), (account.tokenRotatedAt ?? 0) + 1);
            this.authFailuresByRefreshToken.delete(previousRefreshToken);
            // A single OAuth login produces sibling accounts (distinct orgs) that
            // SHARE one refresh token. OpenAI rotates the refresh token on refresh,
            // so the siblings' stored token is now stale; their next refresh would
            // fail and eventually remove still-valid workspaces. Propagate the new
            // refresh token to those siblings. Org-specific fields (access /
            // accountId / email) are left untouched — each sibling re-derives its
            // own access token on its next use.
            this.propagateRotatedRefreshTokenToSiblings(account, previousRefreshToken, auth.refresh);
        }
        const tokenAccountId = extractAccountId(auth.access);
        const tokenAccountUserId = extractAccountUserId(auth.access);
        if (tokenAccountId &&
            shouldUpdateAccountIdFromToken(account.accountIdSource, account.accountId)) {
            account.accountId = tokenAccountId;
            account.accountIdSource = "token";
        }
        // Mirror the accountId guard above. A manually- or org-pinned record must
        // not be re-identified by a token minted for a different workspace/seat,
        // which would silently move its pool key, usage dedupe key and workspace
        // identity key. A record with no member id yet is still backfilled.
        if (tokenAccountUserId &&
            (!account.accountUserId ||
                shouldUpdateAccountIdFromToken(account.accountIdSource, account.accountId))) {
            account.accountUserId = tokenAccountUserId;
        }
        account.email = sanitizeEmail(extractAccountEmail(auth.access)) ?? account.email;
    }
    /**
     * After a refresh rotates the refresh token on `account`, update every OTHER
     * account that still holds the pre-rotation token so the shared credential
     * stays consistent across org-variant siblings.
     */
    propagateRotatedRefreshTokenToSiblings(account, previousRefreshToken, newRefreshToken) {
        if (!previousRefreshToken || previousRefreshToken === newRefreshToken)
            return;
        for (const sibling of this.accounts) {
            if (sibling === account)
                continue;
            if (sibling.refreshToken === previousRefreshToken) {
                sibling.refreshToken = newRefreshToken;
                // The expired access token on the sibling forces a fresh refresh
                // (with the now-valid token) the next time it is selected.
                sibling.expires = 0;
                sibling.tokenRotatedAt = Math.max(nowMs(), (sibling.tokenRotatedAt ?? 0) + 1);
            }
        }
        this.authFailuresByRefreshToken.delete(previousRefreshToken);
    }
    toAuthDetails(account) {
        return {
            type: "oauth",
            access: account.access ?? "",
            refresh: account.refreshToken,
            expires: account.expires ?? 0,
            scope: account.oauthScope,
        };
    }
    markSwitched(account, reason, family) {
        account.lastSwitchReason = reason;
        this.currentAccountIndexByFamily[family] = account.index;
    }
    removeAccount(account) {
        const idx = this.accounts.indexOf(account);
        if (idx < 0) {
            return false;
        }
        this.accounts.splice(idx, 1);
        this.accounts.forEach((acc, index) => {
            acc.index = index;
        });
        // Rotation heuristic state (health score, token bucket, rate-limit
        // backoff) is keyed by positional account index. Now that survivors have
        // been reindexed, remap that state so each account keeps its own history
        // instead of inheriting the removed (or a shifted neighbor's) state.
        getHealthTracker().remapAfterRemoval(idx);
        getTokenTracker().remapAfterRemoval(idx);
        remapRateLimitBackoffAfterRemoval(idx);
        if (this.accounts.length === 0) {
            for (const family of MODEL_FAMILIES) {
                this.cursorByFamily[family] = 0;
                this.currentAccountIndexByFamily[family] = -1;
            }
            return true;
        }
        for (const family of MODEL_FAMILIES) {
            if (this.cursorByFamily[family] > idx) {
                this.cursorByFamily[family] = Math.max(0, this.cursorByFamily[family] - 1);
            }
        }
        for (const family of MODEL_FAMILIES) {
            this.cursorByFamily[family] = this.cursorByFamily[family] % this.accounts.length;
        }
        for (const family of MODEL_FAMILIES) {
            if (this.currentAccountIndexByFamily[family] > idx) {
                this.currentAccountIndexByFamily[family] -= 1;
            }
            if (this.currentAccountIndexByFamily[family] >= this.accounts.length) {
                this.currentAccountIndexByFamily[family] = -1;
            }
        }
        return true;
    }
    removeAccountByIndex(index) {
        if (!Number.isFinite(index))
            return false;
        if (index < 0 || index >= this.accounts.length)
            return false;
        const account = this.accounts[index];
        if (!account)
            return false;
        return this.removeAccount(account);
    }
    setAccountEnabled(index, enabled) {
        if (!Number.isFinite(index))
            return null;
        if (index < 0 || index >= this.accounts.length)
            return null;
        const account = this.accounts[index];
        if (!account)
            return null;
        account.enabled = enabled;
        if (enabled) {
            // Re-enabling drops the plugin's own attribution; operator text
            // around the marker survives (strip preserves it).
            account.accountNote = stripAutoDisableNote(account.accountNote);
            // A leftover auth-failure cooldown would keep the account out of
            // rotation even with `enabled` restored — re-enable must mean usable.
            if (account.cooldownReason === "auth-failure") {
                this.clearAccountCooldown(account);
            }
        }
        return account;
    }
    /**
     * Check whether a cooldown window is still active for the given account.
     * Clears expired cooldowns as a side-effect so that stale `coolingDownUntil`
     * timestamps do not leak into snapshots or persistence.
     */
    isAccountCoolingDown(account) {
        if (account.coolingDownUntil === undefined)
            return false;
        if (nowMs() >= account.coolingDownUntil) {
            this.clearAccountCooldown(account);
            return false;
        }
        return true;
    }
    clearAccountCooldown(account) {
        delete account.coolingDownUntil;
        delete account.cooldownReason;
    }
    /**
     * Shared predicate used by rotation and diagnostic paths: is this account
     * usable for the given family/model right now? Combines enabled flag,
     * rate-limit expiry, and cooldown.
     */
    isEligibleForFamily(account, family, model) {
        if (account.enabled === false)
            return false;
        clearExpiredRateLimits(account);
        clearExpiredQuotaExhaustion(account);
        if (isQuotaExhausted(account))
            return false;
        if (isRateLimitedForFamily(account, family, model))
            return false;
        if (this.isAccountCoolingDown(account))
            return false;
        return true;
    }
}
//# sourceMappingURL=state.js.map