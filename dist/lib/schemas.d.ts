/**
 * Zod schemas for runtime validation.
 * These are the single source of truth for data structures.
 * Types are inferred from schemas using z.infer.
 */
import { z } from "zod";
export declare const QuotaStatusScreenSchema: z.ZodEnum<{
    active: "active";
    overview: "overview";
    resets: "resets";
    credits: "credits";
}>;
/**
 * Ceiling for millisecond-duration settings (timeouts, delays, poll
 * intervals). Anything past a day is indistinguishable from "never": a
 * `fetchTimeoutMs` of `1e15` is not a long timeout, it is an infinite hang
 * spelled with digits. Fields whose contract is "0 = unlimited"
 * (`retryAllAccountsMaxWaitMs`) deliberately do NOT take this bound — there
 * unboundedness is the documented semantic, not an accident.
 */
export declare const MAX_CONFIG_DURATION_MS = 86400000;
export declare const PluginConfigSchema: z.ZodObject<{
    codexMode: z.ZodOptional<z.ZodBoolean>;
    requestTransformMode: z.ZodOptional<z.ZodEnum<{
        native: "native";
        legacy: "legacy";
    }>>;
    codexTuiV2: z.ZodOptional<z.ZodBoolean>;
    codexTuiColorProfile: z.ZodOptional<z.ZodEnum<{
        truecolor: "truecolor";
        ansi16: "ansi16";
        ansi256: "ansi256";
    }>>;
    codexTuiGlyphMode: z.ZodOptional<z.ZodEnum<{
        ascii: "ascii";
        unicode: "unicode";
        auto: "auto";
    }>>;
    maskEmail: z.ZodOptional<z.ZodBoolean>;
    maskEmailInQuotaDetails: z.ZodOptional<z.ZodBoolean>;
    quotaDisplay: z.ZodOptional<z.ZodEnum<{
        free: "free";
        used: "used";
    }>>;
    beginnerSafeMode: z.ZodOptional<z.ZodBoolean>;
    fastSession: z.ZodOptional<z.ZodBoolean>;
    fastSessionStrategy: z.ZodOptional<z.ZodEnum<{
        hybrid: "hybrid";
        always: "always";
    }>>;
    rotationStrategy: z.ZodOptional<z.ZodEnum<{
        sticky: "sticky";
        hybrid: "hybrid";
        "round-robin": "round-robin";
        custom: "custom";
    }>>;
    spendCredits: z.ZodOptional<z.ZodBoolean>;
    customRotation: z.ZodOptional<z.ZodObject<{
        module: z.ZodString;
    }, z.core.$strip>>;
    modelAccountPools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    modelAccountPoolModes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<{
        preferred: "preferred";
        strict: "strict";
    }>>>;
    fastSessionMaxInputItems: z.ZodOptional<z.ZodNumber>;
    retryProfile: z.ZodOptional<z.ZodEnum<{
        conservative: "conservative";
        balanced: "balanced";
        aggressive: "aggressive";
    }>>;
    retryBudgetOverrides: z.ZodOptional<z.ZodObject<{
        authRefresh: z.ZodOptional<z.ZodNumber>;
        network: z.ZodOptional<z.ZodNumber>;
        server: z.ZodOptional<z.ZodNumber>;
        rateLimitShort: z.ZodOptional<z.ZodNumber>;
        rateLimitGlobal: z.ZodOptional<z.ZodNumber>;
        emptyResponse: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    retryAllAccountsRateLimited: z.ZodOptional<z.ZodBoolean>;
    retryAllAccountsMaxWaitMs: z.ZodOptional<z.ZodNumber>;
    retryAllAccountsMaxRetries: z.ZodOptional<z.ZodNumber>;
    unsupportedCodexPolicy: z.ZodOptional<z.ZodEnum<{
        strict: "strict";
        fallback: "fallback";
    }>>;
    fallbackOnUnsupportedCodexModel: z.ZodOptional<z.ZodBoolean>;
    fallbackToGpt52OnUnsupportedGpt53: z.ZodOptional<z.ZodBoolean>;
    unsupportedCodexFallbackChain: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    tokenRefreshSkewMs: z.ZodOptional<z.ZodNumber>;
    rateLimitToastDebounceMs: z.ZodOptional<z.ZodNumber>;
    toastDurationMs: z.ZodOptional<z.ZodNumber>;
    accountToasts: z.ZodOptional<z.ZodBoolean>;
    perProjectAccounts: z.ZodOptional<z.ZodBoolean>;
    credentialSnapshots: z.ZodOptional<z.ZodBoolean>;
    credentialSnapshotsMaxCount: z.ZodOptional<z.ZodNumber>;
    sessionRecovery: z.ZodOptional<z.ZodBoolean>;
    autoResume: z.ZodOptional<z.ZodBoolean>;
    autoUpdate: z.ZodOptional<z.ZodBoolean>;
    parallelProbing: z.ZodOptional<z.ZodBoolean>;
    parallelProbingMaxConcurrency: z.ZodOptional<z.ZodNumber>;
    emptyResponseMaxRetries: z.ZodOptional<z.ZodNumber>;
    emptyResponseRetryDelayMs: z.ZodOptional<z.ZodNumber>;
    pidOffsetEnabled: z.ZodOptional<z.ZodBoolean>;
    fetchTimeoutMs: z.ZodOptional<z.ZodNumber>;
    streamStallTimeoutMs: z.ZodOptional<z.ZodNumber>;
    maxStreamDurationMs: z.ZodOptional<z.ZodNumber>;
    quotaNotifications: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        autoProtectCredits: z.ZodOptional<z.ZodBoolean>;
        autoRedeemResets: z.ZodOptional<z.ZodBoolean>;
        autoRedeemResetsBelowPercent: z.ZodOptional<z.ZodNumber>;
        intervalMs: z.ZodOptional<z.ZodNumber>;
        notifyEveryCheck: z.ZodOptional<z.ZodBoolean>;
        thresholds: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strip>>;
    quotaStatus: z.ZodOptional<z.ZodObject<{
        mode: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
            active: "active";
            overview: "overview";
            resets: "resets";
            credits: "credits";
        }>, z.ZodArray<z.ZodEnum<{
            active: "active";
            overview: "overview";
            resets: "resets";
            credits: "credits";
        }>>]>>;
        rotateMs: z.ZodOptional<z.ZodNumber>;
        layout: z.ZodOptional<z.ZodEnum<{
            accounts: "accounts";
            aggregate: "aggregate";
            count: "count";
            total: "total";
        }>>;
        accountNames: z.ZodOptional<z.ZodEnum<{
            number: "number";
            none: "none";
            label: "label";
        }>>;
        order: z.ZodOptional<z.ZodEnum<{
            number: "number";
            "most-used": "most-used";
            "least-used": "least-used";
            "renewing-earliest": "renewing-earliest";
            "renewing-latest": "renewing-latest";
        }>>;
        multipliers: z.ZodOptional<z.ZodBoolean>;
        allotment: z.ZodOptional<z.ZodBoolean>;
        resetTimes: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
            low: "low";
            always: "always";
            never: "never";
        }>, z.ZodBoolean]>>;
        resetCredits: z.ZodOptional<z.ZodBoolean>;
        recovery: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"all">]>>;
        resetsMinUsedPercent: z.ZodOptional<z.ZodNumber>;
        accounts: z.ZodOptional<z.ZodBoolean>;
        rows: z.ZodOptional<z.ZodNumber>;
        showFor: z.ZodOptional<z.ZodEnum<{
            always: "always";
            "codex-models": "codex-models";
        }>>;
    }, z.core.$strip>>;
    limitsSort: z.ZodOptional<z.ZodObject<{
        by: z.ZodOptional<z.ZodEnum<{
            account: "account";
            usage: "usage";
            reset: "reset";
        }>>;
        direction: z.ZodOptional<z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PluginConfigFromSchema = z.infer<typeof PluginConfigSchema>;
/**
 * Source of the accountId used for ChatGPT requests.
 */
export declare const AccountIdSourceSchema: z.ZodEnum<{
    token: "token";
    id_token: "id_token";
    manual: "manual";
    org: "org";
}>;
export type AccountIdSourceFromSchema = z.infer<typeof AccountIdSourceSchema>;
/**
 * Cooldown reason for temporary account suspension.
 */
export declare const CooldownReasonSchema: z.ZodEnum<{
    "auth-failure": "auth-failure";
    "network-error": "network-error";
}>;
export type CooldownReasonFromSchema = z.infer<typeof CooldownReasonSchema>;
/**
 * Last switch reason for account rotation tracking.
 */
export declare const SwitchReasonSchema: z.ZodEnum<{
    "rate-limit": "rate-limit";
    initial: "initial";
    rotation: "rotation";
}>;
export type SwitchReasonFromSchema = z.infer<typeof SwitchReasonSchema>;
/**
 * Rate limit state - maps model family to reset timestamp.
 */
export declare const RateLimitStateV3Schema: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodNumber>>;
export type RateLimitStateV3FromSchema = z.infer<typeof RateLimitStateV3Schema>;
/**
 * Account metadata V3 - current storage format.
 */
export declare const AccountMetadataV3Schema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    accountUserId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    accountIdSource: z.ZodOptional<z.ZodEnum<{
        token: "token";
        id_token: "id_token";
        manual: "manual";
        org: "org";
    }>>;
    accountLabel: z.ZodOptional<z.ZodString>;
    planType: z.ZodOptional<z.ZodString>;
    accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
    accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    email: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodString;
    accessToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    oauthScope: z.ZodOptional<z.ZodString>;
    tokenRotatedAt: z.ZodOptional<z.ZodNumber>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    addedAt: z.ZodNumber;
    lastUsed: z.ZodNumber;
    lastSwitchReason: z.ZodOptional<z.ZodEnum<{
        "rate-limit": "rate-limit";
        initial: "initial";
        rotation: "rotation";
    }>>;
    rateLimitResetTimes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodNumber>>>;
    coolingDownUntil: z.ZodOptional<z.ZodNumber>;
    quotaExhaustedUntil: z.ZodOptional<z.ZodNumber>;
    quotaExhaustedStampAt: z.ZodOptional<z.ZodNumber>;
    quotaExhaustedClearedAt: z.ZodOptional<z.ZodNumber>;
    autoRedeemClaimedAt: z.ZodOptional<z.ZodNumber>;
    cooldownReason: z.ZodOptional<z.ZodEnum<{
        "auth-failure": "auth-failure";
        "network-error": "network-error";
    }>>;
}, z.core.$strip>;
export type AccountMetadataV3FromSchema = z.infer<typeof AccountMetadataV3Schema>;
export declare const ActiveIndexByFamilySchema: z.ZodObject<{
    "gpt-5-codex": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "codex-max": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    codex: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-6-astra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-6.1-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-daybreak-blue": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-daybreak-red": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.6-cyber": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.6-terra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.4": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.4-mini": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.4-pro": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.2": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    "gpt-5.1": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type ActiveIndexByFamilyFromSchema = z.infer<typeof ActiveIndexByFamilySchema>;
/**
 * Account storage V3 - current storage format with per-family active indices.
 */
export declare const AccountStorageV3Schema: z.ZodObject<{
    version: z.ZodLiteral<3>;
    accounts: z.ZodArray<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodString>;
        accountUserId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        accountIdSource: z.ZodOptional<z.ZodEnum<{
            token: "token";
            id_token: "id_token";
            manual: "manual";
            org: "org";
        }>>;
        accountLabel: z.ZodOptional<z.ZodString>;
        planType: z.ZodOptional<z.ZodString>;
        accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
        accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
        email: z.ZodOptional<z.ZodString>;
        refreshToken: z.ZodString;
        accessToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        oauthScope: z.ZodOptional<z.ZodString>;
        tokenRotatedAt: z.ZodOptional<z.ZodNumber>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        addedAt: z.ZodNumber;
        lastUsed: z.ZodNumber;
        lastSwitchReason: z.ZodOptional<z.ZodEnum<{
            "rate-limit": "rate-limit";
            initial: "initial";
            rotation: "rotation";
        }>>;
        rateLimitResetTimes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodNumber>>>;
        coolingDownUntil: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedUntil: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedStampAt: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedClearedAt: z.ZodOptional<z.ZodNumber>;
        autoRedeemClaimedAt: z.ZodOptional<z.ZodNumber>;
        cooldownReason: z.ZodOptional<z.ZodEnum<{
            "auth-failure": "auth-failure";
            "network-error": "network-error";
        }>>;
    }, z.core.$strip>>;
    activeIndex: z.ZodNumber;
    activeIndexByFamily: z.ZodOptional<z.ZodObject<{
        "gpt-5-codex": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "codex-max": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        codex: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-astra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6.1-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-daybreak-blue": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-daybreak-red": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-cyber": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-terra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4-mini": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4-pro": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.2": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.1": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AccountStorageV3FromSchema = z.infer<typeof AccountStorageV3Schema>;
/**
 * Legacy V1 account metadata for migration support.
 */
export declare const AccountMetadataV1Schema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    accountUserId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    accountIdSource: z.ZodOptional<z.ZodEnum<{
        token: "token";
        id_token: "id_token";
        manual: "manual";
        org: "org";
    }>>;
    accountLabel: z.ZodOptional<z.ZodString>;
    accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
    accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    email: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodString;
    accessToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    oauthScope: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    addedAt: z.ZodNumber;
    lastUsed: z.ZodNumber;
    lastSwitchReason: z.ZodOptional<z.ZodEnum<{
        "rate-limit": "rate-limit";
        initial: "initial";
        rotation: "rotation";
    }>>;
    rateLimitResetTime: z.ZodOptional<z.ZodNumber>;
    coolingDownUntil: z.ZodOptional<z.ZodNumber>;
    cooldownReason: z.ZodOptional<z.ZodEnum<{
        "auth-failure": "auth-failure";
        "network-error": "network-error";
    }>>;
}, z.core.$strip>;
export type AccountMetadataV1FromSchema = z.infer<typeof AccountMetadataV1Schema>;
/**
 * Legacy V1 storage format for migration support.
 */
export declare const AccountStorageV1Schema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    accounts: z.ZodArray<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodString>;
        accountUserId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        accountIdSource: z.ZodOptional<z.ZodEnum<{
            token: "token";
            id_token: "id_token";
            manual: "manual";
            org: "org";
        }>>;
        accountLabel: z.ZodOptional<z.ZodString>;
        accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
        accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
        email: z.ZodOptional<z.ZodString>;
        refreshToken: z.ZodString;
        accessToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        oauthScope: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        addedAt: z.ZodNumber;
        lastUsed: z.ZodNumber;
        lastSwitchReason: z.ZodOptional<z.ZodEnum<{
            "rate-limit": "rate-limit";
            initial: "initial";
            rotation: "rotation";
        }>>;
        rateLimitResetTime: z.ZodOptional<z.ZodNumber>;
        coolingDownUntil: z.ZodOptional<z.ZodNumber>;
        cooldownReason: z.ZodOptional<z.ZodEnum<{
            "auth-failure": "auth-failure";
            "network-error": "network-error";
        }>>;
    }, z.core.$strip>>;
    activeIndex: z.ZodNumber;
}, z.core.$strip>;
export type AccountStorageV1FromSchema = z.infer<typeof AccountStorageV1Schema>;
/**
 * Minimal V2 detection schema.
 *
 * V2 was an intermediate account-storage format used by legacy 4.x builds
 * that never shipped a documented shape. We only validate enough to recognise
 * `version: 2` files so the loader can surface a typed `UNKNOWN_V2_FORMAT`
 * error instead of silently discarding credentials. Do not extend this
 * schema without evidence of the real V2 shape.
 */
