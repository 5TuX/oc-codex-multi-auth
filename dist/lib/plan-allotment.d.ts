/**
 * How much Codex capacity one ChatGPT plan carries relative to another.
 *
 * A pool of accounts on different plans has no single "percent used": one
 * Pro seat spent to 50% has given up far more capacity than a Business
 * Standard seat spent to 50%, so averaging the two percentages unweighted
 * reports a pool that does not exist. Every plan here therefore carries a
 * {@link PlanAllotment.weight} - its allotment relative to a 1x seat - and the
 * pool total is the weighted mean.
 *
 * The weights are OpenAI's own published per-seat ratios, taken from the
 * plan's monthly price against the 1x Plus/Business Standard seat: Pro is
 * $200 against $20, and is marketed as 20x. They describe the *subscription*,
 * not a measured token allowance, which is the only ratio OpenAI states and
 * the same one the seat is sold on.
 *
 * `plan_type` is what the `/wham/usage` endpoint and the `chatgpt_plan_type`
 * access-token claim report. Two of its slugs are not derivable from their
 * text - `team` is the slug still emitted for what OpenAI now calls Business,
 * and `self_serve_business_prolite` is the premium Business seat rather than
 * the personal Pro Lite tier that shares the `prolite` token - so both are
 * matched explicitly below.
 *
 * This module is deliberately a leaf (no imports). The prompt status line
 * depends on it, and naming a plan is a separate concern that already has an
 * owner in `lib/auth/plan-tier.ts`; pulling that in here would drag JWT
 * decoding into the TUI's render path for a number that needs none of it.
 */
export type PlanAllotment = {
    /**
     * Allotment relative to a 1x seat, or `undefined` when the plan states no
     * ratio. `undefined` is not 1: a plan we cannot place must not be
     * silently averaged as though it were the baseline.
     */
    weight?: number;
    /** Marketing badge for the same ratio, e.g. `5x`. */
    multiplier?: string;
    /** Per-seat monthly price in USD, as listed by OpenAI. */
    monthlyUsd?: number;
};
/**
 * Weight used for a plan that states no ratio, so one unplaceable account
 * cannot remove every other account from the pool total. It is the baseline
 * seat rather than a guess at something larger: under-weighting an unknown
 * plan understates one account, while over-weighting it would let a plan we
 * failed to recognize dominate the number the whole pool is judged by.
 */
export declare const DEFAULT_PLAN_WEIGHT = 1;
/**
 * Reduce a `plan_type` to the form the matchers below expect.
 *
 * The admin roster spells a tier as one token (`chatgptteamplan`) while the
 * usage endpoint reports the bare word (`team`), and the premium Business
 * seat arrives underscored (`self_serve_business_prolite`). All three have to
 * land on the same normalized text or one seat is weighted differently
 * depending on which surface named it.
 */
export declare function normalizePlanSlug(value: string | null | undefined): string | undefined;
/**
 * Resolve a `plan_type` to its allotment. An unrecognized plan returns an
 * empty allotment rather than a guess, so callers can tell "1x" apart from
 * "we do not know".
 */
export declare function describePlanAllotment(planType: string | null | undefined): PlanAllotment;
/**
 * The weight to average an account by, falling back to
 * {@link DEFAULT_PLAN_WEIGHT} for a plan that states no ratio.
 */
export declare function getPlanWeight(planType: string | null | undefined): number;
/** `5x`, or `undefined` when the plan states no ratio. */
export declare function formatPlanMultiplier(planType: string | null | undefined): string | undefined;
