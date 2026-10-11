import type { ModelFamily } from "../prompts/codex.js";
import type { ManagedAccount } from "../accounts/state.js";
import { type RotationObservations } from "./observations.js";
export type CustomSelectionRequest = {
    readonly family: ModelFamily;
    readonly model?: string | null;
    readonly preferredAccountIds?: readonly string[];
    readonly poolMode?: "preferred" | "strict";
    readonly excludedIndices?: ReadonlySet<number>;
};
export type CustomSelectionHost = {
    readonly candidates: (request: CustomSelectionRequest) => readonly ManagedAccount[];
    readonly accept: (account: ManagedAccount, request: CustomSelectionRequest) => ManagedAccount | null;
    readonly current: (family: ModelFamily) => ManagedAccount | null;
};
export declare function selectCustomAccount(host: CustomSelectionHost, request: CustomSelectionRequest, policy: {
    readonly module: string | undefined;
    readonly observations: RotationObservations;
    readonly scope: string;
    readonly currentScope?: () => string;
    readonly signal?: AbortSignal;
    readonly requestSignal?: AbortSignal;
}): Promise<ManagedAccount | null>;
