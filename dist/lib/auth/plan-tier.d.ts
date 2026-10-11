/**
 * ChatGPT subscription tier, read from the OAuth access token.
 *
 * The `chatgpt_plan_type` claim is the only plan signal the credential itself
 * carries. It agrees with the `plan_type` field the Codex `/wham/usage`
 * endpoint returns for the same account, so the tier is available without a
 * network round trip and stays correct while offline.
 */
export declare function extractPlanType(accessToken?: string): string | undefined;
/**
 * An unrecognized slug is returned verbatim: a plan we cannot name is still
 * worth showing, and inventing a name for it would misreport the subscription.
 * "Verbatim" means not renamed, not un-sanitized — see {@link sanitizePlanLabel}.
 *
 * Accepts `null` so the live `/wham/usage` and `x-codex-plan-type` readings —
 * which type their absent plan as `null`, not `undefined` — go through the same
 * naming as the copy stored at login. Without that, one seat printed "Business"
 * in `codex-list` and `team` in `codex-limits` and the TUI.
 */
export declare function formatPlanType(planType: string | null | undefined): string | undefined;
