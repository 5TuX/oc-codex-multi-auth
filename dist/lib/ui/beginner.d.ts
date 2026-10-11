export type BeginnerDiagnosticSeverity = "ok" | "warning" | "error";
export interface BeginnerAccountSnapshot {
    index: number;
    label: string;
    accountLabel?: string;
    enabled: boolean;
    isActive: boolean;
    rateLimitedUntil: number | null;
    coolingDownUntil: number | null;
    refreshVerificationFailed?: boolean;
    /** `describeDisabledReason` output when `enabled` is false; null otherwise. */
    disabledReason?: string | null;
}
export interface BeginnerRuntimeSnapshot {
    totalRequests: number;
    failedRequests: number;
    rateLimitedResponses: number;
    authRefreshFailures: number;
    serverErrors: number;
    networkErrors: number;
    lastErrorCategory: string | null;
    promptCacheEnabledRequests: number;
    promptCacheMissingRequests: number;
    lastPromptCacheKey: string | null;
}
export interface BeginnerChecklistItem {
    id: string;
    done: boolean;
    label: string;
    detail: string;
    command?: string;
}
export interface BeginnerDiagnosticFinding {
    severity: BeginnerDiagnosticSeverity;
    code: string;
    summary: string;
    action: string;
}
export interface BeginnerAccountSummary {
    total: number;
    active: number;
    enabled: number;
    disabled: number;
    rateLimited: number;
    coolingDown: number;
    blocked: number;
    healthy: number;
    unlabeled: number;
}
export declare function formatPromptCacheKey(value: string | null | undefined): string;
export declare function formatPromptCacheSnapshot(runtime: Pick<BeginnerRuntimeSnapshot, "promptCacheEnabledRequests" | "promptCacheMissingRequests" | "lastPromptCacheKey">): string;
export declare function summarizeBeginnerAccounts(accounts: BeginnerAccountSnapshot[], now: number): BeginnerAccountSummary;
export declare function buildBeginnerChecklist(accounts: BeginnerAccountSnapshot[], now: number): BeginnerChecklistItem[];
export declare function explainRuntimeErrorCategory(category: string | null): string | null;
export declare function buildBeginnerDoctorFindings(input: {
    accounts: BeginnerAccountSnapshot[];
    now: number;
    runtime: BeginnerRuntimeSnapshot;
}): BeginnerDiagnosticFinding[];
export declare function recommendBeginnerNextAction(input: {
    accounts: BeginnerAccountSnapshot[];
    now: number;
    runtime: BeginnerRuntimeSnapshot;
}): string;
