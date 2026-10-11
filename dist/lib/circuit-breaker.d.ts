import { CircuitOpenError } from "./errors.js";
export { CircuitOpenError };
export interface CircuitBreakerConfig {
    failureThreshold: number;
    failureWindowMs: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts: number;
}
export declare const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig;
export type CircuitState = "closed" | "open" | "half-open";
/**
 * Non-throwing gate check result returned by {@link CircuitBreaker.canAttempt}.
 *
 * Unlike {@link CircuitBreaker.canExecute} (which throws `CircuitOpenError`
 * when the gate denies the call), `canAttempt` returns this result so the
 * request pipeline can decide whether to short-circuit, rotate accounts,
 * or emit typed errors without a try/catch around every upstream call.
 */
export interface CanAttemptResult {
    /** True when the caller may proceed to the protected dependency. */
    allowed: boolean;
    /** Current breaker state at the time of the check. */
    state: CircuitState;
    /** Populated when `allowed` is false. Stable machine-readable reason. */
    reason?: "open" | "probe-in-flight";
}
export declare class CircuitBreaker {
    private state;
    private failures;
    private lastStateChange;
    private halfOpenAttempts;
    private config;
    constructor(config?: Partial<CircuitBreakerConfig>);
    /**
     * Non-throwing gate check used by the request pipeline.
     *
     * Semantics parallel {@link canExecute} but the caller receives a
     * {@link CanAttemptResult} instead of an exception:
     * - `closed` → `{ allowed: true, state: "closed" }`
     * - `open` past cooldown → auto-transitions to `half-open` then admits a
     *   single probe; returns `{ allowed: true, state: "half-open" }`
     * - `open` within cooldown → `{ allowed: false, state: "open", reason: "open" }`
     * - `half-open` with in-flight probe → `{ allowed: false, state: "half-open", reason: "probe-in-flight" }`
     *
     * HALF-OPEN probe serialization: the first caller increments
     * `halfOpenAttempts` and proceeds; subsequent callers see the budget
     * exhausted and are denied with `probe-in-flight`. The probe slot is
     * released on the next {@link recordSuccess} (closes) or
     * {@link recordFailure} (reopens), which both reset `halfOpenAttempts`.
     *
     * A probe that never reports (caller abort, 401/4xx paths that bypass
     * breaker updates) would otherwise pin the key in half-open forever, so
     * after a full `resetTimeoutMs` with no verdict the slot is abandoned and
     * a fresh probe is admitted.
     */
    canAttempt(): CanAttemptResult;
    canExecute(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
    getState(): CircuitState;
    reset(): void;
    getFailureCount(): number;
    getTimeUntilReset(): number;
    private pruneFailures;
    private transitionToOpen;
    private transitionToHalfOpen;
    private resetToClosed;
}
export declare function getCircuitBreaker(key: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
export declare function resetAllCircuitBreakers(): void;
export declare function clearCircuitBreakers(): void;
/**
 * Aggregate state counts across all registered circuit breakers, grouped by
 * the key prefix (substring before the first `:`). Today the only prefix is
 * `account`, but the grouping is forward-compatible with future per-family
 * breakers. The returned object intentionally contains NO account IDs or
 * identifying keys — only aggregated counters — so it is safe to embed in
 * diagnostic snapshots.
 */
export interface CircuitBreakerStateCounts {
    closed: number;
    open: number;
    halfOpen: number;
}
export interface CircuitBreakerSummary {
    total: CircuitBreakerStateCounts;
    byGroup: Record<string, CircuitBreakerStateCounts>;
}
export declare function getCircuitBreakerSummary(): CircuitBreakerSummary;
