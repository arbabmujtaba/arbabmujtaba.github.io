const DEBUG = process.env.DEBUG === 'true';

/**
 * PublishingService
 *
 * Orchestrates the 11-step publishing pipeline:
 *  1. Save content
 *  2. Save images (and guarantee their WebP derivatives)
 *  3. Validate markdown
 *  4. Validate metadata
 *  5. Generate slugs
 *  6. Generate frontmatter
 *  7. Stage files by name
 *  8. Generate commit message
 *  9. Commit changes
 * 10. Push changes
 * 11. Trigger deployment (implicit via git push → GitHub Pages)
 *
 * WHY IT USED TO "STICK" ON THE PUBLISHING SCREEN
 *
 * - `POST /api/publish` awaited the whole pipeline before answering, so the
 *   progress dialog could not open until everything — including the push — was
 *   over. There was nothing to watch while it ran.
 * - The push could run forever: the remote is HTTPS, and with no credential
 *   helper git asks for a username on the terminal that started the dev server.
 *   Nothing in the browser said so. GitService now disables terminal prompts and
 *   kills a git process that goes quiet, and the failure carries a hint.
 * - A failure before the commit "rolled back" by `git checkout -- <file>`, which
 *   silently threw away the edit the author had just saved. Gone: on failure we
 *   only unstage; the file on disk is left exactly as the editor wrote it.
 *
 * Now `start()` returns the job at once and runs the pipeline in the
 * background, one pipeline at a time (git has a single index). Every step has a
 * time limit, progress is streamed over SSE, and a push that fails after the
 * commit can be retried without redoing the rest.
 */

import path from 'path';
import fs from 'fs-extra';
import { GitService, GitError, PUSH_HINTS, githubUrls, type PushFailure } from './GitService';
import { MarkdownService } from './MarkdownService';
import { ValidationService } from './ValidationService';
import { ensureDerivatives } from './ImageDerivativeService';
import { markPublished } from '../lib/contentState';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const REGISTRY_PATH = path.join(process.cwd(), 'content-state.json');

/** Per-step ceilings. Generous; they exist so nothing can spin for ever. */
const LIMITS = {
  images: 4 * 60_000,
  stage: 60_000,
  commit: 60_000,
  push: 2 * 60_000,
};

const MAX_JOBS_KEPT = 50;

// ============================================================
// TYPES
// ============================================================

export type PublishingStep =
  | 'save_content'
  | 'save_images'
  | 'validate_markdown'
  | 'validate_metadata'
  | 'generate_slug'
  | 'generate_frontmatter'
  | 'stage_files'
  | 'generate_commit_message'
  | 'commit'
  | 'push'
  | 'trigger_deployment'
  | 'complete';

const STEP_ORDER: PublishingStep[] = [
  'save_content',
  'save_images',
  'validate_markdown',
  'validate_metadata',
  'generate_slug',
  'generate_frontmatter',
  'stage_files',
  'generate_commit_message',
  'commit',
  'push',
  'trigger_deployment',
  'complete',
];

export interface PublishingStepResult {
  step: PublishingStep;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  message: string;
  timestamp: string;
  /** When the step last went to `running`; lets the dialog show how long it has waited. */
  startedAt?: string;
  details?: Record<string, any>;
}

export interface PublishingJob {
  id: string;
  collection: string;
  slug: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  steps: PublishingStepResult[];
  createdAt: string;
  updatedAt: string;
  error?: string;
  /** What to do about `error`, in plain words. */
  hint?: string;
  errorCode?: string;
  /** The commit exists locally; only the push has to happen again. */
  canRetryPush?: boolean;
  commitHash?: string;
  deployedUrl?: string;
  actionsUrl?: string;
}

export interface PublishPayload {
  collection: string;
  slug: string;
  title: string;
  body: string;
  frontmatter: Record<string, any>;
  /**
   * The file this entry already lives in. A document's front-matter slug may
   * differ from its file name; writing `<slug>.md` regardless used to create a
   * second copy of the entry next to the original.
   */
  filePath?: string;
  images?: {
    coverImage?: string;
    galleryImages?: string[];
    newUploads?: { filename: string; buffer: Buffer }[];
  };
}

