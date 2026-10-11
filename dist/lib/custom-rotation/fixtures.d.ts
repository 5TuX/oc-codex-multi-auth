import { z } from "zod";
import type { RotationAccount } from "./contract.js";
export declare const RotationInputSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    now: z.ZodNumber;
    model: z.ZodNullable<z.ZodString>;
    currentAccountId: z.ZodNullable<z.ZodString>;
    accounts: z.ZodArray<z.ZodPipe<z.ZodObject<{
        id: z.ZodString;
        lastUsed: z.ZodOptional<z.ZodNumber>;
        plan: z.ZodOptional<z.ZodObject<{
            value: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
                unknown: "unknown";
                stale: "stale";
                fresh: "fresh";
                "not-applicable": "not-applicable";
            }>;
            observedAt: z.ZodNullable<z.ZodNumber>;
            expiresAt: z.ZodNullable<z.ZodNumber>;
            source: z.ZodNullable<z.ZodEnum<{
                headers: "headers";
                usage: "usage";
                "reset-list": "reset-list";
            }>>;
            scope: z.ZodEnum<{
                unknown: "unknown";
                workspace: "workspace";
                seat: "seat";
            }>;
        }, z.core.$strict>>;
        primary: z.ZodOptional<z.ZodObject<{
            usedPercent: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
            resetAtMs: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
            windowMinutes: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
        }, z.core.$strict>>;
        secondary: z.ZodOptional<z.ZodObject<{
            usedPercent: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
            resetAtMs: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
            windowMinutes: z.ZodObject<{
                value: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    unknown: "unknown";
                    stale: "stale";
                    fresh: "fresh";
                    "not-applicable": "not-applicable";
                }>;
                observedAt: z.ZodNullable<z.ZodNumber>;
                expiresAt: z.ZodNullable<z.ZodNumber>;
                source: z.ZodNullable<z.ZodEnum<{
                    headers: "headers";
                    usage: "usage";
                    "reset-list": "reset-list";
                }>>;
                scope: z.ZodEnum<{
                    unknown: "unknown";
                    workspace: "workspace";
                    seat: "seat";
                }>;
            }, z.core.$strict>;
        }, z.core.$strict>>;
        credits: z.ZodOptional<z.ZodObject<{
            value: z.ZodNullable<z.ZodObject<{
                balance: z.ZodNullable<z.ZodString>;
                unlimited: z.ZodBoolean;
            }, z.core.$strict>>;
            status: z.ZodEnum<{
                unknown: "unknown";
                stale: "stale";
                fresh: "fresh";
                "not-applicable": "not-applicable";
            }>;
            observedAt: z.ZodNullable<z.ZodNumber>;
            expiresAt: z.ZodNullable<z.ZodNumber>;
            source: z.ZodNullable<z.ZodEnum<{
                headers: "headers";
                usage: "usage";
                "reset-list": "reset-list";
            }>>;
            scope: z.ZodEnum<{
                unknown: "unknown";
                workspace: "workspace";
                seat: "seat";
            }>;
        }, z.core.$strict>>;
        resetCredits: z.ZodOptional<z.ZodObject<{
            value: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<{
                unknown: "unknown";
                stale: "stale";
                fresh: "fresh";
                "not-applicable": "not-applicable";
            }>;
            observedAt: z.ZodNullable<z.ZodNumber>;
            expiresAt: z.ZodNullable<z.ZodNumber>;
            source: z.ZodNullable<z.ZodEnum<{
                headers: "headers";
                usage: "usage";
                "reset-list": "reset-list";
            }>>;
            scope: z.ZodEnum<{
                unknown: "unknown";
                workspace: "workspace";
                seat: "seat";
            }>;
        }, z.core.$strict>>;
    }, z.core.$strict>, z.ZodTransform<RotationAccount, {
        id: string;
        lastUsed?: number | undefined;
        plan?: {
            value: string | null;
            status: "unknown" | "stale" | "fresh" | "not-applicable";
            observedAt: number | null;
            expiresAt: number | null;
            source: "headers" | "usage" | "reset-list" | null;
            scope: "unknown" | "workspace" | "seat";
        } | undefined;
        primary?: {
            usedPercent: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
            resetAtMs: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
            windowMinutes: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
        } | undefined;
        secondary?: {
            usedPercent: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
            resetAtMs: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
            windowMinutes: {
                value: number | null;
                status: "unknown" | "stale" | "fresh" | "not-applicable";
                observedAt: number | null;
                expiresAt: number | null;
                source: "headers" | "usage" | "reset-list" | null;
                scope: "unknown" | "workspace" | "seat";
            };
        } | undefined;
        credits?: {
            value: {
                balance: string | null;
                unlimited: boolean;
            } | null;
            status: "unknown" | "stale" | "fresh" | "not-applicable";
            observedAt: number | null;
            expiresAt: number | null;
            source: "headers" | "usage" | "reset-list" | null;
            scope: "unknown" | "workspace" | "seat";
        } | undefined;
        resetCredits?: {
            value: number | null;
            status: "unknown" | "stale" | "fresh" | "not-applicable";
            observedAt: number | null;
            expiresAt: number | null;
            source: "headers" | "usage" | "reset-list" | null;
            scope: "unknown" | "workspace" | "seat";
        } | undefined;
    }>>>;
}, z.core.$strict>;
export declare const RotationFixturesSchema: z.ZodObject<{
    scenarios: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        input: z.ZodObject<{
            version: z.ZodLiteral<1>;
            now: z.ZodNumber;
            model: z.ZodNullable<z.ZodString>;
            currentAccountId: z.ZodNullable<z.ZodString>;
            accounts: z.ZodArray<z.ZodPipe<z.ZodObject<{
                id: z.ZodString;
                lastUsed: z.ZodOptional<z.ZodNumber>;
                plan: z.ZodOptional<z.ZodObject<{
                    value: z.ZodNullable<z.ZodString>;
                    status: z.ZodEnum<{
                        unknown: "unknown";
                        stale: "stale";
                        fresh: "fresh";
                        "not-applicable": "not-applicable";
                    }>;
                    observedAt: z.ZodNullable<z.ZodNumber>;
                    expiresAt: z.ZodNullable<z.ZodNumber>;
                    source: z.ZodNullable<z.ZodEnum<{
                        headers: "headers";
                        usage: "usage";
                        "reset-list": "reset-list";
                    }>>;
                    scope: z.ZodEnum<{
                        unknown: "unknown";
                        workspace: "workspace";
                        seat: "seat";
                    }>;
                }, z.core.$strict>>;
                primary: z.ZodOptional<z.ZodObject<{
                    usedPercent: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                    resetAtMs: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                    windowMinutes: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                }, z.core.$strict>>;
                secondary: z.ZodOptional<z.ZodObject<{
                    usedPercent: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                    resetAtMs: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                    windowMinutes: z.ZodObject<{
                        value: z.ZodNullable<z.ZodNumber>;
                        status: z.ZodEnum<{
                            unknown: "unknown";
                            stale: "stale";
                            fresh: "fresh";
                            "not-applicable": "not-applicable";
                        }>;
                        observedAt: z.ZodNullable<z.ZodNumber>;
                        expiresAt: z.ZodNullable<z.ZodNumber>;
                        source: z.ZodNullable<z.ZodEnum<{
                            headers: "headers";
                            usage: "usage";
                            "reset-list": "reset-list";
                        }>>;
                        scope: z.ZodEnum<{
                            unknown: "unknown";
                            workspace: "workspace";
                            seat: "seat";
                        }>;
                    }, z.core.$strict>;
                }, z.core.$strict>>;
                credits: z.ZodOptional<z.ZodObject<{
                    value: z.ZodNullable<z.ZodObject<{
                        balance: z.ZodNullable<z.ZodString>;
                        unlimited: z.ZodBoolean;
                    }, z.core.$strict>>;
                    status: z.ZodEnum<{
                        unknown: "unknown";
                        stale: "stale";
                        fresh: "fresh";
                        "not-applicable": "not-applicable";
                    }>;
                    observedAt: z.ZodNullable<z.ZodNumber>;
                    expiresAt: z.ZodNullable<z.ZodNumber>;
                    source: z.ZodNullable<z.ZodEnum<{
                        headers: "headers";
                        usage: "usage";
                        "reset-list": "reset-list";
                    }>>;
                    scope: z.ZodEnum<{
                        unknown: "unknown";
                        workspace: "workspace";
                        seat: "seat";
                    }>;
                }, z.core.$strict>>;
                resetCredits: z.ZodOptional<z.ZodObject<{
                    value: z.ZodNullable<z.ZodNumber>;
                    status: z.ZodEnum<{
                        unknown: "unknown";
                        stale: "stale";
                        fresh: "fresh";
                        "not-applicable": "not-applicable";
                    }>;
                    observedAt: z.ZodNullable<z.ZodNumber>;
                    expiresAt: z.ZodNullable<z.ZodNumber>;
                    source: z.ZodNullable<z.ZodEnum<{
                        headers: "headers";
                        usage: "usage";
                        "reset-list": "reset-list";
                    }>>;
                    scope: z.ZodEnum<{
                        unknown: "unknown";
                        workspace: "workspace";
                        seat: "seat";
                    }>;
                }, z.core.$strict>>;
            }, z.core.$strict>, z.ZodTransform<RotationAccount, {
                id: string;
                lastUsed?: number | undefined;
                plan?: {
                    value: string | null;
                    status: "unknown" | "stale" | "fresh" | "not-applicable";
                    observedAt: number | null;
                    expiresAt: number | null;
                    source: "headers" | "usage" | "reset-list" | null;
                    scope: "unknown" | "workspace" | "seat";
                } | undefined;
                primary?: {
                    usedPercent: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                    resetAtMs: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                    windowMinutes: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                } | undefined;
                secondary?: {
                    usedPercent: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                    resetAtMs: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                    windowMinutes: {
                        value: number | null;
                        status: "unknown" | "stale" | "fresh" | "not-applicable";
                        observedAt: number | null;
                        expiresAt: number | null;
                        source: "headers" | "usage" | "reset-list" | null;
                        scope: "unknown" | "workspace" | "seat";
                    };
                } | undefined;
                credits?: {
                    value: {
                        balance: string | null;
                        unlimited: boolean;
                    } | null;
                    status: "unknown" | "stale" | "fresh" | "not-applicable";
                    observedAt: number | null;
                    expiresAt: number | null;
                    source: "headers" | "usage" | "reset-list" | null;
                    scope: "unknown" | "workspace" | "seat";
                } | undefined;
                resetCredits?: {
                    value: number | null;
                    status: "unknown" | "stale" | "fresh" | "not-applicable";
                    observedAt: number | null;
                    expiresAt: number | null;
                    source: "headers" | "usage" | "reset-list" | null;
                    scope: "unknown" | "workspace" | "seat";
                } | undefined;
            }>>>;
        }, z.core.$strict>;
        expectedAccountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
