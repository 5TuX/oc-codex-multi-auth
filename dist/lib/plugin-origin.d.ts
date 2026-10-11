/**
 * Where this plugin is running from, and where it has run from before.
 *
 * OpenCode can load the plugin from the published package or from a checkout
 * a developer points it at, and the two are indistinguishable at runtime
 * unless the plugin asks. Knowing which one is live decides whether offering
 * an update makes sense, and a record of previous origins is what turns "my
 * edits stopped taking effect" into a diagnosable event.
 */
/**
 * The origin history file name, shared with the installer.
 *
 * The installer is plain JS that must run before anything is built, so it
 * cannot import this module and declares the same name itself. A test pins the
 * two together, because a silent disagreement would leave each side reporting
 * confidently about a file the other never writes.
 */
export declare const HISTORY_FILE_NAME = "oc-codex-multi-auth-origin.json";
export interface PluginOrigin {
    name: string;
    version: string;
    root: string;
    isLocalCheckout: boolean;
}
export interface PluginOriginSighting extends PluginOrigin {
    firstSeen: string;
    lastSeen: string;
}
export interface PluginOriginHistory {
    version: number;
    sightings: PluginOriginSighting[];
}
/** Built output lives inside the package, so the root is at or above it. */
export declare function findPackageRoot(startDirectory: string): string | null;
/**
 * A root a package manager chose, as opposed to one a human did. The version
 * suffix is what separates OpenCode's plugin cache from a monorepo that merely
 * keeps its packages in a `packages/` directory.
 */
export declare function isPackageManagerRoot(root: string, platform?: NodeJS.Platform, cacheDirectory?: string): boolean;
export declare function resolvePluginOrigin(moduleUrl: string): PluginOrigin | null;
/** The origin of this running build. Fixed for the life of the process. */
export declare function getPluginOrigin(): PluginOrigin | null;
export declare function getPluginOriginHistoryPath(home?: string): string;
export declare function readPluginOriginHistory(historyPath?: string): PluginOriginHistory;
/**
 * History is appended to rather than overwritten, so one origin replacing
 * another leaves both on record. A last-writer-wins marker would instead
 * confirm whatever state a clobber left behind.
 */
export declare function withSighting(history: PluginOriginHistory, origin: PluginOrigin, seenAt: string, platform?: NodeJS.Platform): PluginOriginHistory;
/**
 * Records this origin without dropping anybody else's.
 *
 * Every OpenCode process records at startup, and a machine running many of
 * them starts several at once, so read-modify-write on a shared file is a real
 * race rather than a theoretical one. The reader that matters here asks which
 * origins have been seen, so a lost sighting is a lost answer: the very
 * handover this file exists to report - a checkout replaced by the installed
 * package - is two different origins written at close to the same time.
 *
 * The history is therefore re-read INSIDE the lease, so each writer merges
 * into what is actually on disk. A writer that cannot take the lease records
 * nothing rather than overwriting blind; it is about to be started again, and
 * a missing sighting costs a later startup while a clobbered one costs the
 * only evidence there was. A lease reclaimed mid-write is the same situation
 * arriving later, and is answered the same way.
 */
export declare function recordPluginOrigin(origin: PluginOrigin, historyPath?: string, now?: () => Date): Promise<PluginOriginHistory>;
/**
 * The checkout this plugin used to run from and no longer does. Reported only
 * when the current origin is package-manager output, since a move between two
 * checkouts is an ordinary thing to do deliberately.
 */
export declare function findReplacedLocalCheckout(origin: PluginOrigin, history: PluginOriginHistory, platform?: NodeJS.Platform): PluginOriginSighting | null;
export declare function describePluginOrigin(origin: PluginOrigin | null): string;