export declare const AccountStorageV2DetectionSchema: z.ZodObject<{
    version: z.ZodLiteral<2>;
    accounts: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodUnknown>>>;
}, z.core.$strip>;
export type AccountStorageV2DetectionFromSchema = z.infer<typeof AccountStorageV2DetectionSchema>;
/**
 * Union of V1 and V3 storage formats for migration detection.
 * V2 is intentionally excluded: it is detected separately and rejected with a
 * typed StorageError so users with a V2 file are told how to recover instead
 * of having their credentials silently discarded.
 */
export declare const AnyAccountStorageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    accounts: z.ZodArray<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodString>;
        accountUserId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        accountIdSource: z.ZodOptional<z.ZodEnum<{
            token: "token";
            id_token: "id_token";
            manual: "manual";
            org: "org";
        }>>;
        accountLabel: z.ZodOptional<z.ZodString>;
        accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
        accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
        email: z.ZodOptional<z.ZodString>;
        refreshToken: z.ZodString;
        accessToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        oauthScope: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        addedAt: z.ZodNumber;
        lastUsed: z.ZodNumber;
        lastSwitchReason: z.ZodOptional<z.ZodEnum<{
            "rate-limit": "rate-limit";
            initial: "initial";
            rotation: "rotation";
        }>>;
        rateLimitResetTime: z.ZodOptional<z.ZodNumber>;
        coolingDownUntil: z.ZodOptional<z.ZodNumber>;
        cooldownReason: z.ZodOptional<z.ZodEnum<{
            "auth-failure": "auth-failure";
            "network-error": "network-error";
        }>>;
    }, z.core.$strip>>;
    activeIndex: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    version: z.ZodLiteral<3>;
    accounts: z.ZodArray<z.ZodObject<{
        accountId: z.ZodOptional<z.ZodString>;
        accountUserId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        accountIdSource: z.ZodOptional<z.ZodEnum<{
            token: "token";
            id_token: "id_token";
            manual: "manual";
            org: "org";
        }>>;
        accountLabel: z.ZodOptional<z.ZodString>;
        planType: z.ZodOptional<z.ZodString>;
        accountTags: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodString>>, z.ZodTransform<string[] | undefined, string[] | undefined>>;
        accountNote: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
        email: z.ZodOptional<z.ZodString>;
        refreshToken: z.ZodString;
        accessToken: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        oauthScope: z.ZodOptional<z.ZodString>;
        tokenRotatedAt: z.ZodOptional<z.ZodNumber>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        addedAt: z.ZodNumber;
        lastUsed: z.ZodNumber;
        lastSwitchReason: z.ZodOptional<z.ZodEnum<{
            "rate-limit": "rate-limit";
            initial: "initial";
            rotation: "rotation";
        }>>;
        rateLimitResetTimes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodNumber>>>;
        coolingDownUntil: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedUntil: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedStampAt: z.ZodOptional<z.ZodNumber>;
        quotaExhaustedClearedAt: z.ZodOptional<z.ZodNumber>;
        autoRedeemClaimedAt: z.ZodOptional<z.ZodNumber>;
        cooldownReason: z.ZodOptional<z.ZodEnum<{
            "auth-failure": "auth-failure";
            "network-error": "network-error";
        }>>;
    }, z.core.$strip>>;
    activeIndex: z.ZodNumber;
    activeIndexByFamily: z.ZodOptional<z.ZodObject<{
        "gpt-5-codex": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "codex-max": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        codex: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-astra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6.1-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-daybreak-blue": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-daybreak-red": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-cyber": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-sol": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-terra": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.6-luna": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4-mini": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.4-pro": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.2": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        "gpt-5.1": z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>>;
}, z.core.$strip>], "version">;
export type AnyAccountStorageFromSchema = z.infer<typeof AnyAccountStorageSchema>;
/**
 * Schema for a single Codex CLI account entry.
 *
 * This file is produced by a separate process (the Codex CLI) and lives on
 * disk at a known path. It is a cross-trust-boundary input: the file could be
 * stale, truncated, tampered with, or produced by a mismatched Codex CLI
 * version. All fields are therefore `optional` at the schema level — we
 * extract only the fields we need and let `catchall(z.unknown())` preserve
 * any extra fields without rejection.
 *
 * Security note (audit top-20 #11): never trust field shapes via ad-hoc
 * property checks before validating through this schema. The wrapper
 * `CodexCliAccountsSchema` must be applied at the JSON-parse boundary.
 */
export declare const CodexCliAccountEntrySchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
    auth: z.ZodOptional<z.ZodObject<{
        tokens: z.ZodOptional<z.ZodObject<{
            access_token: z.ZodOptional<z.ZodString>;
            refresh_token: z.ZodOptional<z.ZodString>;
            id_token: z.ZodOptional<z.ZodString>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>;
}, z.core.$catchall<z.ZodUnknown>>;
export type CodexCliAccountEntryFromSchema = z.infer<typeof CodexCliAccountEntrySchema>;
/**
 * Schema for the full Codex CLI accounts file.
 *
 * Applied at the JSON-parse boundary in `lib/accounts.ts:getCodexCliTokenCache`.
 * A validation failure causes the loader to warn+skip (treat cache as empty)
 * rather than throwing — a malformed or attacker-controlled Codex CLI file
 * must never take down the host plugin.
 */
export declare const CodexCliAccountsSchema: z.ZodObject<{
    accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        accountId: z.ZodOptional<z.ZodString>;
        auth: z.ZodOptional<z.ZodObject<{
            tokens: z.ZodOptional<z.ZodObject<{
                access_token: z.ZodOptional<z.ZodString>;
                refresh_token: z.ZodOptional<z.ZodString>;
                id_token: z.ZodOptional<z.ZodString>;
            }, z.core.$catchall<z.ZodUnknown>>>;
        }, z.core.$catchall<z.ZodUnknown>>>;
    }, z.core.$catchall<z.ZodUnknown>>>>;
}, z.core.$catchall<z.ZodUnknown>>;
export type CodexCliAccountsFromSchema = z.infer<typeof CodexCliAccountsSchema>;
/**
 * Token failure reason codes.
 */
