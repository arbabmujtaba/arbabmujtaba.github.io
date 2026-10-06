/**
 * GitService
 *
 * Safe, automated Git operations using simple-git.
 *
 * Rules enforced:
 * - Files staged explicitly by name (no `git add -A` / `git add .`)
 * - Default branch detected dynamically via `git symbolic-ref`
 * - No destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean -f`) on protected branches
 * - Non-interactive: GIT_TERMINAL_PROMPT=0 and a no-output timeout, so a sign-in
 *   prompt fails fast with a readable message instead of hanging the pipeline
 * - Auto-generated commit messages in format: "Published: {Title}"
 */

import { simpleGit, SimpleGit, StatusResult, DefaultLogFields, LogResult } from 'simple-git';
import path from 'path';

const PROTECTED_BRANCHES = ['main', 'master'];

/**
 * How long a git process may sit without printing anything before it is killed.
 *
 * This is what used to hang publishing forever: the remote is HTTPS, and when
 * the dev server is started from a terminal with no credential helper, `git
 * push` asks "Username for 'https://github.com':" on that terminal and waits.
 * Nobody is looking at it — the author is in the browser watching a spinner.
 */
export const GIT_BLOCK_TIMEOUT_MS = Number(process.env.GIT_TIMEOUT_MS) || 60_000;

/**
 * The environment every git child process runs with.
 *
 * GIT_TERMINAL_PROMPT=0 turns a would-be terminal prompt into an immediate,
 * readable failure. It does NOT disable credential helpers or GIT_ASKPASS (VS
 * Code's terminal sets one), so any sign-in that already works keeps working.
 */
function gitEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) if (typeof value === 'string') env[key] = value;
  // Nothing here opens an editor or a pager (commits always carry -m), and
  // simple-git refuses to spawn while either is named in the environment.
  for (const key of ['EDITOR', 'VISUAL', 'GIT_EDITOR', 'GIT_SEQUENCE_EDITOR', 'PAGER', 'GIT_PAGER']) delete env[key];
  env.GIT_TERMINAL_PROMPT = '0';
  env.GCM_INTERACTIVE = 'never';
  return env;
}

export type PushFailure = 'PUSH_AUTH' | 'PUSH_REJECTED' | 'PUSH_NETWORK_ERROR' | 'PUSH_TIMEOUT' | 'PUSH_FAILED';

/** Sort a git push error into something the author can act on. Exported for tests. */
export function classifyPushError(message: string): PushFailure {
  const text = message || '';
  if (/block timeout|timed? ?out after|timeout reached/i.test(text)) return 'PUSH_TIMEOUT';
  if (
    /could not read (username|password)|could not read from remote repository|terminal prompts disabled|authentication failed|invalid username or password|permission denied \(publickey\)|returned error: 40[13]|access denied|support for password authentication was removed/i.test(
      text
    )
  ) {
    return 'PUSH_AUTH';
  }
  if (/\[rejected\]|rejected|non-fast-forward|fetch first|updates were rejected/i.test(text)) return 'PUSH_REJECTED';
  if (/could not resolve host|failed to connect|connection (timed out|refused|reset)|network is unreachable|unable to access/i.test(text)) {
    return 'PUSH_NETWORK_ERROR';
  }
  return 'PUSH_FAILED';
}

/** The Pages site, repository and Actions page for an origin URL (https or ssh form). */
export function githubUrls(repoUrl: string | undefined): { site: string | null; repo: string | null; actions: string | null } {
  const match = (repoUrl || '').match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) return { site: null, repo: null, actions: null };
  const [, owner, repo] = match;
  const site = repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${owner}.github.io/` : `https://${owner}.github.io/${repo}/`;
  return { site, repo: `https://github.com/${owner}/${repo}`, actions: `https://github.com/${owner}/${repo}/actions` };
}

/** One plain sentence (and a command, where there is one) for each failure. */
export const PUSH_HINTS: Record<PushFailure, string> = {
  PUSH_AUTH:
    'Git could not sign in to GitHub from the dev server. Run `gh auth login` and then `gh auth setup-git` once in a terminal (or start `npm run dev` from VS Code’s terminal), then press Retry push. The commit is already saved locally.',
  PUSH_REJECTED:
    'GitHub has commits this machine does not. Run `git pull --no-rebase` in the project folder, then press Retry push.',
  PUSH_NETWORK_ERROR: 'GitHub could not be reached. Check the connection, then press Retry push.',
  PUSH_TIMEOUT:
    'git push waited a minute without a reply — almost always a sign-in prompt that nobody could see. Set up credentials with `gh auth login` + `gh auth setup-git`, then press Retry push.',
  PUSH_FAILED: 'The push did not go through. The commit is saved locally; press Retry push, or run `git push` in a terminal to see the full message.',
};

