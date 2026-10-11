import { getCircuitBreaker } from "./circuit-breaker.js";
export function getAccountHealth(accounts, now = Date.now()) {
    const accountHealths = accounts.map((acc) => {
        const circuitKey = `account:${acc.accountId ?? acc.index}`;
        const circuit = getCircuitBreaker(circuitKey);
        return {
            index: acc.index,
            email: acc.email,
            accountId: acc.accountId,
            health: acc.health,
            isRateLimited: (acc.rateLimitedUntil ?? 0) > now,
            isCoolingDown: (acc.cooldownUntil ?? 0) > now,
            cooldownReason: acc.cooldownReason,
            lastUsed: acc.lastUsedAt,
            circuitState: circuit.getState(),
        };
    });
    const healthyCount = accountHealths.filter((a) => !a.isRateLimited && !a.isCoolingDown && a.health >= 50).length;
    const rateLimitedCount = accountHealths.filter((a) => a.isRateLimited).length;
    const coolingDownCount = accountHealths.filter((a) => a.isCoolingDown).length;
    let status;
    if (healthyCount === 0 && accounts.length > 0) {
        status = "unhealthy";
    }
    else if (healthyCount < accounts.length) {
        status = "degraded";
    }
    else {
        status = "healthy";
    }
    return {
        status,
        accountCount: accounts.length,
        healthyAccountCount: healthyCount,
        rateLimitedCount,
        coolingDownCount,
        accounts: accountHealths,
        timestamp: now,
    };
}
export function formatHealthReport(health) {
    const lines = [
        `Plugin Health: ${health.status.toUpperCase()}`,
        ``,
        `Accounts: ${health.healthyAccountCount}/${health.accountCount} healthy`,
    ];
    if (health.rateLimitedCount > 0) {
        lines.push(`Rate Limited: ${health.rateLimitedCount}`);
    }
    if (health.coolingDownCount > 0) {
        lines.push(`Cooling Down: ${health.coolingDownCount}`);
    }
    if (health.accounts.length > 0) {
        lines.push(``, `Account Details:`);
        for (const acc of health.accounts) {
            const email = acc.email ?? `Account ${acc.index + 1}`;
            const flags = [];
            if (acc.isRateLimited)
                flags.push("rate-limited");
            if (acc.isCoolingDown)
                flags.push(`cooling-${acc.cooldownReason ?? "down"}`);
            if (acc.circuitState !== "closed")
                flags.push(`circuit-${acc.circuitState}`);
            const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
            lines.push(`  [${acc.index + 1}] ${email}: ${acc.health}%${flagStr}`);
        }
    }
    return lines.join("\n");
}
//# sourceMappingURL=health.js.map