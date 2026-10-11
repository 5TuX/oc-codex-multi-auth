/**
 * Opt-in OS-keychain credential backend.
 *
 * Addresses the concern that per-project accounts are otherwise stored as
 * plaintext V3 JSON on disk. This
 * module introduces an alternate storage backend that persists the SAME
 * V3 JSON blob as a secret value in the OS keychain:
 *
 *   - macOS: Keychain
 *   - Windows: Credential Manager
 *   - Linux: Secret Service / libsecret
 *
 * **Default behavior is unchanged.** The backend only activates when
 * `CODEX_KEYCHAIN=1` is set in the environment. Any other value (unset,
 * `"0"`, `"false"`, `""`, `"yes"`, ...) leaves the existing JSON path in
 * full control. This is deliberate: credential storage is the highest-trust
 * surface in the plugin and every new failure mode is a login regression.
 *
 * Data model:
 *   - Service name: `oc-codex-multi-auth` (fixed)
 *   - Account key: `accounts:<project-storage-key>` where the project key
 *     is the `projectName-sha256hash12` string already produced by
 *     `lib/storage/paths.ts#getProjectStorageKey`. For the global file we
 *     use the literal key `accounts:global`.
 *   - Secret payload: the exact JSON string that would otherwise be written
 *     to disk (UTF-8, pretty-printed to match the file contents; the OS
 *     keychain APIs used here store arbitrary UTF-8 so no base64 encoding
 *     is required — documented here for reviewers).
 *
 * Fallback contract:
 *   - Every entry point returns a soft failure (`null` on read,
 *     `{ok: false}` on write) instead of throwing when the native module
 *     cannot load or a keychain call fails. Callers MUST fall back to the
 *     JSON backend on failure; they must never silently lose credentials.
 *   - All errors are logged with `log.warn` / `log.error`. Secret values
 *     never appear in log text — only the service name, account key, and
 *     the native error message.
 *
 * Testing:
 *   - The native module is loaded lazily so unit tests can substitute
 *     `_setBackendForTests` to avoid hitting the real OS keychain.
 *     Integration tests that DO want to hit the real keychain can set
 *     `CODEX_KEYCHAIN=1` and let `loadBackend` resolve the module.
 */
import { createLogger } from "../logger.js";
const log = createLogger("storage.keychain");
/**
 * The keychain service identifier this plugin owns. Chosen to match the npm
 * package name so a human inspecting Keychain Access / Credential Manager
 * can easily identify which program owns a stored credential.
 */
export const KEYCHAIN_SERVICE_NAME = "oc-codex-multi-auth";
/**
 * Account key used when the plugin is operating without a per-project
 * storage path (i.e. the global accounts file). Kept distinct from any
 * per-project key so the two storage scopes never collide in the OS
 * keychain's (service, account) index.
 */
export const GLOBAL_KEYCHAIN_ACCOUNT_KEY = "accounts:global";
/**
 * Reserved account key used exclusively by the availability probe. Kept
 * double-underscored and service-suffixed so a future refactor that drops
 * the `accounts:` prefix on real entries (or adds a different prefix) still
 * cannot collide with this probe (F1 post-merge LOW finding).
 */
export const KEYCHAIN_PROBE_ACCOUNT_KEY = `__probe__@${KEYCHAIN_SERVICE_NAME}`;
/**
 * Windows Credential Manager rejects credential blobs larger than
 * CRED_MAX_CREDENTIAL_BLOB_SIZE (2560 bytes). A multi-account pool is
 * typically 2.5–4 KB of JSON, so on win32 most real writes would fail
 * natively — and the availability probe cannot detect this because the
 * "probe" payload is tiny. Preflight the byte length instead so an
 * oversized write degrades to the JSON path (which stays authoritative)
 * instead of erroring mid-write after work has already happened.
 */
export const WIN32_KEYCHAIN_MAX_BLOB_BYTES = 2560;
/**
 * Returns a refusal error string when the blob cannot fit in the target
 * OS keychain, or null when the write may proceed.
 */