export declare const TokenFailureReasonSchema: z.ZodEnum<{
    unknown: "unknown";
    http_error: "http_error";
    invalid_response: "invalid_response";
    network_error: "network_error";
    missing_refresh: "missing_refresh";
}>;
export type TokenFailureReasonFromSchema = z.infer<typeof TokenFailureReasonSchema>;
/**
 * Successful token exchange result.
 */
export declare const TokenSuccessSchema: z.ZodObject<{
    type: z.ZodLiteral<"success">;
    access: z.ZodString;
    refresh: z.ZodString;
    expires: z.ZodNumber;
    idToken: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    multiAccount: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type TokenSuccessFromSchema = z.infer<typeof TokenSuccessSchema>;
/**
 * Failed token exchange result.
 */
export declare const TokenFailureSchema: z.ZodObject<{
    type: z.ZodLiteral<"failed">;
    reason: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        http_error: "http_error";
        invalid_response: "invalid_response";
        network_error: "network_error";
        missing_refresh: "missing_refresh";
    }>>;
    statusCode: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TokenFailureFromSchema = z.infer<typeof TokenFailureSchema>;
/**
 * Token result - discriminated union of success/failure.
 */
export declare const TokenResultSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"success">;
    access: z.ZodString;
    refresh: z.ZodString;
    expires: z.ZodNumber;
    idToken: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    multiAccount: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"failed">;
    reason: z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        http_error: "http_error";
        invalid_response: "invalid_response";
        network_error: "network_error";
        missing_refresh: "missing_refresh";
    }>>;
    statusCode: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
