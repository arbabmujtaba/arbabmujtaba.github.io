/**
 * DeploymentCenter
 *
 * Real-time deployment monitoring dashboard.
 * Displays status cards, deployment timeline, publishing queue,
 * commit history, and quick links.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket, GitCommit, Globe, AlertTriangle, CheckCircle2, XCircle,
  Clock, Loader2, ExternalLink, RefreshCw, Activity, Layers,
  ChevronRight, Terminal, FileText, ArrowUpRight
} from 'lucide-react';

interface DeploymentStatus {
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
  publishingQueue: any[];
  stats: {
    totalPublished: number;
    totalFailed: number;
    pendingCount: number;
  };
}

export default function DeploymentCenter() {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [statusRes, commitsRes] = await Promise.all([
        fetch('/api/deploy/status'),
        fetch('/api/deploy/commits'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }
      if (commitsRes.ok) {
        const data = await commitsRes.json();
        setCommits(data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load deployment data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [loadData]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'building': return 'text-orange-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusBg = (s: string) => {
    switch (s) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'failed': return 'bg-red-500/10 border-red-500/20';
      case 'building': return 'bg-orange-500/10 border-orange-500/20';
      default: return 'bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'building': return <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-zinc-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Loading deployment data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="border border-red-500/30 bg-red-500/5 p-8 text-center rounded-sm max-w-md">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="font-sans text-sm text-red-400">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs uppercase tracking-wider transition-all cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-6 h-6 text-orange-500" />
          <h1 className="font-serif text-3xl text-zinc-200 font-medium tracking-tight">Deployment Center</h1>
        </div>
        <p className="font-sans text-xs text-zinc-500 font-light max-w-lg">
          Monitor publishing activity, track deployment status, and review the publishing queue.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {/* Current Status */}
        <div className={`border p-5 rounded-sm ${getStatusBg(status?.currentStatus || 'idle')}`}>
          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Current Status</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(status?.currentStatus || 'idle')}
            <span className={`font-serif text-lg font-medium capitalize ${getStatusColor(status?.currentStatus || 'idle')}`}>
              {status?.currentStatus || 'Idle'}
            </span>
          </div>
        </div>

        {/* Total Published */}
        <div className="border border-zinc-900 bg-zinc-950/50 p-5 rounded-sm">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Total Published</span>
          <span className="font-serif text-3xl font-medium text-zinc-100">{status?.stats.totalPublished || 0}</span>
        </div>

        {/* Pending */}
        <div className="border border-zinc-900 bg-zinc-950/50 p-5 rounded-sm">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Pending</span>
          <span className="font-serif text-3xl font-medium text-zinc-100">{status?.stats.pendingCount || 0}</span>
          {status?.stats.pendingCount > 0 && (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin mt-2" />
          )}
        </div>

        {/* Failed */}
        <div className="border border-zinc-900 bg-zinc-950/50 p-5 rounded-sm">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-3">Failed</span>
          <span className="font-serif text-3xl font-medium text-zinc-100">{status?.stats.totalFailed || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Deployments + Queue */}
        <div className="lg:col-span-2 space-y-8">
          {/* Last Published */}
          {status?.lastPublished && (
            <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Last Published
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">
                  {new Date(status.lastPublished.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="font-serif text-xl text-zinc-200 mb-2">{status.lastPublished.title}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded">{status.lastPublished.collection}</span>
                <span>{status.lastPublished.slug}</span>
                {status.lastPublished.commitHash && (
                  <span className="font-mono text-zinc-500">{status.lastPublished.commitHash}</span>
                )}
              </div>
            </div>
          )}

          {/* Publishing Queue */}
          <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-6">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Publishing Queue & History
            </h3>

            {status?.publishingQueue.length === 0 && status?.stats.totalPublished === 0 && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="font-sans text-xs text-zinc-500">No publishing activity yet.</p>
              </div>
            )}

            <div className="space-y-3">
              {status?.publishingQueue.map((job) => (
                <div key={job.id} className="border border-zinc-900 bg-zinc-950/40 rounded-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {job.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                      ) : job.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <p className="font-sans text-sm text-zinc-200">{job.title}</p>
                        <p className="font-mono text-[10px] text-zinc-500">{job.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedJob === job.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-zinc-900 space-y-2">
                          {job.steps.map((step: any) => (
                            <div key={step.step} className="flex items-center gap-3">
                              {step.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />}
                              {step.status === 'error' && <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                              {step.status === 'running' && <Loader2 className="w-3 h-3 text-orange-400 animate-spin shrink-0" />}
                              {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-zinc-700 shrink-0" />}
                              <span className="font-mono text-[10px] text-zinc-400 uppercase">{step.step}</span>
                              <span className="font-sans text-[10px] text-zinc-500 flex-1">{step.message}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Links + Commits */}
        <div className="space-y-8">
          {/* Quick Links */}
          <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-6">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4">Quick Links</h3>
            <div className="space-y-3">
              {status?.websiteUrl && (
                <a
                  href={status.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                >
                  <Globe className="w-4 h-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                  <span className="font-sans text-xs">Website</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </a>
              )}
              {status?.repoUrl && (
                <a
                  href={status.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                >
                  <GitCommit className="w-4 h-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                  <span className="font-sans text-xs">Repository</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </a>
              )}
            </div>
          </div>

          {/* Commit History */}
          <div className="border border-zinc-900 bg-zinc-950/30 rounded-sm p-6">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
              <GitCommit className="w-3.5 h-3.5" />
              Recent Commits
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {commits.length === 0 && (
                <p className="font-sans text-xs text-zinc-500">No commits found.</p>
              )}
              {commits.map((commit) => (
                <div key={commit.hash} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded mt-0.5">
                    {commit.hash}
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-xs text-zinc-300 truncate">{commit.message}</p>
                    <p className="font-mono text-[10px] text-zinc-600 mt-0.5">
                      {commit.author} • {new Date(commit.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
