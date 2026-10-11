/**
 * Path resolution utilities for account storage.
 * Extracted from storage.ts to reduce module size.
 */
export declare function getConfigDir(): string;
export declare function getProjectConfigDir(projectPath: string): string;
export declare function getProjectStorageKey(projectPath: string): string;
/**
 * Per-project storage is namespaced under ~/.opencode/projects
 * to avoid writing account files into user repositories.
 *
 * Fallback rule: a pool created before storage keys canonicalized their
 * project path (or created through a since-removed symlink) lives under the
 * lexical key. When the canonical-keyed directory does not exist but the
 * lexical-keyed one does, the lexical directory is adopted so the accounts
 * keep loading instead of reporting an empty pool. When neither exists the
 * canonical key wins so new pools always land on the modern layout.
 */
export declare function getProjectGlobalConfigDir(projectPath: string): string;
export declare function isProjectDirectory(dir: string): boolean;
export declare function findProjectRoot(startDir: string): string | null;
export declare function isWithinDirectory(baseDir: string, targetPath: string): boolean;
export declare function resolvePath(filePath: string): string;
