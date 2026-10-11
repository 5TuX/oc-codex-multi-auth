import { type CircuitState } from "./circuit-breaker.js";
export interface AccountHealth {
    index: number;
    email?: string;
    accountId?: string;
    health: number;
    isRateLimited: boolean;
    isCoolingDown: boolean;
    cooldownReason?: string;
    lastUsed?: number;
    circuitState: CircuitState;
}
export interface PluginHealth {
    status: "healthy" | "degraded" | "unhealthy";
    accountCount: number;
    healthyAccountCount: number;
    rateLimitedCount: number;
    coolingDownCount: number;
    accounts: AccountHealth[];
    timestamp: number;
}
export declare function getAccountHealth(accounts: Array<{
    index: number;
    email?: string;
    accountId?: string;
    health: number;
    rateLimitedUntil?: number;
    cooldownUntil?: number;
    cooldownReason?: string;
    lastUsedAt?: number;
}>, now?: number): PluginHealth;
export declare function formatHealthReport(health: PluginHealth): string;
