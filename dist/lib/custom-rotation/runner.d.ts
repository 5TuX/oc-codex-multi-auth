import type { RotationInput } from "./contract.js";
export type RotationRunResult = {
    readonly accountId: string | null;
    readonly error: "module-path" | "input-limit" | "busy" | "cancelled" | "timeout" | "output-limit" | "policy" | "protocol" | "spawn" | null;
};
/** Trusted code, NOT a sandbox. Bounds import, synchronous select and async work. */
export declare function runRotationPolicy(module: string, context: RotationInput, options?: {
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
}): Promise<RotationRunResult>;
