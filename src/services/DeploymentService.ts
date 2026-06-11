/**
 * DeploymentService
 *
 * Tracks deployment state, aggregates publishing history,
 * and provides data for the Deployment Center dashboard.
 */

import { GitService } from './GitService';
import { PublishingService, PublishingJob } from './PublishingService';

export interface DeploymentStatus {
  currentStatus: 'idle' | 'building' | 'success' | 'failed';
  lastPublished: {
    title: string;
    collection: string;
    slug: string;
    timestamp: string;
    commitHash?: string;
  } | null;
  lastDeployment: {
    timestamp: string;
    status: 'success' | 'failed';
    commitHash?: string;
    message?: string;
  } | null;
  websiteUrl: string | null;
  repoUrl: string | null;
  latestResult: 'success' | 'failed' | 'unknown';
  publishingQueue: PublishingJob[];
  stats: {
    totalPublished: number;
    totalFailed: number;
    pendingCount: number;
  };
}

export interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  step?: string;
  jobId?: string;
}

export class DeploymentService {
  private gitService: GitService;
  private publishingService: PublishingService;
  private logs: DeploymentLog[] = [];
  private maxLogs: number = 500;

  constructor(publishingService: PublishingService) {
    this.gitService = new GitService();
    this.publishingService = publishingService;
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async getStatus(): Promise<DeploymentStatus> {
    const jobs = this.publishingService.getRecentJobs(50);
    const lastCompleted = jobs.find((j) => j.status === 'success' || j.status === 'error');
    const lastSuccess = jobs.find((j) => j.status === 'success');
    const pending = jobs.filter((j) => j.status === 'pending' || j.status === 'running');

    const currentStatus: DeploymentStatus['currentStatus'] =
      pending.length > 0 ? 'building' :
      lastCompleted?.status === 'success' ? 'success' :
      lastCompleted?.status === 'error' ? 'failed' : 'idle';

    const repoUrl = await this.gitService.getRepoUrl();
    const websiteUrl = this.deriveWebsiteUrl(repoUrl);

    return {
      currentStatus,
      lastPublished: lastSuccess
        ? {
            title: lastSuccess.title,
            collection: lastSuccess.collection,
            slug: lastSuccess.slug,
            timestamp: lastSuccess.updatedAt,
            commitHash: lastSuccess.commitHash,
          }
        : null,
      lastDeployment: lastCompleted
        ? {
            timestamp: lastCompleted.updatedAt,
            status: lastCompleted.status === 'success' ? 'success' : 'failed',
            commitHash: lastCompleted.commitHash,
            message: lastCompleted.error,
          }
        : null,
      websiteUrl,
      repoUrl,
      latestResult: lastCompleted?.status === 'success' ? 'success' : lastCompleted?.status === 'error' ? 'failed' : 'unknown',
      publishingQueue: pending,
      stats: {
        totalPublished: jobs.filter((j) => j.status === 'success').length,
        totalFailed: jobs.filter((j) => j.status === 'error').length,
        pendingCount: pending.length,
      },
    };
  }

  // ==========================================================
  // LOGS
  // ==========================================================

  addLog(log: Omit<DeploymentLog, 'timestamp'>): void {
    this.logs.push({
      ...log,
      timestamp: new Date().toISOString(),
    });
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(limit: number = 100): DeploymentLog[] {
    return this.logs.slice(-limit);
  }

  getLogsForJob(jobId: string): DeploymentLog[] {
    return this.logs.filter((l) => l.jobId === jobId);
  }

  // ==========================================================
  // HISTORY
  // ==========================================================

  async getCommitHistory(limit: number = 20): Promise<Array<{
    hash: string;
    message: string;
    date: string;
    author: string;
  }>> {
    try {
      const log = await this.gitService.getLog(limit);
      return log.all.map((commit) => ({
        hash: commit.hash.slice(0, 7),
        message: commit.message,
        date: commit.date,
        author: commit.author_name,
      }));
    } catch {
      return [];
    }
  }

  // ==========================================================
  // PROGRESS
  // ==========================================================

  getJobProgress(jobId: string): PublishingJob | undefined {
    return this.publishingService.getJob(jobId);
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private deriveWebsiteUrl(repoUrl: string | undefined): string | null {
    if (!repoUrl) return null;
    // Convert git@github.com:owner/repo.git → https://owner.github.io/repo
    // or https://github.com/owner/repo → https://owner.github.io/repo
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      // User/org site: owner.github.io repo → https://owner.github.io/
      // Project site: other repo → https://owner.github.io/repo/
      if (repo === `${owner}.github.io`) {
        return `https://${owner}.github.io/`;
      }
      return `https://${owner}.github.io/${repo}`;
    }
    return null;
  }
}

export default DeploymentService;
