/**
 * `codex-setup` tool — beginner onboarding checklist + optional wizard.
 * Extracted from `index.ts` per RC-1 Phase 2.
 */
import { tool } from "@opencode-ai/plugin/tool";
import { withToolErrorEnvelope } from "./output.js";
export function createCodexSetupTool(ctx) {
    const { resolveUiRuntime, buildSetupChecklistState, renderSetupChecklistOutput, runSetupWizard, } = ctx;
    const definition = tool({
        description: "Beginner checklist for first-time setup and account readiness.",
        args: {
            wizard: tool.schema
                .boolean()
                .optional()
                .describe("Launch menu-driven setup wizard when terminal supports it."),
        },
        async execute({ wizard } = {}) {
            const ui = resolveUiRuntime();
            const state = await buildSetupChecklistState();
            if (wizard) {
                return runSetupWizard(ui, state);
            }
            return renderSetupChecklistOutput(ui, state);
        },
    });
    return withToolErrorEnvelope("codex-setup", definition);
}
//# sourceMappingURL=codex-setup.js.map