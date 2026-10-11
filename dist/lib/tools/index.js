/**
 * Tool registry.
 *
 * `ToolContext` bundles the plugin-closure state and helpers each
 * `codex-*` tool needs. The plugin builds a `ToolContext` inside
 * `OpenAIOAuthPlugin` and passes it to `createToolRegistry` so that every
 * tool factory can access closure state (mutable refs, helpers) without
 * living inside the plugin function body.
 *
 * **Status**: all registered `codex-*` tools live in per-tool modules under
 * `lib/tools/`. The plugin entrypoint wires the shared context once and
 * exposes the returned registry on the OpenCode plugin surface.
 *
 * See `lib/tools/AGENTS.md` for the per-tool factory pattern.
 */
import { createCodexHelpTool } from "./codex-help.js";
import { createCodexNextTool } from "./codex-next.js";
import { createCodexSetupTool } from "./codex-setup.js";
import { createCodexListTool } from "./codex-list.js";
import { createCodexSwitchTool } from "./codex-switch.js";
import { createCodexWarmTool } from "./codex-warm.js";
import { createCodexStatusTool } from "./codex-status.js";
import { createCodexLimitsTool } from "./codex-limits.js";
import { createCodexResetTool } from "./codex-reset.js";
import { createCodexMetricsTool } from "./codex-metrics.js";
import { createCodexDoctorTool } from "./codex-doctor.js";
import { createCodexLabelTool } from "./codex-label.js";
import { createCodexTagTool } from "./codex-tag.js";
import { createCodexPoolTool } from "./codex-pool.js";
import { createCodexNoteTool } from "./codex-note.js";
import { createCodexDashboardTool } from "./codex-dashboard.js";
import { createCodexHealthTool } from "./codex-health.js";
import { createCodexEnableTool } from "./codex-enable.js";
import { createCodexRemoveTool } from "./codex-remove.js";
import { createCodexRefreshTool } from "./codex-refresh.js";
import { createCodexExportTool } from "./codex-export.js";
import { createCodexImportTool } from "./codex-import.js";
import { createCodexDiagTool } from "./codex-diag.js";
import { createCodexDiffTool } from "./codex-diff.js";
import { createCodexKeychainTool } from "./codex-keychain.js";
export { createCodexDiagTool } from "./codex-diag.js";
export { createCodexDiffTool } from "./codex-diff.js";
export { createCodexKeychainTool } from "./codex-keychain.js";
export function createToolRegistry(ctx) {
    return {
        "codex-list": createCodexListTool(ctx),
        "codex-switch": createCodexSwitchTool(ctx),
        "codex-warm": createCodexWarmTool(ctx),
        "codex-status": createCodexStatusTool(ctx),
        "codex-limits": createCodexLimitsTool(ctx),
        "codex-reset": createCodexResetTool(ctx),
        "codex-metrics": createCodexMetricsTool(ctx),
        "codex-help": createCodexHelpTool(ctx),
        "codex-setup": createCodexSetupTool(ctx),
        "codex-doctor": createCodexDoctorTool(ctx),
        "codex-next": createCodexNextTool(ctx),
        "codex-label": createCodexLabelTool(ctx),
        "codex-tag": createCodexTagTool(ctx),
        "codex-pool": createCodexPoolTool(ctx),
        "codex-note": createCodexNoteTool(ctx),
        "codex-dashboard": createCodexDashboardTool(ctx),
        "codex-health": createCodexHealthTool(ctx),
        "codex-enable": createCodexEnableTool(ctx),
        "codex-remove": createCodexRemoveTool(ctx),
        "codex-refresh": createCodexRefreshTool(ctx),
        "codex-export": createCodexExportTool(ctx),
        "codex-import": createCodexImportTool(ctx),
        "codex-diag": createCodexDiagTool(ctx),
        "codex-diff": createCodexDiffTool(ctx),
        "codex-keychain": createCodexKeychainTool(ctx),
    };
}
//# sourceMappingURL=index.js.map