function keychainBlobRefusal(jsonBlob) {
    if (process.platform !== "win32")
        return null;
    const bytes = Buffer.byteLength(jsonBlob, "utf8");
    if (bytes <= WIN32_KEYCHAIN_MAX_BLOB_BYTES)
        return null;
    return `blob is ${bytes} bytes, exceeding the Windows Credential Manager limit of ${WIN32_KEYCHAIN_MAX_BLOB_BYTES} — staying on the JSON storage path`;
}
let cachedBackend = null;
let cacheResolved = false;
async function loadNativeBackend() {
    try {
        // Dynamic import keeps the module resolution inside the try/catch so
        // a missing prebuilt binary (e.g. unsupported platform, partial npm
        // install) degrades to JSON fallback instead of crashing at require
        // time. The cast narrows the type without using `any`.
        const mod = (await import("@napi-rs/keyring"));
        if (!mod || typeof mod.Entry !== "function") {
            log.warn("keychain: @napi-rs/keyring module shape unexpected; disabling keychain backend");
            return null;
        }
        // @napi-rs/keyring's `Entry` methods are synchronous by design (they
        // delegate to native OS keychain calls). The backend interface is
        // Promise-typed so it can be mocked with in-memory Promise-returning
        // stubs in tests, so each method returns `Promise.resolve(...)` of
        // the native sync result. Using non-async methods keeps
        // `@typescript-eslint/require-await` satisfied without per-method
        // suppressions while the Promise-returning interface stays intact.
        const backend = {
            get(service, account) {
                try {
                    const entry = new mod.Entry(service, account);
                    const value = entry.getPassword();
                    return Promise.resolve(value ?? null);
                }
                catch (err) {
                    log.warn("keychain: read failed", {
                        service,
                        account,
                        error: err.message,
                    });
                    return Promise.resolve(null);
                }
            },
            set(service, account, secret) {
                const entry = new mod.Entry(service, account);
                entry.setPassword(secret);
                return Promise.resolve();
            },
            delete(service, account) {
                // Native errors propagate to the public wrappers below so callers
                // can distinguish "entry absent" (false) from "delete failed"
                // (a thrown error becomes `KeychainDeleteResult.error`). A failed
                // delete is NOT safe to treat like an absent entry: the stale copy
                // would silently resurrect the cleared credentials on the next
                // keychain-first load.
                const entry = new mod.Entry(service, account);
                return Promise.resolve(entry.deletePassword());
            },
            isAvailable() {
                // Round-trip a throwaway entry under a reserved, namespaced
                // account key so we actually exercise the OS keychain rather
                // than trusting that import succeeded. The key is prefixed
                // with the service name so a future refactor that drops the
                // `accounts:` prefix on real entries cannot collide with
                // this probe (F1 post-merge LOW finding).
                try {
                    const entry = new mod.Entry(KEYCHAIN_SERVICE_NAME, KEYCHAIN_PROBE_ACCOUNT_KEY);
                    entry.setPassword("probe");
                    entry.deletePassword();
                    return Promise.resolve(true);
                }
                catch (err) {
                    log.warn("keychain: availability probe failed", {
                        error: err.message,
                    });
                    return Promise.resolve(false);
                }
            },
        };
        return backend;
    }
    catch (err) {
        log.warn("keychain: native module unavailable", {
            error: err.message,
        });
        return null;
    }
}
/**
 * Resolve and memoize the backend. Returns `null` when the native module
 * cannot be loaded; callers fall back to JSON in that case.
 */
async function getBackend() {
    if (cacheResolved)
        return cachedBackend;
    cachedBackend = await loadNativeBackend();
    cacheResolved = true;
    return cachedBackend;
}
/**
 * Build the keychain account key for a given project storage key. When the
 * plugin is running against the global accounts file, pass `null` to use
 * the reserved global account key.
 */
