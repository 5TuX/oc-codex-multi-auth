type BadgeWindow = {
    label: string;
    usedPercent?: number;
    resetAtMs?: number;
};
/** Test hook: forget when each pool was last fetched. */
export declare function resetV2StatusThrottle(): void;
/** Format on the server so remote TUIs never need access to credentials. */
export declare function readV2Status({ width }: {
    width: number;
}): Promise<{
    text: string;
    badge: {
        aggregate?: {
            accountCount: number;
            availableCount: number;
            primary: BadgeWindow | undefined;
            secondary: BadgeWindow | undefined;
        } | undefined;
        accountCount: number;
        primary: BadgeWindow | undefined;
        secondary: BadgeWindow | undefined;
        accountIndex?: number | undefined;
        planType?: string | undefined;
    };
    glyphMode: "ascii" | "unicode" | "auto";
    accountStorage: "global" | "project";
    accounts: {
        index: number;
        label: string;
        active: boolean;
        enabled: boolean;
    }[];
    details: string;
    showFor: import("./config.js").QuotaStatusAudience;
}>;
export {};
