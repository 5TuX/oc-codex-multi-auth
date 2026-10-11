/**
 * `codex-keychain` tool — inspect and manage the opt-in OS-keychain backend.
 *
 * Phase 4 F1. Companion to `lib/storage/keychain.ts`. The tool exposes three
 * subcommands chosen for operator-level control over the credential surface:
 *
 *   - `status`: report which backend is active and whether the OS keychain
 *     is reachable. Never mutates state; safe to run under any config.
 *   - `migrate`: explicitly move the current on-disk JSON accounts file into
 *     the OS keychain, rename the JSON as
 *     `<path>.migrated-to-keychain.<ts>` for rollback, and leave the
 *     authoritative copy in the keychain. Idempotent: running again when
 *     the keychain already holds a fresher copy is a no-op.
 *   - `rollback`: restore the most recent `.migrated-to-keychain.<ts>`
 *     backup next to the accounts file and delete the keychain entry so
 *     subsequent loads read from disk again. The inverse of `migrate`.
 *     A flagged-store marker beside it is restored the same way so
 *     quarantined credentials do not stay keychain-only.
 *
 * Runs under the same storage lock as `saveAccounts`/`loadAccounts` so the
 * mutation cannot interleave with an in-flight rotation save.
 *
 * Security notes:
 *   - No secret value ever reaches the tool output. Success messages show
 *     account counts and file paths, never token material.
 *   - Failures fall back to JSON at the storage layer — this tool never
 *     hides that from the operator.
 */
import { type ToolDefinition } from "@opencode-ai/plugin/tool";
import type { ToolContext } from "./index.js";
/**
 * Test-only export for `findMigrationBackups`. Kept separate from the
 * tool factory so the sort semantics can be asserted directly against a
 * temp directory in `test/tools-codex-keychain.test.ts`.
 */
export declare function _findMigrationBackupsForTests(storagePath: string): Promise<string[]>;
export declare function createCodexKeychainTool(ctx: ToolContext): ToolDefinition;
