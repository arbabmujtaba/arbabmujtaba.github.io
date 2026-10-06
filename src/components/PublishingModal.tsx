/**
 * PublishingModal
 *
 * Live progress for one publishing job.
 *
 * It used to be possible for this dialog to sit on "Publishing…" for ever with
 * no way out: the close button only existed once the job had finished, and if
 * the event stream dropped (or the server had restarted and no longer knew the
 * job) it simply stopped listening and kept spinning. Now:
 *
 * - the stream falls back to polling, and a job the server no longer knows
 *   is reported as such instead of waiting;
 * - it can always be closed — while running, "Run in background" hides it and
 *   the job carries on (the Deployments view and a reload both pick it up);
 * - a step that is taking long says how long, and the push step says why it
 *   may be waiting;
 * - a failure explains what to do, and a failed push can be retried without
 *   redoing the commit.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  FolderGit,
  GitCommit,
  Globe,
  Image,
  Loader2,
  MessageSquare,
  RotateCw,
  Rocket,
  Tag,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { getPublishJob, retryPush, type PublishJob, type PublishStep } from './admin/api';

interface StepDef {
  key: string;
  label: string;
  icon: ReactNode;
}

const STEPS: StepDef[] = [
  { key: 'save_content', label: 'Save content', icon: <FileText className="h-3.5 w-3.5" /> },
  { key: 'save_images', label: 'Media & WebP', icon: <Image className="h-3.5 w-3.5" /> },
  { key: 'validate_markdown', label: 'Validate markdown', icon: <FileCheck className="h-3.5 w-3.5" /> },
  { key: 'validate_metadata', label: 'Validate metadata', icon: <Tag className="h-3.5 w-3.5" /> },
  { key: 'generate_slug', label: 'Check the URL', icon: <FolderGit className="h-3.5 w-3.5" /> },
  { key: 'generate_frontmatter', label: 'Front-matter', icon: <FileText className="h-3.5 w-3.5" /> },
  { key: 'stage_files', label: 'Stage files', icon: <FolderGit className="h-3.5 w-3.5" /> },
  { key: 'generate_commit_message', label: 'Commit message', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: 'commit', label: 'Commit', icon: <GitCommit className="h-3.5 w-3.5" /> },
  { key: 'push', label: 'Push to GitHub', icon: <Upload className="h-3.5 w-3.5" /> },
  { key: 'trigger_deployment', label: 'Deploy', icon: <Rocket className="h-3.5 w-3.5" /> },
];

/** The job the studio is watching survives a reload (Vite can reload the page mid-publish). */
export const ACTIVE_JOB_KEY = 'studio:publish-job';

type Link = 'stream' | 'polling' | 'lost';

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

