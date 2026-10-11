import { createAuthorizationFlow as defaultCreateAuthorizationFlow, exchangeAuthorizationCode as defaultExchangeAuthorizationCode, REDIRECT_URI, } from "./auth.js";
import { startLocalOAuthServer as defaultStartLocalOAuthServer } from "./server.js";
import { openBrowserUrl as defaultOpenBrowserUrl } from "./browser.js";
const DEFAULT_DEPS = {
    createAuthorizationFlow: defaultCreateAuthorizationFlow,
    startLocalOAuthServer: defaultStartLocalOAuthServer,
    openBrowserUrl: defaultOpenBrowserUrl,
    exchangeAuthorizationCode: defaultExchangeAuthorizationCode,
};
/**
 * Start one loopback OAuth session for either the automatic or manual browser
 * choice. See the module docstring for the full lifecycle contract.
 */
export async function startLoopbackFlow(options) {
    const deps = {
        ...DEFAULT_DEPS,
        ...(options.deps ?? {}),
    };
    const flow = await deps.createAuthorizationFlow(options.forceNewLogin ? { forceNewLogin: true } : undefined);
    // A throw is the same outcome as a listener that never bound, and this
    // module's contract is a typed marker rather than an exception: without the
    // catch, an `http.createServer` failure escapes the OpenCode auth method as
    // an unhandled rejection instead of the "retry with Device Code / Manual URL
    // Paste" guidance the caller maps `listener_unavailable` to.
    let server = null;
    try {
        server = await deps.startLocalOAuthServer({ state: flow.state });
    }
    catch {
        server = null;
    }
    if (!server?.ready) {
        try {
            server?.close();
        }
        catch {
            // listener never bound: close is best-effort and non-fatal
        }
        return {
            type: "unavailable",
            lifecycle: "listener_unavailable",
        };
    }
    const readyServer = server;
    let closed = false;
    const closeOnce = () => {
        if (closed)
            return;
        closed = true;
        try {
            readyServer.close();
        }
        catch {
            // a listener that will not close must not mask the outcome the
            // caller is waiting on; the close contract is best-effort
        }
    };
    const callbackOutcome = (async () => {
        try {
            const callback = await readyServer.waitForCode(flow.state);
            return callback
                ? { type: "code", code: callback.code }
                : { type: "cancelled" };
        }
        catch (error) {
            return { type: "wait_failed", error };
        }
        finally {
            closeOnce();
        }
    })();
    // A failed launch does not end the session. The listener is bound and its
    // deadline is already running, so the user can still finish by opening the
    // URL themselves — which is exactly what happens on a Linux/WSL box with no
    // `xdg-open` on PATH, where `openBrowserUrl` returns false for every login.
    // Closing here would take that away and leave nothing to retry with.
    let browserOpened = true;
    if (options.openBrowser) {
        try {
            browserOpened = deps.openBrowserUrl(flow.url);
        }
        catch {
            browserOpened = false;
        }
    }
    const waitAndExchange = async () => {
        const outcome = await callbackOutcome;
        if (outcome.type === "cancelled") {
            return {
                type: "cancelled",
                lifecycle: "callback_timeout_or_cancelled",
            };
        }
        if (outcome.type === "wait_failed") {
            throw outcome.error;
        }
        try {
            return await deps.exchangeAuthorizationCode(outcome.code, flow.pkce.verifier, REDIRECT_URI);
        }
        finally {
            closeOnce();
        }
    };
    return {
        type: "ready",
        url: flow.url,
        browserOpened,
        close: closeOnce,
        waitAndExchange,
    };
}
//# sourceMappingURL=loopback-flow.js.map