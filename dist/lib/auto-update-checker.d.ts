export interface UpdateCheckResult {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string | null;
    updateCommand: string;
}
export interface CheckAndNotifyOptions {
    autoUpdate?: boolean;
    scheduleCacheClear?: () => boolean;
    localCheckout?: boolean;
}
export interface EvictionScope {
    cacheRoot?: string;
    resolveRealPath?: (path: string) => string;
}
/**
 * Cache eviction deletes recursively, so it must never act on a path that only
 * looks like cache. Resolving symlinks before the containment check is the part
 * that matters: a developer who links their working checkout into the cache
 * would otherwise have it deleted on exit by a name match alone.
 *
 * The cache root itself must not resolve through a symlink either. When
 * `~/.cache/opencode` is a link to `~`, comparing realpaths makes the whole
 * home directory "inside the cache" and containment proves nothing.
 */
export declare function isEvictableCachePath(cachePath: string, scope?: EvictionScope): boolean;
export declare function clearManagedOpenCodePluginCache(paths?: string[], scope?: EvictionScope): boolean;
export declare function scheduleOpenCodePluginCacheClearOnExit(): boolean;
export declare function checkForUpdates(force?: boolean): Promise<UpdateCheckResult>;
export declare function checkAndNotify(showToast?: (message: string, variant: "info" | "warning") => Promise<void>, options?: CheckAndNotifyOptions): Promise<void>;
export declare function clearUpdateCache(): void;