export type TokenResultFromSchema = z.infer<typeof TokenResultSchema>;
/**
 * Conservative default token lifetime (seconds) applied when the OAuth
 * server omits `expires_in` or sends a value outside the sane range.
 *
 * Both directions of a bogus `expires_in` are harmful: a negative or tiny
 * value produces an `expires` stamp in the past and triggers a refresh on
 * every request (a refresh storm that also burns single-use refresh tokens),
 * while an absurd value (1e290, Infinity via 1e306) makes the access token
 * look immortal so it is never refreshed. And a missing field must NOT fail
 * the whole response — the tokens in it are real, and the authorization code
 * or refresh token that produced them may already be consumed server-side,
 * so rejecting on shape alone loses an unrecoverable credential.
 */
export declare const OAUTH_EXPIRES_IN_MAX_SECONDS = 31536000;
export declare const OAUTH_EXPIRES_IN_DEFAULT_SECONDS = 3600;
/**
 * OAuth token response from OpenAI.
 */
export declare const OAuthTokenResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    refresh_token: z.ZodOptional<z.ZodString>;
    expires_in: z.ZodCatch<z.ZodNumber>;
    id_token: z.ZodOptional<z.ZodString>;
    token_type: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type OAuthTokenResponseFromSchema = z.infer<typeof OAuthTokenResponseSchema>;
