export declare function validateRotation(module: string, fixtures?: unknown): Promise<{
    exitCode: number;
    error: string;
    results: never[];
} | {
    exitCode: number;
    error: null;
    results: {
        name: string;
        passed: boolean;
        accountId: string | null;
        error: string | null;
    }[];
}>;