/** Render `code` spans inside a hint. */
function withCode(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={index} className="rounded bg-[var(--bg-lift)] px-1 py-0.5 font-mono text-[0.6875rem] text-zinc-100">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function seconds(from?: string, now = Date.now()): number {
  if (!from) return 0;
  return Math.max(0, Math.round((now - new Date(from).getTime()) / 1000));
}

export default function PublishingModal({ isOpen, onClose, jobId }: PublishingModalProps) {
  const reduceMotion = useReducedMotion();
  const [job, setJob] = useState<PublishJob | null>(null);
  const [link, setLink] = useState<Link>('stream');
  const [now, setNow] = useState(() => Date.now());
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [generation, setGeneration] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const isSuccess = job?.status === 'success';
  const isError = job?.status === 'error';
  const isDone = isSuccess || isError || link === 'lost';

  // Reset when a different job is shown.
  useEffect(() => {
    setJob(null);
    setLink('stream');
    setRetryError('');
  }, [jobId]);

  // Remember the job while it runs; forget it once the author has seen the outcome.
  useEffect(() => {
    if (!jobId) return;
    try {
      window.sessionStorage.setItem(ACTIVE_JOB_KEY, jobId);
    } catch {
      // storage unavailable — nothing to resume, which is fine
    }
  }, [jobId]);

  // Stream, with a polling fallback.
  useEffect(() => {
    if (!isOpen || !jobId) return;
    let cancelled = false;
    let es: EventSource | null = null;
    let poll: number | undefined;

    const finished = (data: PublishJob) => data.status === 'success' || data.status === 'error';

    const startPolling = () => {
      if (cancelled || poll !== undefined) return;
      setLink('polling');
      const tick = async () => {
        try {
          const data = await getPublishJob(jobId);
          if (cancelled) return;
          if (!data) {
            setLink('lost');
            window.clearInterval(poll);
            return;
          }
          setJob(data);
          if (finished(data)) window.clearInterval(poll);
        } catch {
          // server briefly unreachable; keep trying
        }
      };
      void tick();
      poll = window.setInterval(tick, 1500);
    };

    try {
      es = new EventSource(`/api/publish/${encodeURIComponent(jobId)}/progress`);
      setLink('stream');
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.notFound || data?.error === 'Job not found') {
            es?.close();
            setLink('lost');
            return;
          }
          setJob(data as PublishJob);
          if (finished(data)) es?.close();
        } catch {
          // ignore a malformed frame
        }
      };
      es.onerror = () => {
        es?.close();
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      es?.close();
      if (poll !== undefined) window.clearInterval(poll);
    };
  }, [isOpen, jobId, generation]);

  // A one-second clock, only while something is running, for the elapsed counters.
  const running = !!job && (job.status === 'running' || job.status === 'pending');
  useEffect(() => {
    if (!isOpen || !running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, running]);

  const close = useCallback(() => {
    if (isDone) {
      try {
        window.sessionStorage.removeItem(ACTIVE_JOB_KEY);
      } catch {
        // ignore
      }
    }
    onClose();
  }, [isDone, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const doRetry = async () => {
    if (!job) return;
    setRetrying(true);
    setRetryError('');
    try {
      await retryPush(job.id);
      setJob({ ...job, status: 'running', error: undefined, hint: undefined, canRetryPush: false });
      setGeneration((value) => value + 1);
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : 'Could not retry');
    } finally {
      setRetrying(false);
    }
  };

  const stepOf = (key: string): PublishStep | undefined => job?.steps?.find((s) => s.step === key);
  const completed = STEPS.filter((s) => {
    const status = stepOf(s.key)?.status;
    return status === 'success' || status === 'skipped';
  }).length;
  const progress = isSuccess ? 100 : Math.round((completed / STEPS.length) * 100);
  const active = STEPS.find((s) => stepOf(s.key)?.status === 'running');
  const activeStep = active ? stepOf(active.key) : undefined;
  const activeFor = seconds(activeStep?.startedAt, now);
  const totalFor = seconds(job?.createdAt, isDone && job ? new Date(job.updatedAt).getTime() : now);
  const waiting = job?.status === 'pending' || (!job && link !== 'lost');

  const heading = link === 'lost' ? 'Lost track of this publish' : isSuccess ? 'Published' : isError ? 'Publish stopped' : 'Publishing';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-heading"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="st-card st-publish relative mx-0 w-full max-w-lg overflow-hidden outline-none sm:mx-4"
            data-state={isSuccess ? 'success' : isError || link === 'lost' ? 'error' : 'running'}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="st-publish-orb" aria-hidden="true">
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isError || link === 'lost' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 id="publish-heading" className="st-title text-lg">
                    {heading}
                    {!isDone && <span className="st-pulse">…</span>}
                  </h2>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    {job ? `${job.collection} / ${job.slug}` : 'connecting'}
                    {job && ` · ${totalFor}s`}
                    {link === 'polling' && !isDone && ' · polling'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="st-btn st-btn-ghost st-btn-sm flex-none"
                aria-label={isDone ? 'Close' : 'Run in background'}
                title={isDone ? 'Close' : 'Hide — publishing keeps going'}
              >
                {isDone ? <X className="h-4 w-4" /> : 'Run in background'}
              </button>
            </div>

            {/* Progress */}
            <div className="relative h-[2px] bg-[var(--rule)]" aria-hidden="true">
              <motion.div
                className="st-publish-bar absolute left-0 top-0 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="sr-only" role="status" aria-live="polite">
              {heading}. {active ? `${active.label}, ${activeFor} seconds.` : ''} {job?.error || ''}
            </div>

            {/* Body */}
            <div className="st-scroll max-h-[62vh] overflow-y-auto px-6 py-5">
              {waiting && (
                <p className="mb-4 text-xs text-zinc-400">
                  {stepOf('save_content')?.message || 'Starting the pipeline…'}
                </p>
              )}

              <ol className="space-y-0.5">
                {STEPS.map((step) => {
                  const jobStep = stepOf(step.key);
                  const status = jobStep?.status || 'pending';
                  const isActive = status === 'running';
                  const isCompleted = status === 'success';
                  const isSkipped = status === 'skipped';
                  const isFailed = status === 'error';
                  const elapsed = isActive ? seconds(jobStep?.startedAt, now) : 0;

                  return (
                    <li
                      key={step.key}
                      className="st-publish-step"
                      data-status={status}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span className="flex w-5 flex-none justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-moss" />
                        ) : isFailed ? (
                          <XCircle className="h-4 w-4 text-alarm" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full ${isSkipped ? 'bg-zinc-600' : 'border border-zinc-700'}`} />
                        )}
                      </span>
                      <span className="flex-none text-zinc-500">{step.icon}</span>
                      <span className="st-publish-label">{step.label}</span>
                      {(isActive || isFailed || (isCompleted && jobStep?.message)) && (
                        <span className="ml-auto min-w-0 truncate pl-3 text-right font-mono text-[10px] text-zinc-500" title={jobStep?.message}>
                          {isActive && elapsed >= 3 ? `${elapsed}s · ` : ''}
                          {jobStep?.message}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>

              {active?.key === 'push' && activeFor >= 12 && (
                <p className="mt-4 rounded-md border border-[var(--rule-strong)] bg-[var(--well)] p-3 text-xs leading-relaxed text-zinc-300">
                  Still waiting on GitHub. If a sign-in prompt opened in your terminal or in VS Code, answer it there. If
                  nothing did, this stops on its own within a minute and tells you how to fix it — your commit is already safe.
                </p>
              )}

              {link === 'lost' && (
                <div className="mt-6 border-t border-zinc-800 pt-5">
                  <p className="text-xs leading-relaxed text-zinc-300">
                    The dev server no longer knows this job — it was probably restarted while publishing. Your saved
                    file is untouched. Check <span className="text-zinc-100">Deployments</span> for the last commit, or
                    publish again.
                  </p>
                  <button type="button" onClick={close} className="st-btn mt-4 w-full">
                    Close
                  </button>
                </div>
              )}

              {/* Success */}
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 space-y-3 border-t border-zinc-800 pt-5"
                >
                  <p className="text-xs leading-relaxed text-zinc-300">
                    Pushed. GitHub Actions now builds and deploys the site — it is usually live within a minute or two.
                  </p>
                  {job?.commitHash && (
                    <p className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                      <GitCommit className="h-3.5 w-3.5" /> {job.commitHash.slice(0, 10)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {job?.deployedUrl && (
                      <a href={job.deployedUrl} target="_blank" rel="noreferrer" className="st-btn st-btn-sm">
                        <Globe className="h-3.5 w-3.5" /> View website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {job?.actionsUrl && (
                      <a href={job.actionsUrl} target="_blank" rel="noreferrer" className="st-btn st-btn-sm">
                        <Rocket className="h-3.5 w-3.5" /> Watch the deploy <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <button type="button" onClick={close} className="st-btn st-btn-primary st-btn-sm ml-auto">
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 border-t border-zinc-800 pt-5"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-alarm" />
                    <div className="min-w-0 space-y-2">
                      <p className="break-words text-xs text-zinc-100">{job?.error || 'Publishing failed'}</p>
                      {job?.hint && <p className="text-xs leading-relaxed text-zinc-400">{withCode(job.hint)}</p>}
                      {retryError && <p className="text-xs text-alarm">{retryError}</p>}
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    {job?.canRetryPush && (
                      <button type="button" onClick={doRetry} disabled={retrying} className="st-btn st-btn-primary flex-1">
                        <RotateCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} /> Retry push
                      </button>
                    )}
                    <button type="button" onClick={close} className="st-btn flex-1">
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