/**
 * Safely parse plugin configuration with detailed error logging.
 * Returns null on failure, allowing graceful degradation.
 */
export declare function safeParsePluginConfig(data: unknown): PluginConfigFromSchema | null;
/**
 * Safely parse account storage (any version).
 * Returns null on failure, allowing graceful degradation.
 */
export declare function safeParseAccountStorage(data: unknown): AnyAccountStorageFromSchema | null;
/**
 * Safely parse V3 account storage specifically.
 * Returns null on failure.
 */
export declare function safeParseAccountStorageV3(data: unknown): AccountStorageV3FromSchema | null;
/**
 * Safely parse token result.
 * Returns null on failure.
 */
export declare function safeParseTokenResult(data: unknown): TokenResultFromSchema | null;
/**
 * Safely parse OAuth token response from API.
 * Returns null on failure.
 */
export declare function safeParseOAuthTokenResponse(data: unknown): OAuthTokenResponseFromSchema | null;
/**
 * Get validation errors as a flat array of strings.
 * Useful for logging and error messages.
 */
export declare function getValidationErrors(schema: z.ZodType, data: unknown): string[];
/**
 * JWT payload schema.
 *
 * The JWT is produced by the OAuth provider (ChatGPT backend) and decoded on
 * the client. Unknown claims are preserved via `catchall(z.unknown())` so we
 * never reject a valid-but-unfamiliar token, but the claims we actually read
 * (account/member ids, email, organization hints) are shape-checked. A failed parse
 * causes callers to treat the JWT as opaque (same behavior as an undecodable
 * JWT) instead of blindly casting arbitrary JSON into our `JWTPayload` type.
 */