class StepTimeout extends Error {
  constructor(label: string, ms: number) {
    super(`${label} did not finish within ${Math.round(ms / 1000)}s`);
    this.name = 'StepTimeout';
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StepTimeout(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Every `/uploads/...` path anywhere in the front-matter. Reels carry `video`
 * and `videoPoster`, gateways `image`, the journal `featuredImage`: listing only
 * `coverImage` / `projectImage` / `galleryImages` meant a published reel could
 * reach the live site without its clip. Exported for tests.
 */
export function collectUploadRefs(frontmatter: Record<string, any>, body: string): string[] {
  const refs = new Set<string>();
  const visit = (value: unknown, depth: number) => {
    if (depth > 6 || value == null) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('/uploads/')) refs.add(trimmed.split(/[?#]/)[0]);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => visit(item, depth + 1));
    else if (typeof value === 'object') Object.values(value as Record<string, unknown>).forEach((item) => visit(item, depth + 1));
  };
  visit(frontmatter, 0);

  const patterns = [/!\[[^\]]*\]\((\/uploads\/[^)\s]+)/g, /(?:src|poster)=["'](\/uploads\/[^"']+)["']/g];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(body || '')) !== null) refs.add(match[1].split(/[?#]/)[0]);
  }
  return [...refs];
}

// ============================================================
// PUBLISHING SERVICE
// ============================================================

export class PublishingService {
  private gitService: GitService;
  private markdownService: MarkdownService;
  private validationService: ValidationService;
  private jobs: Map<string, PublishingJob> = new Map();
  private listeners: Map<string, Set<(job: PublishingJob) => void>> = new Map();
  private done: Map<string, Promise<void>> = new Map();
  /** One pipeline at a time: two concurrent runs would fight over .git/index.lock. */
  private chain: Promise<void> = Promise.resolve();

  constructor() {
    this.gitService = new GitService();
    this.markdownService = new MarkdownService();
    this.validationService = new ValidationService();
  }

  // ==========================================================
  // JOB MANAGEMENT
  // ==========================================================

  private createJobId(): string {
    return `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private createJob(payload: PublishPayload): PublishingJob {
    const now = new Date().toISOString();
    const job: PublishingJob = {
      id: this.createJobId(),
      collection: payload.collection,
      slug: payload.slug,
      title: payload.title,
      status: 'pending',
      steps: STEP_ORDER.map((step) => ({ step, status: 'pending', message: '', timestamp: now })),
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(job.id, job);
    // Keep the history bounded; the oldest finished jobs go first.
    if (this.jobs.size > MAX_JOBS_KEPT) {
      for (const [id, old] of this.jobs) {
        if (this.jobs.size <= MAX_JOBS_KEPT) break;
        if (old.status !== 'running' && old.status !== 'pending') {
          this.jobs.delete(id);
          this.listeners.delete(id);
          this.done.delete(id);
        }
      }
    }
    return job;
  }

  private updateStep(
    job: PublishingJob,
    step: PublishingStep,
    status: PublishingStepResult['status'],
    message: string,
    details?: Record<string, any>
  ) {
    const stepResult = job.steps.find((s) => s.step === step);
    if (stepResult) {
      const now = new Date().toISOString();
      if (status === 'running' && stepResult.status !== 'running') stepResult.startedAt = now;
      stepResult.status = status;
      stepResult.message = message;
      stepResult.timestamp = now;
      if (details !== undefined) stepResult.details = details;
    }
    job.updatedAt = new Date().toISOString();
    this.notifyListeners(job);
  }

  private setJobError(job: PublishingJob, error: string, extra: Partial<PublishingJob> = {}) {
    job.status = 'error';
    job.error = error;
    Object.assign(job, extra);
    job.updatedAt = new Date().toISOString();
    this.notifyListeners(job);
  }

  private setJobSuccess(job: PublishingJob, details?: Partial<PublishingJob>) {
    job.status = 'success';
    job.error = undefined;
    job.hint = undefined;
    job.errorCode = undefined;
    job.canRetryPush = false;
    job.updatedAt = new Date().toISOString();
    if (details) Object.assign(job, details);
    this.notifyListeners(job);
  }

  // ==========================================================
  // LISTENERS (for SSE)
  // ==========================================================

  subscribe(jobId: string, callback: (job: PublishingJob) => void): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);

    return () => {
      this.listeners.get(jobId)?.delete(callback);
    };
  }

  private notifyListeners(job: PublishingJob) {
    const set = this.listeners.get(job.id);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(job);
        } catch {
          // A closed stream must not stop the pipeline.
        }
      });
    }
  }

  getJob(jobId: string): PublishingJob | undefined {
    return this.jobs.get(jobId);
  }

  getRecentJobs(limit: number = 20): PublishingJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /** Resolves when the job has finished (either way). */
  whenDone(jobId: string): Promise<void> {
    return this.done.get(jobId) ?? Promise.resolve();
  }

  // ==========================================================
  // RETRY HELPER
  // ==========================================================

  /** Retry an operation with exponential backoff, for transient network failures only. */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options?: { maxRetries?: number; baseDelayMs?: number; retryableErrors?: string[] }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 2;
    const baseDelayMs = options?.baseDelayMs ?? 1000;
    const retryableErrors = options?.retryableErrors ?? ['PUSH_NETWORK_ERROR'];

    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const isRetryable = retryableErrors.includes(err?.code);
        if (!isRetryable || attempt >= maxRetries) throw err;
        await new Promise((res) => setTimeout(res, baseDelayMs * Math.pow(2, attempt)));
      }
    }
    throw lastError;
  }

  // ==========================================================
  // ENTRY POINTS
  // ==========================================================

  /**
   * Create the job and return it straight away; the pipeline runs in the
   * background. Publishing the same entry twice while the first run is still
   * going hands back the job already in progress (a double-click opens the
   * same dialog instead of an error).
   */
  start(payload: PublishPayload): PublishingJob {
    const inProgress = this.getRecentJobs(MAX_JOBS_KEPT).find(
      (job) =>
        (job.status === 'pending' || job.status === 'running') &&
        job.collection === payload.collection &&
        job.slug === payload.slug
    );
    if (inProgress) return inProgress;

    const job = this.createJob(payload);
    const waiting = this.getRecentJobs(MAX_JOBS_KEPT).some((other) => other.id !== job.id && (other.status === 'running' || other.status === 'pending'));
    if (waiting) this.updateStep(job, 'save_content', 'pending', 'Waiting for the publish before this one to finish…');

    const run = this.chain.then(() => this.run(job, payload));
    this.chain = run.catch(() => undefined);
    this.done.set(job.id, run.catch(() => undefined));
    return job;
  }

  /** Start and wait for the outcome. */
  async publish(payload: PublishPayload): Promise<PublishingJob> {
    const job = this.start(payload);
    await this.whenDone(job.id);
    return job;
  }

  /**
   * The commit is already made; only push (and report the deploy) again.
   * Returns null when the job cannot be retried.
   */
  retryPush(jobId: string): PublishingJob | null {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'error' || !job.canRetryPush) return null;

    job.status = 'pending';
    job.error = undefined;
    job.hint = undefined;
    job.errorCode = undefined;
    job.canRetryPush = false;
    for (const step of job.steps) {
      if (step.step === 'push' || step.step === 'trigger_deployment' || step.step === 'complete') {
        step.status = 'pending';
        step.message = '';
        step.startedAt = undefined;
      }
    }
    this.notifyListeners(job);

    const run = this.chain.then(async () => {
      job.status = 'running';
      this.notifyListeners(job);
      try {
        await this.pushAndDeploy(job);
      } catch (error) {
        this.fail(job, error, true);
      }
    });
    this.chain = run.catch(() => undefined);
    this.done.set(job.id, run.catch(() => undefined));
    return job;
  }

  // ==========================================================
  // THE PIPELINE
  // ==========================================================

  private async run(job: PublishingJob, payload: PublishPayload): Promise<void> {
    job.status = 'running';
    this.notifyListeners(job);

    let staged: string[] = [];
    let committed = false;

    try {
      // --- Step 1: Save Content ---
      this.updateStep(job, 'save_content', 'running', 'Writing the entry to content/…');
      const contentPath = await this.saveContent(payload);
      this.updateStep(job, 'save_content', 'success', path.relative(process.cwd(), contentPath), { paths: [contentPath] });

      // --- Step 2: Save Images ---
      this.updateStep(job, 'save_images', 'running', 'Collecting media…');
      const uploaded = await this.saveImages(payload);
      const referenced = await this.collectLocalImagePaths(payload);
      const assets = [...new Set([...uploaded, ...referenced])];

      /**
       * WebP derivatives. Uploads are converted in the background the moment
       * they land, so this is usually a no-op that just collects filenames. It
       * is still awaited rather than assumed — it is what makes it impossible to
       * push an original whose <source> has no file behind it.
       */
      this.updateStep(job, 'save_images', 'running', assets.length ? `Checking WebP versions of ${assets.length} file(s)…` : 'No media');
      const derivatives = assets.length ? await withTimeout(ensureDerivatives(assets), LIMITS.images, 'WebP conversion') : [];
      const media = [...assets, ...derivatives];
      this.updateStep(
        job,
        'save_images',
        media.length > 0 ? 'success' : 'skipped',
        media.length > 0 ? `${assets.length} file(s), ${derivatives.length} WebP derivative(s)` : 'No media to include',
        { paths: assets, derivatives }
      );

      // --- Step 3: Validate Markdown ---
      this.updateStep(job, 'validate_markdown', 'running', 'Validating markdown…');
      const mdResult = this.markdownService.validateMarkdown(payload.body);
      if (!mdResult.valid) throw new Error(`Markdown validation failed: ${mdResult.errors.join(', ')}`);
      this.updateStep(
        job,
        'validate_markdown',
        'success',
        mdResult.warnings.length ? `Valid · ${mdResult.warnings.length} warning(s)` : 'Markdown valid',
        { warnings: mdResult.warnings }
      );

      // --- Step 4: Validate Metadata ---
      this.updateStep(job, 'validate_metadata', 'running', 'Validating metadata…');
      const metaResult = this.validationService.validateMetadata(
        { ...payload.frontmatter, title: payload.frontmatter?.title || payload.title },
        payload.collection
      );
      if (!metaResult.valid) throw new Error(`Metadata validation failed: ${metaResult.errors.join(', ')}`);
      this.updateStep(job, 'validate_metadata', 'success', 'Metadata valid');

      // --- Step 5: Generate Slug ---
      this.updateStep(job, 'generate_slug', 'running', 'Checking the URL slug…');
      const slugResult = this.validationService.validateSlug(payload.slug);
      if (!slugResult.valid) throw new Error(`Slug validation failed: ${slugResult.errors.join(', ')}`);
      this.updateStep(job, 'generate_slug', 'success', `/${payload.collection}/${payload.slug}`);

      // --- Step 6: Generate Frontmatter ---
      this.updateStep(job, 'generate_frontmatter', 'running', 'Serialising front-matter…');
      this.markdownService.generateFrontmatter(payload.body, payload.frontmatter);
      this.updateStep(job, 'generate_frontmatter', 'success', 'Front-matter generated');

      // The registry move happens before staging so it rides in the same commit.
      try {
        await markPublished(payload.collection, payload.slug, { notes: `Published via pipeline job ${job.id}` });
      } catch (e: any) {
        if (DEBUG) console.warn(`[PublishingService] State transition skipped: ${e.message}`);
      }

      // --- Step 7: Stage Files ---
      this.updateStep(job, 'stage_files', 'running', 'Staging changes…');
      const registry = (await fs.pathExists(REGISTRY_PATH)) ? [REGISTRY_PATH] : [];
      const toStage = [...new Set([contentPath, ...registry, ...media])];
      await withTimeout(this.gitService.stageFiles(toStage), LIMITS.stage, 'Staging');
      staged = toStage;
      this.updateStep(job, 'stage_files', 'success', `${toStage.length} file(s) staged`, { files: toStage.map((p) => path.relative(process.cwd(), p)) });

      // --- Step 8: Generate Commit Message ---
      this.updateStep(job, 'generate_commit_message', 'running', 'Writing the commit message…');
      const commitMsg = this.gitService.generateCommitMessage(payload.title);
      this.updateStep(job, 'generate_commit_message', 'success', commitMsg, { message: commitMsg });

      // --- Step 9: Commit ---
      this.updateStep(job, 'commit', 'running', 'Committing…');
      const commitResult = await withTimeout(this.gitService.commit(commitMsg, toStage), LIMITS.commit, 'git commit');
      committed = true;
      job.commitHash = commitResult.details?.commitHash;
      this.updateStep(job, 'commit', 'success', commitResult.message, { commitHash: job.commitHash });

      // --- Steps 10–11 ---
      await this.pushAndDeploy(job);
    } catch (error) {
      if (!committed && staged.length > 0) {
        // Leave the saved file exactly as it is on disk; just take it out of the index.
        await this.gitService.unstageFiles(staged).catch(() => undefined);
      }
      this.fail(job, error, committed);
    }
  }

  private async pushAndDeploy(job: PublishingJob): Promise<void> {
    // --- Step 10: Push ---
    const ahead = await this.gitService.aheadCount();
    this.updateStep(job, 'push', 'running', ahead > 0 ? `Pushing ${ahead} commit(s) to GitHub…` : 'Pushing to GitHub…');
    const pushResult = await withTimeout(
      this.retryWithBackoff(() => this.gitService.push(), { maxRetries: 2, baseDelayMs: 1500 }),
      LIMITS.push,
      'git push'
    );
    this.updateStep(job, 'push', 'success', pushResult.message);

    // --- Step 11: Trigger Deployment ---
    this.updateStep(job, 'trigger_deployment', 'running', 'Handing over to GitHub Pages…');
    const urls = githubUrls(await this.gitService.getRepoUrl());
    this.updateStep(
      job,
      'trigger_deployment',
      'success',
      urls.actions ? 'GitHub Actions is building the site — usually live in 1–2 minutes' : 'Pushed — the deploy workflow takes it from here',
      { deployedUrl: urls.site, actionsUrl: urls.actions }
    );

    this.updateStep(job, 'complete', 'success', 'Published');
    this.setJobSuccess(job, { deployedUrl: urls.site || undefined, actionsUrl: urls.actions || undefined });
  }

  private fail(job: PublishingJob, error: unknown, committed: boolean) {
    const err = error as any;
    const message = err?.message || String(error);
    const running = job.steps.find((s) => s.status === 'running');
    if (running) this.updateStep(job, running.step, 'error', message);

    let hint: string | undefined;
    let canRetryPush = false;
    const code: string | undefined = err instanceof GitError ? err.code : err instanceof StepTimeout ? 'TIMEOUT' : undefined;

    if (code && code in PUSH_HINTS) {
      hint = PUSH_HINTS[code as PushFailure];
      canRetryPush = committed;
    } else if (err instanceof StepTimeout && running?.step === 'push') {
      hint = PUSH_HINTS.PUSH_TIMEOUT;
      canRetryPush = committed;
    } else if (running?.step === 'validate_metadata' || running?.step === 'validate_markdown' || running?.step === 'generate_slug') {
      hint = 'Your edit is saved on disk — fix the field above in the editor and publish again.';
    } else if (running?.step === 'save_images') {
      hint = 'One of the images could not be converted. Re-upload it from the editor, or run `npm run optimize:images` to see the error.';
    } else if (committed) {
      hint = PUSH_HINTS.PUSH_FAILED;
      canRetryPush = true;
    }

    console.error(`[publish] ${job.id} failed at ${running?.step ?? 'unknown step'}: ${message}`);
    this.setJobError(job, message, { hint, canRetryPush, errorCode: code });
  }

  // ==========================================================
  // STEP IMPLEMENTATIONS
  // ==========================================================

  private resolveContentPath(payload: PublishPayload): string {
    const colDir = path.resolve(CONTENT_DIR, payload.collection);
    const candidate = payload.filePath ? path.resolve(payload.filePath) : path.join(colDir, `${payload.slug}.md`);
    if (!candidate.startsWith(colDir + path.sep) || !candidate.endsWith('.md')) {
      throw new Error('Refusing to write outside the collection folder');
    }
    return candidate;
  }

  private async saveContent(payload: PublishPayload): Promise<string> {
    const filePath = this.resolveContentPath(payload);
    await fs.ensureDir(path.dirname(filePath));
    const markdownStr = this.markdownService.generateFrontmatter(payload.body, payload.frontmatter);
    await fs.writeFile(filePath, markdownStr, 'utf-8');
    return filePath;
  }

  private async saveImages(payload: PublishPayload): Promise<string[]> {
    const savedPaths: string[] = [];
    const newUploads = payload.images?.newUploads || [];

    for (const upload of newUploads) {
      const targetDir = path.join(UPLOADS_DIR, payload.collection);
      await fs.ensureDir(targetDir);
      const targetPath = path.join(targetDir, path.basename(upload.filename));
      await fs.writeFile(targetPath, upload.buffer);
      savedPaths.push(targetPath);
    }

    return savedPaths;
  }

  /** Absolute paths of every local upload the entry references that exists on disk. */
  private async collectLocalImagePaths(payload: PublishPayload): Promise<string[]> {
    const publicDir = path.resolve(process.cwd(), 'public');
    const result: string[] = [];
    for (const url of collectUploadRefs(payload.frontmatter || {}, payload.body || '')) {
      let decoded = url;
      try {
        decoded = decodeURIComponent(url);
      } catch {
        // keep the raw form
      }
      const absPath = path.resolve(publicDir, `.${decoded}`);
      if (!absPath.startsWith(UPLOADS_DIR + path.sep)) continue;
      if (await fs.pathExists(absPath)) result.push(absPath);
    }
    return result;
  }
}
