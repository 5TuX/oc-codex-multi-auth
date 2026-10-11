import type { RequestBody } from "../../types.js";
/** Header Codex sets on every responses-lite request. */
export declare const RESPONSES_LITE_HEADER = "x-openai-internal-codex-responses-lite";
export declare const RESPONSES_LITE_HEADER_VALUE = "true";
/**
 * Whether a model expects the responses-lite request shape.
 *
 * Accepts raw selectors (`openai/gpt-5.6-sol-xhigh`) as well as canonical ids.
 */
export declare function usesResponsesLite(model: string | undefined): boolean;
/**
 * Serialize-time shaping: return the body as it should go on the wire for
 * `body.model`.
 *
 * The canonical transformed body is always kept in the classic shape. Lite is a
 * per-attempt, model-dependent view of it, derived from a deep copy so the
 * canonical body is never mutated.
 *
 * This matters for the unsupported-model fallback: a `gpt-5.6-sol` request that
 * degrades to `gpt-5.5` must be sent in the classic shape. If the canonical
 * body had been reshaped in place, the fallback would ship a non-lite model a
 * body with no top-level `tools` — its tool definitions stranded in an
 * `additional_tools` item that a non-lite model does not interpret.
 */
export declare function shapeBodyForModel(body: RequestBody): RequestBody;
/**
 * Rewrite a request body into the responses-lite shape, in place.
 *
 * Prefer {@link shapeBodyForModel} at call sites; this is exported for tests
 * and for callers that already own a throwaway copy. Mutates and returns the
 * same body object.
 */
export declare function applyResponsesLite(body: RequestBody): RequestBody;
