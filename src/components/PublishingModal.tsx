/**
 * PublishingModal
 *
 * Premium publishing progress dialog with animated step timeline.
 * Connects to SSE for real-time pipeline updates.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, XCircle, Loader2, Rocket, Globe,
  GitCommit, FileText, Image, FileCheck, Tag,
  FolderGit, MessageSquare, Upload, Sparkles,
  ExternalLink, ChevronRight, AlertTriangle, X
} from 'lucide-react';

interface StepDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  { key: 'save_content', label: 'Save Content', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'save_images', label: 'Save Images', icon: <Image className="w-3.5 h-3.5" /> },
  { key: 'validate_markdown', label: 'Validate Markdown', icon: <FileCheck className="w-3.5 h-3.5" /> },
  { key: 'validate_metadata', label: 'Validate Metadata', icon: <Tag className="w-3.5 h-3.5" /> },
  { key: 'generate_slug', label: 'Generate Slug', icon: <FolderGit className="w-3.5 h-3.5" /> },
  { key: 'generate_frontmatter', label: 'Generate Frontmatter', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'stage_files', label: 'Stage Files', icon: <FolderGit className="w-3.5 h-3.5" /> },
  { key: 'generate_commit_message', label: 'Commit Message', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: 'commit', label: 'Commit', icon: <GitCommit className="w-3.5 h-3.5" /> },
  { key: 'push', label: 'Push', icon: <Upload className="w-3.5 h-3.5" /> },
  { key: 'trigger_deployment', label: 'Deploy', icon: <Rocket className="w-3.5 h-3.5" /> },
];

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export default function PublishingModal({ isOpen, onClose, jobId }: PublishingModalProps) {
  const [job, setJob] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    const es = new EventSource(`/api/publish/${jobId}/progress`);
    eventSourceRef.current = es;
    setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setConnected(false);
          es.close();
          return;
        }
        setJob(data);
        if (data.status === 'success' || data.status === 'error') {
          setTimeout(() => { setConnected(false); es.close(); }, 2000);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isOpen, jobId]);

  const currentStepIndex = job?.steps
    ? STEPS.findIndex(s => s.key === job.steps.find((st: any) => st.status === 'running')?.step)
    : -1;

  const completedSteps = job?.steps
    ? job.steps.filter((s: any) => s.status === 'success').length
    : 0;

  const totalSteps = STEPS.length;
  const progress = Math.max(0, Math.min(100, (completedSteps / totalSteps) * 100));

  const isSuccess = job?.status === 'success';
  const isError = job?.status === 'error';
  const isDone = isSuccess || isError;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={isDone ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-4 bg-[#0d0d0c] border border-zinc-800 rounded-sm shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-zinc-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSuccess ? (
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                ) : isError ? (
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-orange-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-serif text-lg text-zinc-200 font-medium">
                    {isSuccess ? 'Published!' : isError ? 'Publish Failed' : 'Publishing…'}
                  </h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    {jobId ? jobId.slice(0, 16) + '…' : 'Preparing'}
                  </p>
                </div>
              </div>
              {isDone && (
                <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {!isDone && (
              <div className="h-px bg-zinc-900 relative">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Step Timeline */}
              <div className="space-y-1">
                {STEPS.map((step, idx) => {
                  const jobStep = job?.steps?.find((s: any) => s.step === step.key);
                  const status = jobStep?.status || 'pending';
                  const isActive = status === 'running';
                  const isCompleted = status === 'success';
                  const isFailed = status === 'error';

                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className={`flex items-center gap-3 py-2 px-2 rounded-sm transition-all ${
                        isActive ? 'bg-orange-500/5' : isFailed ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <div className="shrink-0 w-5 flex justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : isFailed ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-zinc-800" />
                        )}
                      </div>
                      <div className="shrink-0 text-zinc-500">{step.icon}</div>
                      <span className={`font-sans text-xs ${
                        isActive ? 'text-orange-300' : isCompleted ? 'text-zinc-300' : isFailed ? 'text-red-300' : 'text-zinc-600'
                      }`}>
                        {step.label}
                      </span>
                      {isActive && jobStep?.message && (
                        <span className="font-mono text-[9px] text-zinc-500 ml-auto truncate">{jobStep.message}</span>
                      )}
                      {isFailed && jobStep?.message && (
                        <span className="font-mono text-[9px] text-red-400 ml-auto truncate">{jobStep.message}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Success Footer */}
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 pt-6 border-t border-zinc-900 space-y-3"
                >
                  {job?.commitHash && (
                    <div className="flex items-center gap-3 text-zinc-400">
                      <GitCommit className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">{job.commitHash}</span>
                    </div>
                  )}
                  {job?.deployedUrl && (
                    <a
                      href={job.deployedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 text-orange-500/80 hover:text-orange-400 group transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="font-sans text-xs">View Website</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-sans text-xs uppercase tracking-[0.15em] font-medium rounded-sm transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error Footer */}
              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 pt-6 border-t border-zinc-900"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="font-sans text-xs text-red-400">{job?.error || 'Publishing failed'}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-sans text-xs uppercase tracking-[0.15em] rounded-sm transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
