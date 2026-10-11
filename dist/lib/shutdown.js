const SHUTDOWN_STATE_KEY = Symbol.for("oc-codex-multi-auth:shutdown");
function handleSignal(signal) {
    const drained = runCleanup();
    // A guest in someone else's process: run cleanup, then let the host
    // finish its own shutdown. Exiting here is what broke #187.
    if (!state.ownsProcess)
        return;
    void drained.finally(() => {
        process.exit(signal === "SIGTERM" ? 143 : 130);
    });
}
const state = (() => {
    const holder = globalThis;
    const existing = holder[SHUTDOWN_STATE_KEY];
    if (existing)
        return existing;
    const created = {
        cleanupFunctions: [],
        ownsProcess: false,
        inFlight: null,
        onSigint: () => handleSignal("SIGINT"),
        onSigterm: () => handleSignal("SIGTERM"),
        onBeforeExit: () => {
            void runCleanup();
        },
    };
    holder[SHUTDOWN_STATE_KEY] = created;
    return created;
})();
export function setShutdownOwnsProcess(owns) {
    state.ownsProcess = owns;
}
export function registerCleanup(fn) {
    state.cleanupFunctions.push(fn);
    ensureShutdownHandler();
}
export function unregisterCleanup(fn) {
    const index = state.cleanupFunctions.indexOf(fn);
    if (index !== -1) {
        state.cleanupFunctions.splice(index, 1);
    }
}
export function runCleanup() {
    if (state.inFlight)
        return state.inFlight;
    const fns = [...state.cleanupFunctions];
    state.cleanupFunctions.length = 0;
    state.inFlight = (async () => {
        for (const fn of fns) {
            try {
                await fn();
            }
            catch {
                // Ignore cleanup errors during shutdown
            }
        }
    })().finally(() => {
        state.inFlight = null;
    });
    return state.inFlight;
}
function ensureShutdownHandler() {
    // `process.once` wraps the listener but `process.listeners` unwraps it, so
    // identity comparison against the stored originals tells whether each
    // handler is still attached. A host or test that stripped them
    // (removeAllListeners) gets them re-attached here instead of deduped away
    // behind a stale boolean.
    if (!process.listeners("SIGINT").includes(state.onSigint)) {
        process.once("SIGINT", state.onSigint);
    }
    if (!process.listeners("SIGTERM").includes(state.onSigterm)) {
        process.once("SIGTERM", state.onSigterm);
    }
    if (!process.listeners("beforeExit").includes(state.onBeforeExit)) {
        process.once("beforeExit", state.onBeforeExit);
    }
}
export function getCleanupCount() {
    return state.cleanupFunctions.length;
}
//# sourceMappingURL=shutdown.js.map