export declare const JWTPayloadSchema: z.ZodObject<{
    "https://api.openai.com/auth": z.ZodOptional<z.ZodObject<{
        chatgpt_account_id: z.ZodOptional<z.ZodString>;
        chatgpt_account_user_id: z.ZodOptional<z.ZodString>;
        organizations: z.ZodOptional<z.ZodUnknown>;
        email: z.ZodOptional<z.ZodString>;
        chatgpt_user_email: z.ZodOptional<z.ZodString>;
    }, z.core.$catchall<z.ZodUnknown>>>;
    organizations: z.ZodOptional<z.ZodUnknown>;
    orgs: z.ZodOptional<z.ZodUnknown>;
    accounts: z.ZodOptional<z.ZodUnknown>;
    workspaces: z.ZodOptional<z.ZodUnknown>;
    teams: z.ZodOptional<z.ZodUnknown>;
    email: z.ZodOptional<z.ZodString>;
    preferred_username: z.ZodOptional<z.ZodString>;
}, z.core.$catchall<z.ZodUnknown>>;
export type JWTPayloadFromSchema = z.infer<typeof JWTPayloadSchema>;
/**
 * Safely parse a decoded JWT payload.
 * Returns null on failure so callers can treat the token as opaque.
 */
export declare function safeParseJWTPayload(data: unknown): JWTPayloadFromSchema | null;
/**
 * Cache metadata for Codex instructions fetched from GitHub.
 *
 * File lives at `~/.opencode/cache/<model>-instructions-meta.json` and is
 * read at startup and after stale-while-revalidate refreshes. The file can be
 * corrupted, truncated, or produced by a different plugin version, so the
 * schema is strict: invalid files fall back to "no cached metadata" (the
 * same state as a missing file) and force a fresh fetch.
 */
