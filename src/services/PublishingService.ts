const DEBUG = process.env.DEBUG === 'true';

/**
 * PublishingService
 *
 * Orchestrates the 11-step publishing pipeline:
 *  1. Save content
 *  2. Save images
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
 * Progress is tracked per job and streamed via SSE.
 */

import path from 'path';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { GitService, GitError } from './GitService';
import { MarkdownService } from './MarkdownService';
import { ValidationService } from './ValidationService';
import {
  transitionState,
  getItem,
  saveItem,
  ContentItem,
  InvalidTransitionError,
} from '../lib/contentState';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

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

export interface PublishingStepResult {
  step: PublishingStep;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  message: string;
  timestamp: string;
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
  commitHash?: string;
  deployedUrl?: string;
}

export interface PublishPayload {
  collection: string;
  slug: string;
  title: string;
  body: string;
  frontmatter: Record<string, any>;
  images?: {
    coverImage?: string;
    galleryImages?: string[];
    newUploads?: { filename: string; buffer: Buffer }[];
  };
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
    const steps: PublishingStepResult[] = [
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
    ].map((step) => ({
      step: step as PublishingStep,
      status: 'pending',
      message: '',
      timestamp: new Date().toISOString(),
    }));

    const job: PublishingJob = {
      id: this.createJobId(),
      collection: payload.collection,
      slug: payload.slug,
      title: payload.title,
      status: 'pending',
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
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
      stepResult.status = status;
      stepResult.message = message;
      stepResult.timestamp = new Date().toISOString();
      stepResult.details = details;
    }
    job.updatedAt = new Date().toISOString();
    this.notifyListeners(job);
  }

  private setJobError(job: PublishingJob, error: string) {
    job.status = 'error';
    job.error = error;
    job.updatedAt = new Date().toISOString();
    this.notifyListeners(job);
  }

  private setJobSuccess(job: PublishingJob, details?: Record<string, any>) {
    job.status = 'success';
    job.updatedAt = new Date().toISOString();
    if (details) {
      job.commitHash = details.commitHash;
      job.deployedUrl = details.deployedUrl;
    }
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

    // Immediately send current state
    const job = this.jobs.get(jobId);
    if (job) callback(job);

    return () => {
      this.listeners.get(jobId)?.delete(callback);
    };
  }

  private notifyListeners(job: PublishingJob) {
    const set = this.listeners.get(job.id);
    if (set) {
      set.forEach((cb) => {
        try { cb(job); } catch {} // ignore listener errors
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

  // ==========================================================
  // RETRY HELPER
  // ==========================================================

  /**
   * Retry an operation with exponential backoff for transient failures.
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      baseDelayMs?: number;
      retryableErrors?: string[];
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 1000;
    const retryableErrors = options?.retryableErrors ?? ['PUSH_NETWORK_ERROR', 'PUSH_REJECTED'];

    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const isRetryable = retryableErrors.some(
          (code) => err.code === code || err.message?.includes(code)
        );
        if (!isRetryable || attempt >= maxRetries) {
          throw err;
        }
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastError;
  }

  // ==========================================================
  // DUPLICATE GUARD
  // ==========================================================

  private isDuplicatePublish(payload: PublishPayload): boolean {
    const recent = this.getRecentJobs(10);
    const now = Date.now();
    return recent.some((job) => {
      if (job.status === 'error' || job.status === 'cancelled') return false;
      const age = now - new Date(job.createdAt).getTime();
      return (
        age < 60000 && // within 60 seconds
        job.collection === payload.collection &&
        job.slug === payload.slug
      );
    });
  }

  // ==========================================================
  // MAIN ORCHESTRATOR
  // ==========================================================

  async publish(payload: PublishPayload): Promise<PublishingJob> {
    const job = this.createJob(payload);
    job.status = 'running';
    this.notifyListeners(job);

    // Duplicate guard
    if (this.isDuplicatePublish(payload)) {
      this.setJobError(job, 'Duplicate publish detected. Please wait 60 seconds between publishes of the same content.');
      return job;
    }

    try {
      // --- Step 1: Save Content ---
      this.updateStep(job, 'save_content', 'running', 'Saving content to filesystem...');
      const savedPaths = await this.saveContent(payload);
      this.updateStep(job, 'save_content', 'success', 'Content saved', { paths: savedPaths });

      // --- Step 2: Save Images ---
      this.updateStep(job, 'save_images', 'running', 'Processing images...');
      const imagePaths = await this.saveImages(payload);

      // --- Step 2b: Collect existing local image refs ---
      const referencedImagePaths = await this.collectLocalImagePaths(payload);
      const allImagePaths = [...new Set([...imagePaths, ...referencedImagePaths])];

      this.updateStep(job, 'save_images', allImagePaths.length > 0 ? 'success' : 'skipped', allImagePaths.length > 0 ? `${allImagePaths.length} image(s) saved` : 'No new images', { paths: allImagePaths });

      // --- Step 3: Validate Markdown ---
      this.updateStep(job, 'validate_markdown', 'running', 'Validating markdown...');
      const mdResult = this.markdownService.validateMarkdown(payload.body);
      if (!mdResult.valid) {
        throw new Error(`Markdown validation failed: ${mdResult.errors.join(', ')}`);
      }
      this.updateStep(job, 'validate_markdown', 'success', 'Markdown valid', { warnings: mdResult.warnings });

      // --- Step 4: Validate Metadata ---
      this.updateStep(job, 'validate_metadata', 'running', 'Validating metadata...');
      const metaResult = this.validationService.validateMetadata(payload.frontmatter, payload.collection);
      if (!metaResult.valid) {
        throw new Error(`Metadata validation failed: ${metaResult.errors.join(', ')}`);
      }
      this.updateStep(job, 'validate_metadata', 'success', 'Metadata valid');

      // --- Step 5: Generate Slug ---
      this.updateStep(job, 'generate_slug', 'running', 'Generating URL slug...');
      const slugResult = this.validationService.validateSlug(payload.slug);
      if (!slugResult.valid) {
        throw new Error(`Slug validation failed: ${slugResult.errors.join(', ')}`);
      }
      this.updateStep(job, 'generate_slug', 'success', `Slug: ${payload.slug}`);

      // --- Step 6: Generate Frontmatter ---
      this.updateStep(job, 'generate_frontmatter', 'running', 'Serializing frontmatter...');
      const markdownStr = this.markdownService.generateFrontmatter(payload.body, payload.frontmatter);
      this.updateStep(job, 'generate_frontmatter', 'success', 'Frontmatter generated');

      // --- Step 7: Stage Files ---
      this.updateStep(job, 'stage_files', 'running', 'Staging changes...');
      const allPaths = [...savedPaths, ...allImagePaths];
      if (allPaths.length > 0) {
        await this.gitService.stageFiles(allPaths);
      }
      this.updateStep(job, 'stage_files', 'success', `${allPaths.length} file(s) staged`);

      // --- Step 8: Generate Commit Message ---
      this.updateStep(job, 'generate_commit_message', 'running', 'Generating commit message...');
      const commitMsg = this.gitService.generateCommitMessage(payload.title);
      this.updateStep(job, 'generate_commit_message', 'success', commitMsg, { message: commitMsg });

      // --- Step 9: Commit ---
      this.updateStep(job, 'commit', 'running', 'Committing changes...');
      const commitResult = await this.gitService.commit(commitMsg);
      const commitHash = commitResult.details?.commitHash;
      this.updateStep(job, 'commit', 'success', commitResult.message, { commitHash });

      // --- Step 10: Push (with retry on transient network errors) ---
      this.updateStep(job, 'push', 'running', 'Pushing to remote...');
      const pushResult = await this.retryWithBackoff(
        () => this.gitService.push(),
        { maxRetries: 3, baseDelayMs: 1000, retryableErrors: ['PUSH_NETWORK_ERROR', 'PUSH_REJECTED'] }
      );
      this.updateStep(job, 'push', 'success', pushResult.message);

      // --- Step 11: Trigger Deployment ---
      this.updateStep(job, 'trigger_deployment', 'running', 'Triggering deployment via GitHub Pages...');
      const repoUrl = await this.gitService.getRepoUrl();
      const deployedUrl = repoUrl
        ?.replace(/git@github\.com:/, 'https://github.com/')
        ?.replace(/\.git$/, '')
        ?.replace(/github\.com\//, '') || '';
      this.updateStep(job, 'trigger_deployment', 'success', 'Deployment triggered', { deployedUrl });

      // --- Complete ---
      this.updateStep(job, 'complete', 'success', 'Published successfully!');

      // Transition content state to published
      try {
        await transitionState(payload.collection, payload.slug, 'published', {
          notes: `Published via pipeline job ${job.id}`,
        });
      } catch (e: any) {
        // Ignore state transition errors — content is already published
        console.warn(`[PublishingService] State transition skipped: ${e.message}`);
      }

      this.setJobSuccess(job, { commitHash, deployedUrl });
      return job;
    } catch (error: any) {
      // Mark current running step as error
      const currentStep = job.steps.find((s) => s.status === 'running');
      if (currentStep) {
        this.updateStep(job, currentStep.step, 'error', error.message);
      }

      // Attempt soft rollback
      try {
        await this.gitService.restoreFiles([path.join(CONTENT_DIR, payload.collection, `${payload.slug}.md`)]);
        if (DEBUG) console.log('[PublishingService] Rolled back uncommitted content file');
      } catch {
        // ignore rollback failure
      }

      this.setJobError(job, error.message);
      return job;
    }
  }

  // ==========================================================
  // STEP IMPLEMENTATIONS
  // ==========================================================

  private async saveContent(payload: PublishPayload): Promise<string[]> {
    const colDir = path.join(CONTENT_DIR, payload.collection);
    await fs.ensureDir(colDir);

    const filePath = path.join(colDir, `${payload.slug}.md`);
    const markdownStr = this.markdownService.generateFrontmatter(
      payload.body,
      payload.frontmatter
    );
    await fs.writeFile(filePath, markdownStr, 'utf-8');

    // Also update content-state.json
    const registryPath = path.join(process.cwd(), 'content-state.json');

    return [filePath, registryPath].filter(Boolean) as string[];
  }

  private async saveImages(payload: PublishPayload): Promise<string[]> {
    const savedPaths: string[] = [];
    const newUploads = payload.images?.newUploads || [];

    for (const upload of newUploads) {
      const targetDir = path.join(UPLOADS_DIR, payload.collection);
      await fs.ensureDir(targetDir);
      const targetPath = path.join(targetDir, upload.filename);
      await fs.writeFile(targetPath, upload.buffer);
      savedPaths.push(targetPath);
    }

    return savedPaths;
  }

  /**
   * Scan frontmatter and markdown body for local /uploads/... image paths
   * and return absolute filesystem paths for any that exist.
   */
  private async collectLocalImagePaths(payload: PublishPayload): Promise<string[]> {
    const cwd = process.cwd();
    const imageUrls: Set<string> = new Set();

    // -- Frontmatter fields --
    const scanValue = (val: unknown) => {
      if (typeof val !== 'string') return;
      const trimmed = val.trim();
      if (trimmed.startsWith('/uploads/')) {
        imageUrls.add(trimmed);
      }
    };

    const fm = payload.frontmatter || {};
    scanValue(fm.coverImage);
    scanValue(fm.projectImage);
    if (Array.isArray(fm.galleryImages)) {
      for (const img of fm.galleryImages) {
        scanValue(img);
      }
    }

    // -- Markdown body: ![alt](/uploads/...) --
    const bodyImageRegex = /!\[.*?\]\((\/uploads\/[^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = bodyImageRegex.exec(payload.body || '')) !== null) {
      imageUrls.add(match[1]);
    }

    // Resolve to absolute paths and filter existing files
    const result: string[] = [];
    for (const url of imageUrls) {
      const absPath = path.join(cwd, 'public', url);
      const exists = await fs.pathExists(absPath);
      if (exists) {
        result.push(absPath);
      }
    }
    return result;
  }
}

export default PublishingService;
