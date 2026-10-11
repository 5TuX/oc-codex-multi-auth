/**
 * OAuth callback loopback constants.
 *
 * The Codex OAuth client registration uses `localhost` in redirect_uri.
 * The local callback server binds both concrete loopback interfaces so Windows
 * dual-stack resolution can land on either 127.0.0.1 or ::1 without dropping
 * the authorization code.
 *
 * This module is pure: it performs no I/O, persistence, or logging, so
 * centralizing these values does not introduce new Windows lock or
 * token-redaction surfaces.
 */
export declare const OAUTH_CALLBACK_LOOPBACK_HOST = "127.0.0.1";
export declare const OAUTH_CALLBACK_BIND_HOSTS: readonly ["127.0.0.1", "::1"];
export declare const OAUTH_CALLBACK_PORT = 1455;
export declare const OAUTH_CALLBACK_PATH = "/auth/callback";
export declare const OAUTH_CALLBACK_BIND_URL = "http://127.0.0.1:1455";
