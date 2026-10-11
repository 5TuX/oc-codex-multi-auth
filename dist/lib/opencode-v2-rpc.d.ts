import { z } from "zod";
export declare const CodexStatusBadgeSchema: z.ZodObject<{
    planType: z.ZodOptional<z.ZodString>;
    accountIndex: z.ZodOptional<z.ZodNumber>;
    accountCount: z.ZodNumber;
    primary: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        usedPercent: z.ZodOptional<z.ZodNumber>;
        resetAtMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    secondary: z.ZodOptional<z.ZodObject<{
        label: z.ZodString;
        usedPercent: z.ZodOptional<z.ZodNumber>;
        resetAtMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    aggregate: z.ZodOptional<z.ZodObject<{
        accountCount: z.ZodNumber;
        availableCount: z.ZodNumber;
        primary: z.ZodOptional<z.ZodObject<{
            label: z.ZodString;
            usedPercent: z.ZodOptional<z.ZodNumber>;
            resetAtMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        secondary: z.ZodOptional<z.ZodObject<{
            label: z.ZodString;
            usedPercent: z.ZodOptional<z.ZodNumber>;
            resetAtMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CodexStatusBadge = z.infer<typeof CodexStatusBadgeSchema>;
export declare const CodexStatusRpc: {
    readonly id: "oc-codex-multi-auth";
    readonly methods: {
        readonly status: {
            readonly input: z.ZodObject<{
                width: z.ZodNumber;
            }, z.core.$strip>;
            readonly output: z.ZodObject<{
                text: z.ZodString;
                details: z.ZodString;
                showFor: z.ZodEnum<{
                    always: "always";
                    "codex-models": "codex-models";
                }>;
                accountStorage: z.ZodEnum<{
                    global: "global";
                    project: "project";
                }>;
                badge: z.ZodObject<{
                    planType: z.ZodOptional<z.ZodString>;
                    accountIndex: z.ZodOptional<z.ZodNumber>;
                    accountCount: z.ZodNumber;
                    primary: z.ZodOptional<z.ZodObject<{
                        label: z.ZodString;
                        usedPercent: z.ZodOptional<z.ZodNumber>;
                        resetAtMs: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$strip>>;
                    secondary: z.ZodOptional<z.ZodObject<{
                        label: z.ZodString;
                        usedPercent: z.ZodOptional<z.ZodNumber>;
                        resetAtMs: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$strip>>;
                    aggregate: z.ZodOptional<z.ZodObject<{
                        accountCount: z.ZodNumber;
                        availableCount: z.ZodNumber;
                        primary: z.ZodOptional<z.ZodObject<{
                            label: z.ZodString;
                            usedPercent: z.ZodOptional<z.ZodNumber>;
                            resetAtMs: z.ZodOptional<z.ZodNumber>;
                        }, z.core.$strip>>;
                        secondary: z.ZodOptional<z.ZodObject<{
                            label: z.ZodString;
                            usedPercent: z.ZodOptional<z.ZodNumber>;
                            resetAtMs: z.ZodOptional<z.ZodNumber>;
                        }, z.core.$strip>>;
                    }, z.core.$strip>>;
                }, z.core.$strip>;
                glyphMode: z.ZodOptional<z.ZodEnum<{
                    ascii: "ascii";
                    unicode: "unicode";
                    auto: "auto";
                }>>;
                accounts: z.ZodArray<z.ZodObject<{
                    index: z.ZodNumber;
                    label: z.ZodString;
                    active: z.ZodBoolean;
                    enabled: z.ZodBoolean;
                }, z.core.$strip>>;
            }, z.core.$strip>;
        };
    };
    readonly events: {};
};