/**
 * Custom error class for Git operation failures.
 */
export class GitError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Git operation result with success flag and optional details.
 */
export interface GitOperationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * GitService class for safe, controlled git operations.
 */
export class GitService {
  private git: SimpleGit;
  private basePath: string;

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
    this.git = simpleGit(basePath, {
      config: ['core.quotepath=false', 'core.precomposeunicode=false'],
      // Kill a git process that goes quiet (a hidden credential prompt) instead of waiting forever.
      timeout: { block: GIT_BLOCK_TIMEOUT_MS },
      // simple-git refuses to spawn when the environment names an askpass helper,
      // ssh command or config override, because those can be abused when the env
      // comes from untrusted input. Here it is this process's own environment —
      // exactly what git would inherit without `.env()` — and every argument is
      // ours. Keeping them is what lets a working sign-in (VS Code's askpass, a
      // credential helper, an ssh agent) keep working.
      unsafe: {
        allowUnsafeAskPass: true,
        allowUnsafeSshCommand: true,
        allowUnsafeCredentialHelper: true,
        allowUnsafeConfigEnvCount: true,
        allowUnsafeConfigPaths: true,
        allowUnsafeGitProxy: true,
        allowUnsafeTemplateDir: true,
      },
    }).env(gitEnv());
  }

  // ==========================================================
  // BRANCH DETECTION
  // ==========================================================

  /**
   * Detect the default branch name dynamically.
   * Falls back to 'main' if detection fails.
   */
  async detectDefaultBranch(): Promise<string> {
    try {
      const result = await this.git.raw([
        'symbolic-ref',
        'refs/remotes/origin/HEAD',
        '--short',
      ]);
      const branch = result.trim().replace(/^origin\//, '');
      return branch || 'main';
    } catch (err: any) {
      // Fallback: try to infer from local branches
      try {
        const branches = await this.git.branchLocal();
        if (branches.all.includes('main')) return 'main';
        if (branches.all.includes('master')) return 'master';
      } catch {
        // ignore
      }
      return 'main';
    }
  }

  /**
   * Get the current active branch.
   */
  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'main';
  }

  /**
   * Detect if the current branch is protected.
   */
  async isOnProtectedBranch(): Promise<boolean> {
    const branch = await this.getCurrentBranch();
    return PROTECTED_BRANCHES.includes(branch);
  }

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  /**
   * Ensure git identity is set for automated commits.
   */
  async ensureIdentity(name?: string, email?: string): Promise<void> {
    const cfg = await this.git.listConfig();
    const hasName = cfg.values['user.name'];
    const hasEmail = cfg.values['user.email'];

    if (!hasName && name) {
      await this.git.addConfig('user.name', name, false, 'global');
    }
    if (!hasEmail && email) {
      await this.git.addConfig('user.email', email, false, 'global');
    }
  }

  // ==========================================================
  // STAGING (Safe — explicit only)
  // ==========================================================

  /**
   * Stage files explicitly by individual paths.
   * NEVER uses `git add -A`, `git add .`, or wildcard staging.
   *
   * @param filePaths - Array of specific file paths to stage
   */
  async stageFiles(filePaths: string[]): Promise<GitOperationResult> {
    if (!filePaths || filePaths.length === 0) {
      return { success: true, message: 'No files to stage' };
    }

    try {
      // Stage each file individually to guarantee explicitness
      for (const fp of filePaths) {
        const absolutePath = path.isAbsolute(fp) ? fp : path.join(this.basePath, fp);
        // Verify the file exists before staging
        const exists = await this.exists(absolutePath);
        if (!exists) {
          throw new GitError(
            `Cannot stage: file not found at ${fp}`,
            'FILE_NOT_FOUND'
          );
        }
        await this.git.add(absolutePath);
      }

      return {
        success: true,
        message: `Staged ${filePaths.length} file(s)`,
        details: { files: filePaths },
      };
    } catch (err: any) {
      throw new GitError(
        `Failed to stage files: ${err.message}`,
        'STAGE_FAILED',
        err
      );
    }
  }

  /**
   * Unstage files explicitly by path.
   */
  async unstageFiles(filePaths: string[]): Promise<GitOperationResult> {
    try {
      for (const fp of filePaths) {
        const absolutePath = path.isAbsolute(fp) ? fp : path.join(this.basePath, fp);
        await this.git.reset(['HEAD', '--', absolutePath]);
      }
      return {
        success: true,
        message: `Unstaged ${filePaths.length} file(s)`,
        details: { files: filePaths },
      };
    } catch (err: any) {
      throw new GitError(
        `Failed to unstage files: ${err.message}`,
        'UNSTAGE_FAILED',
        err
      );
    }
  }

  // ==========================================================
  // COMMIT
  // ==========================================================

  /**
   * Create a commit. When `paths` is given only those paths are committed
   * (`git commit -- <paths>`), so anything else the author happened to have
   * staged by hand stays out of an automated "Published:" commit.
   */
  async commit(message: string, paths?: string[]): Promise<GitOperationResult> {
    const currentBranch = await this.getCurrentBranch();

    try {
      const result = paths && paths.length > 0 ? await this.git.commit(message, paths) : await this.git.commit(message);

      if (result.commit) {
        return {
          success: true,
          message: `Committed to ${currentBranch}: ${message}`,
          details: {
            commitHash: result.commit,
            branch: currentBranch,
            message,
          },
        };
      }

      return {
        success: true,
        message: 'Nothing new to commit',
        details: { branch: currentBranch },
      };
    } catch (err: any) {
      // Committing a path whose content already matches HEAD is not a failure:
      // republishing an unchanged entry should still push whatever is waiting.
      if (/nothing (added )?to commit|no changes added to commit|nothing to commit/i.test(err?.message || '')) {
        return { success: true, message: 'Nothing new to commit', details: { branch: currentBranch } };
      }
      throw new GitError(
        `Commit failed on ${currentBranch}: ${err.message}`,
        'COMMIT_FAILED',
        err
      );
    }
  }

  /** Commits on this branch that origin does not have yet (0 when there is no upstream). */
  async aheadCount(): Promise<number> {
    try {
      const status = await this.git.status();
      return status.ahead || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Auto-generate a commit message for publishing.
   * Format: "Published: {Title}"
   */
  generateCommitMessage(title: string): string {
    const sanitized = title.replace(/\r?\n/g, ' ').trim();
    return `Published: ${sanitized}`;
  }

  // ==========================================================
  // PUSH
  // ==========================================================

  /**
   * Push commits to remote.
   * Detects default branch dynamically and pushes explicitly.
   */
  async push(): Promise<GitOperationResult> {
    const currentBranch = await this.getCurrentBranch();
    const defaultBranch = await this.detectDefaultBranch();

    try {
      const result = await this.git.push('origin', currentBranch);
      return {
        success: true,
        message: `Pushed ${currentBranch} to origin`,
        details: {
          branch: currentBranch,
          defaultBranch,
          pushed: result.pushed,
          remoteMessages: result.remoteMessages,
        },
      };
    } catch (err: any) {
      const code = classifyPushError(err?.message || '');
      const firstLine = String(err?.message || 'unknown error')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line && !/^hint:/i.test(line)) || 'unknown error';
      const summary: Record<PushFailure, string> = {
        PUSH_AUTH: 'GitHub did not accept a sign-in from the dev server',
        PUSH_REJECTED: `Push rejected on ${currentBranch} — the remote has commits this machine does not`,
        PUSH_NETWORK_ERROR: 'Network error: cannot reach the remote repository',
        PUSH_TIMEOUT: 'git push stopped responding (usually a hidden sign-in prompt)',
        PUSH_FAILED: `Push failed on ${currentBranch}: ${firstLine}`,
      };
      throw new GitError(summary[code], code, err);
    }
  }

  // ==========================================================
  // CONFLICT DETECTION
  // ==========================================================

  /**
   * Check for merge conflicts in the working tree.
   */
  async detectConflicts(): Promise<{ hasConflicts: boolean; conflictedFiles: string[] }> {
    try {
      const status = await this.git.status();
      const conflicted = status.conflicted || [];
      return {
        hasConflicts: conflicted.length > 0,
        conflictedFiles: conflicted,
      };
    } catch (err: any) {
      throw new GitError(
        `Failed to check for conflicts: ${err.message}`,
        'CONFLICT_CHECK_FAILED',
        err
      );
    }
  }

  /**
   * Check repository status for a clean working tree.
   */
  async getStatus(): Promise<StatusResult> {
    return this.git.status();
  }

  // ==========================================================
  // PULL
  // ==========================================================

  /**
   * Pull latest changes from remote with conflict detection.
   * After pulling, checks for conflicts and returns whether
   * manual resolution is needed.
   */
  async pull(): Promise<GitOperationResult> {
    const currentBranch = await this.getCurrentBranch();

    try {
      await this.git.pull('origin', currentBranch, { '--no-rebase': null });
      const conflicts = await this.detectConflicts();

      if (conflicts.hasConflicts) {
        return {
          success: false,
          message: `Merge conflicts detected in ${conflicts.conflictedFiles.length} file(s): ${conflicts.conflictedFiles.join(', ')}`,
          details: { conflictedFiles: conflicts.conflictedFiles },
        };
      }

      return {
        success: true,
        message: `Pulled latest changes for ${currentBranch}`,
        details: { branch: currentBranch },
      };
    } catch (err: any) {
      throw new GitError(
        `Pull failed on ${currentBranch}: ${err.message}`,
        'PULL_FAILED',
        err
      );
    }
  }

  // ==========================================================
  // ROLLBACK (Safe)
  // ==========================================================

  /**
   * Soft rollback: unstage changes and discard local modifications.
   * NEVER uses `git reset --hard` on protected branches.
   *
   * @param options.soft - Just unstage (default)
   * @param options.hard - Requires explicit approval; never used on protected branches
   */
  async rollback(options: { soft?: boolean; hard?: boolean } = {}): Promise<GitOperationResult> {
    const currentBranch = await this.getCurrentBranch();
    const isProtected = PROTECTED_BRANCHES.includes(currentBranch);

    // Hard rollback requires explicit user consent and is forbidden on protected branches
    if (options.hard) {
      if (isProtected) {
        throw new GitError(
          `Hard rollback is not allowed on protected branch '${currentBranch}' without explicit user approval.`,
          'ROLLBACK_PROTECTED_BRANCH'
        );
      }
      throw new GitError(
        'Hard rollback requires explicit user approval.', // We never do this automatically
        'ROLLBACK_REQUIRES_APPROVAL'
      );
    }

    try {
      // Soft rollback: unstage all changes
      await this.git.reset(['HEAD']);
      return {
        success: true,
        message: `Rolled back staged changes on ${currentBranch}`,
        details: { branch: currentBranch, mode: 'soft' },
      };
    } catch (err: any) {
      throw new GitError(
        `Rollback failed on ${currentBranch}: ${err.message}`,
        'ROLLBACK_FAILED',
        err
      );
    }
  }

  /**
   * Restore specific files to their last committed state (safe version of checkout --).
   * Only restores explicitly named files.
   */
  async restoreFiles(filePaths: string[]): Promise<GitOperationResult> {
    try {
      for (const fp of filePaths) {
        await this.git.checkout(['--', fp]);
      }
      return {
        success: true,
        message: `Restored ${filePaths.length} file(s) to last committed state`,
        details: { files: filePaths },
      };
    } catch (err: any) {
      throw new GitError(
        `Failed to restore files: ${err.message}`,
        'RESTORE_FAILED',
        err
      );
    }
  }

  // ==========================================================
  // LOG / HISTORY
  // ==========================================================

  /**
   * Get recent commit history.
   */
  async getLog(maxCount: number = 20): Promise<LogResult<DefaultLogFields>> {
    return this.git.log({ maxCount });
  }

  /**
   * Get information about the latest commit.
   */
  async getLastCommit(): Promise<DefaultLogFields | null> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      return log.latest || null;
    } catch {
      return null;
    }
  }

  /**
   * Get remote origin URL.
   */
  async getRepoUrl(): Promise<string | undefined> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      return origin?.refs?.fetch || origin?.refs?.push;
    } catch {
      return undefined;
    }
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  /**
   * Check if a file path exists.
   */
  private async exists(filePath: string): Promise<boolean> {
    try {
      // Using a dynamic import to avoid bundling fs in browser
      const { access } = await import('node:fs/promises');
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