export function buildKeychainAccountKey(projectStorageKey) {
    if (!projectStorageKey)
        return GLOBAL_KEYCHAIN_ACCOUNT_KEY;
    return `accounts:${projectStorageKey}`;
}
/**
 * Keychain account key for the FLAGGED-account sibling store. Distinct from the
 * main accounts key so the two blobs never collide. Flagged records carry raw
 * refresh tokens (needed to restore via verify-flagged), so they must get the
 * same keychain protection as the main store when opt-in is enabled.
 */
export function buildKeychainFlaggedKey(projectStorageKey) {
    if (!projectStorageKey)
        return `${GLOBAL_KEYCHAIN_ACCOUNT_KEY}:flagged`;
    return `flagged:${projectStorageKey}`;
}
/**
 * Reads the V3 JSON blob from the OS keychain for the given project storage
 * key. Returns `null` when:
 *   - the native module is unavailable (not installed, missing prebuilt)
 *   - no entry exists yet
 *   - any keychain error occurs
 *
 * The caller MUST treat `null` as "fall back to JSON". Callers must never
 * interpret `null` as "no credentials" unconditionally — it may mean
 * "keychain locked / permission denied" and the JSON file still holds the
 * authoritative copy.
 */
export async function readFromKeychain(projectStorageKey) {
    const backend = await getBackend();
    if (!backend)
        return null;
    const account = buildKeychainAccountKey(projectStorageKey);
    return backend.get(KEYCHAIN_SERVICE_NAME, account);
}
/**
 * Persist the V3 JSON blob to the OS keychain. Returns `{ok:false}` on
 * failure so callers can fall back to JSON. Never throws.
 */
export async function writeToKeychain(projectStorageKey, jsonBlob) {
    const refusal = keychainBlobRefusal(jsonBlob);
    if (refusal) {
        // A refused write can never reach the keychain, so an entry already
        // there can only ever serve stale data — but it is ALSO the only
        // surviving copy until the caller's JSON fallback lands. Deleting it
        // here and failing the fallback write would strand a keychain-native
        // pool entirely (greptile P1 on PR #282). The caller retires the
        // entry once the fallback is durable; `refused` tells it this is the
        // permanent-failure case, not a transient one.
        log.warn("keychain: write refused", { reason: refusal });
        return { ok: false, error: refusal, refused: true };
    }
    const backend = await getBackend();
    if (!backend) {
        return { ok: false, error: "backend unavailable" };
    }
    const account = buildKeychainAccountKey(projectStorageKey);
    try {
        await backend.set(KEYCHAIN_SERVICE_NAME, account, jsonBlob);
        return { ok: true };
    }
    catch (err) {
        const message = err.message;
        log.error("keychain: write failed", {
            service: KEYCHAIN_SERVICE_NAME,
            account,
            error: message,
        });
        return { ok: false, error: message };
    }
}
/**
 * Remove the plugin's keychain entry for the given project key. Never throws
 * — the returned `error` field carries failure detail instead.
 */
export async function deleteFromKeychain(projectStorageKey) {
    const backend = await getBackend();
    if (!backend)
        return { deleted: false, error: "backend unavailable" };
    const account = buildKeychainAccountKey(projectStorageKey);
    try {
        return { deleted: await backend.delete(KEYCHAIN_SERVICE_NAME, account) };
    }
    catch (err) {
        const message = err.message;
        log.warn("keychain: delete failed", {
            service: KEYCHAIN_SERVICE_NAME,
            account,
            error: message,
        });
        return { deleted: false, error: message };
    }
}
/**
 * Flagged-store variants of the keychain read/write/delete helpers. They use
 * the dedicated flagged account key so flagged credentials get the same
 * keychain protection as the main store without colliding with it.
 */
