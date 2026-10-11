import { Rpc } from "@opencode/plugin/rpc";
import { z } from "zod";
const quotaBadgeWindowSchema = z.object({
    label: z.string(),
    usedPercent: z.number().min(0).max(100).optional(),
    resetAtMs: z.number().finite().optional(),
});
export const CodexStatusBadgeSchema = z.object({
    planType: z.string().optional(),
    accountIndex: z.number().int().min(1).optional(),
    accountCount: z.number().int().min(0),
    primary: quotaBadgeWindowSchema.optional(),
    secondary: quotaBadgeWindowSchema.optional(),
    aggregate: z.object({
        accountCount: z.number().int().min(0),
        availableCount: z.number().int().min(0),
        primary: quotaBadgeWindowSchema.optional(),
        secondary: quotaBadgeWindowSchema.optional(),
    }).optional(),
});
export const CodexStatusRpc = Rpc.define({
    id: "oc-codex-multi-auth",
    methods: {
        status: {
            input: z.object({ width: z.number().int().min(1).max(1000) }),
            output: z.object({
                text: z.string(), details: z.string(), showFor: z.enum(["always", "codex-models"]),
                accountStorage: z.enum(["project", "global"]),
                badge: CodexStatusBadgeSchema,
                // Configured glyph mode, sent unresolved so a remote TUI answers
                // `auto` against ITS environment, not the service's.
                glyphMode: z.enum(["ascii", "unicode", "auto"]).optional(),
                accounts: z.array(z.object({ index: z.number().int(), label: z.string(), active: z.boolean(), enabled: z.boolean() })),
            }),
        },
    },
    events: {},
});
//# sourceMappingURL=opencode-v2-rpc.js.map