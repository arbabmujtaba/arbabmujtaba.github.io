/**
 * GitService
 *
 * Safe, automated Git operations using simple-git.
 *
 * Rules enforced:
 * - Files staged explicitly by name (no `git add -A` / `git add .`)
 * - Default branch detected dynamically via `git symbolic-ref`
 * - No destructive commands (`reset --hard`, `push --force`, `branch -D`, `clean -f`) on protected branches
 * - Non-interactive execution via `GIT_EDITOR=true`
 * - Auto-generated commit messages in format: "Published: {Title}"
 */

import { simpleGit, SimpleGit, StatusResult, DefaultLogFields, LogResult } from 'simple-git';
import path from 'path';
import { execSync } from 'child_process';

const PROTECTED_BRANCHES = ['main', 'master'];

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
    });
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
   * Create a commit with an auto-generated message.
   * Always sets GIT_EDITOR=true to prevent interactive prompts.
   */
  async commit(message: string): Promise<GitOperationResult> {
    const currentBranch = await this.getCurrentBranch();

    try {
      // Set GIT_EDITOR to prevent interactive prompts
      process.env.GIT_EDITOR = 'true';
      const result = await this.git.commit(message);

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
        message: 'No changes to commit',
        details: { branch: currentBranch },
      };
    } catch (err: any) {
      throw new GitError(
        `Commit failed on ${currentBranch}: ${err.message}`,
        'COMMIT_FAILED',
        err
      );
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
      // Check for common push errors
      if (err.message?.includes('rejected')) {
        throw new GitError(
          `Push rejected on ${currentBranch}. Remote has diverging changes.`,
          'PUSH_REJECTED',
          err
        );
      }
      if (err.message?.includes('could not resolve host')) {
        throw new GitError(
          'Network error: Cannot reach remote repository.',
          'PUSH_NETWORK_ERROR',
          err
        );
      }
      throw new GitError(
        `Push failed on ${currentBranch}: ${err.message}`,
        'PUSH_FAILED',
        err
      );
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

export default GitService;