export async function readFlaggedFromKeychain(projectStorageKey) {
    const backend = await getBackend();
    if (!backend)
        return null;
    return backend.get(KEYCHAIN_SERVICE_NAME, buildKeychainFlaggedKey(projectStorageKey));
}
export async function writeFlaggedToKeychain(projectStorageKey, jsonBlob) {
    const refusal = keychainBlobRefusal(jsonBlob);
    if (refusal) {
        // Same deferred-retire contract as writeToKeychain: the stale entry
        // is the only surviving copy until the caller's JSON fallback lands,
        // so it is deleted after — never before — the fallback is durable.
        log.warn("keychain: flagged write refused", { reason: refusal });
        return { ok: false, error: refusal, refused: true };
    }
    const backend = await getBackend();
    if (!backend) {
        return { ok: false, error: "backend unavailable" };
    }
    const account = buildKeychainFlaggedKey(projectStorageKey);
    try {
        await backend.set(KEYCHAIN_SERVICE_NAME, account, jsonBlob);
        return { ok: true };
    }
    catch (err) {
        const message = err.message;
        log.error("keychain: flagged write failed", {
            service: KEYCHAIN_SERVICE_NAME,
            account,
            error: message,
        });
        return { ok: false, error: message };
    }
}
/**
 * Remove the plugin's FLAGGED-account keychain entry for the given project
 * key. Never throws — semantics match {@link deleteFromKeychain}, including
 * the `error` field that distinguishes "absent" from "delete failed".
 *
 * This completes the flagged-store parity: `clearFlaggedAccounts` must
 * retire the keychain copy alongside the JSON file or the next
 * keychain-first load resurrects the cleared records.
 */
export async function deleteFlaggedFromKeychain(projectStorageKey) {
    const backend = await getBackend();
    if (!backend)
        return { deleted: false, error: "backend unavailable" };
    const account = buildKeychainFlaggedKey(projectStorageKey);
    try {
        return { deleted: await backend.delete(KEYCHAIN_SERVICE_NAME, account) };
    }
    catch (err) {
        const message = err.message;
        log.warn("keychain: flagged delete failed", {
            service: KEYCHAIN_SERVICE_NAME,
            account,
            error: message,
        });
        return { deleted: false, error: message };
    }
}
/**
 * Probe the backend end-to-end (write + read + delete a throwaway entry)
 * to confirm the OS keychain is reachable and unlocked. Used by the
 * `codex-keychain status` tool to give the operator a clear yes/no signal
 * instead of waiting until the next real save.
 *
 * Gated on the opt-in flag (F1 post-merge LOW finding): with
 * `CODEX_KEYCHAIN` unset the probe is a no-op that returns `false` without
 * touching the OS keychain. This preserves the "unset -> zero keychain code
 * path" invariant the feature advertises and avoids the first-run macOS
 * "allow/always allow" prompt that `entry.setPassword` can otherwise
 * trigger for users who run `codex-keychain status` without opting in.
 *
 * Pass `env` to override the opt-in lookup in tests.
 */
export async function keychainIsAvailable(env = process.env) {
    if (!isKeychainOptInEnabled(env))
        return false;
    const backend = await getBackend();
    if (!backend)
        return false;
    return backend.isAvailable();
}
/**
 * Parse the `CODEX_KEYCHAIN` environment variable. Only the literal string
 * `"1"` enables the opt-in. Anything else (unset, `"0"`, `"false"`, `""`,
 * `"yes"`, ...) leaves the JSON backend in full control. This mirrors
 * `EnvBooleanSchema`'s contract and is documented in README.md.
 */
export function isKeychainOptInEnabled(env = process.env) {
    return env.CODEX_KEYCHAIN === "1";
}
/**
 * Test-only hook: inject a deterministic backend (typically an in-memory
 * Map-backed stub) and mark the cache as resolved so `getBackend` returns
 * the injected backend without attempting to load the native module.
 *
 * Passing `null` clears the cache so a subsequent call re-runs the lazy
 * loader — useful when a test needs to verify the unavailable-backend
 * branch.
 */
export function _setBackendForTests(backend) {
    cachedBackend = backend;
    cacheResolved = backend !== null;
}
/** Test-only reset to the initial "not yet loaded" state. */
export function _resetBackendForTests() {
    cachedBackend = null;
    cacheResolved = false;
}
//# sourceMappingURL=keychain.js.map