import { type Plugin } from "@opencode/plugin";
import type { Hooks } from "@opencode-ai/plugin";
/** V1 supplied these defaults through provider options; V2's bridge needs them on the wire. */
export declare function createV2Fetch(fetcher: (input: Request | string | URL, init?: RequestInit) => Promise<Response>, version: string): (input: Request | string | URL, init?: RequestInit) => Promise<Response>;
/** The shared V1 runtime factory, passed in by the package entry. */
export type CreateV2Runtime = (options: {
    directory: string;
}) => Promise<Hooks>;
/** Names the connected SDK is missing; empty means the surface this file calls is complete. Exported for coverage of the probe itself. */
export declare function missingV2SdkSurface(context: Plugin.Context): string[];
/** Keep account rotation and wire transforms in the shared runtime. */
export declare function setupV2(context: Plugin.Context, createPluginRuntime: CreateV2Runtime): Promise<() => Promise<void>>;