export declare const CacheMetadataSchema: z.ZodObject<{
    etag: z.ZodNullable<z.ZodString>;
    tag: z.ZodString;
    lastChecked: z.ZodNumber;
    url: z.ZodString;
}, z.core.$strip>;
export type CacheMetadataFromSchema = z.infer<typeof CacheMetadataSchema>;
export declare function safeParseCacheMetadata(data: unknown): CacheMetadataFromSchema | null;
/**
 * Cache metadata for the OpenCode codex prompt fetched from GitHub.
 *
 * File lives at `~/.opencode/cache/opencode-codex-meta.json`. Same trust
 * considerations as `CacheMetadataSchema`; fall back to empty cache on
 * parse failure instead of crashing the prompt fetcher.
 */
export declare const OpenCodeCodexCacheMetaSchema: z.ZodObject<{
    etag: z.ZodString;
    lastFetch: z.ZodOptional<z.ZodString>;
    lastChecked: z.ZodNumber;
    sourceUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type OpenCodeCodexCacheMetaFromSchema = z.infer<typeof OpenCodeCodexCacheMetaSchema>;
export declare function safeParseOpenCodeCodexCacheMeta(data: unknown): OpenCodeCodexCacheMetaFromSchema | null;
/**
 * Boolean env-var parser.
 *
 * Historical semantics (kept verbatim for backward compatibility with the
 * pre-RC-9 `parseBooleanEnv` helper): the literal string `"1"` is truthy, any
 * other non-empty string (including `"0"`, `"yes"`, `"true"`) is falsy, and
 * `undefined` remains `undefined` so callers can fall back to the config
 * file / hard-coded default. The schema does not throw on invalid input;
 * boolean env vars are a process boundary but one where permissive parsing
 * is the documented contract.
 */
export declare const EnvBooleanSchema: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
/**
 * Numeric env-var parser.
 *
 * Accepts any string that coerces to a finite JS number. Non-finite values
 * (empty string, `"abc"`, `"NaN"`, `"Infinity"` treated as non-finite) fall
 * back to undefined so callers can apply config-file / hard-coded defaults
 * instead of silently using a poisoned value.
 */
export declare const EnvNumberSchema: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number | undefined, string | undefined>>;
/**
 * Factory for an integer env-var parser with an inclusive lower bound.
 *
 * Same fallback contract as {@link EnvNumberSchema} — unacceptable input
 * becomes undefined so the caller falls back to the config file / default —
 * but it additionally rejects non-integers and values below `min` instead of
 * leaving them for a resolver to clamp. Clamping is the wrong default when
 * the bound is load-bearing: `CODEX_AUTH_CREDENTIAL_SNAPSHOTS_MAX_COUNT=-5`
 * floored to `0` would mean "keep every snapshot", the unbounded-growth case
 * the bound exists to rule out.
 */
export declare function makeEnvIntegerSchema(min: number): z.ZodPipe<z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number | undefined, string | undefined>>, z.ZodTransform<number | undefined, number | undefined>>;
/**
 * Factory for a string-enum env-var parser.
 *
 * Produces a Zod schema that trims+lower-cases the raw env value and accepts
 * it only when it is a member of `allowed`. Any other value becomes
 * undefined so the caller falls back to the config file / default.
 */
export declare function makeEnvEnumSchema<T extends string>(allowed: ReadonlySet<T> | readonly T[]): z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Awaited<T> | undefined, string | undefined>>;
export declare const AccountIdOverrideSchema: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
/**
 * Parse an env-var value through the account-id override schema.
 * Returns `undefined` on any validation failure.
 */
export declare function parseAccountIdOverride(value: string | undefined): string | undefined;
