/**
 * Barrel for the session-recovery layer.
 *
 * RC-4 consolidated the `lib/recovery.ts` orchestration module into
 * `lib/recovery/hook.ts` alongside the existing storage / constants / types
 * submodules. This file exists to keep the public surface stable so every
 * consumer that imports from `./recovery` / `../lib/recovery` resolves exactly
 * as it did before the refactor.
 *
 * Split out of the former monolithic module so the filesystem-touching
 * recovery paths stay isolated and independently testable.
 */
// --- Session recovery hook + detection + toast helpers ---------------------
export { detectErrorType, isRecoverableError, getRecoveryToastContent, getRecoverySuccessToast, getRecoveryFailureToast, createSessionRecoveryHook, } from "./recovery/hook.js";
//# sourceMappingURL=recovery.js.map