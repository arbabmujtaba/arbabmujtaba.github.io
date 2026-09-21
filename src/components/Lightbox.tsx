import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { navigate, shouldInterceptClick } from '../lib/navigation';
import { normalizeImagePath } from '../lib/image';

export interface LightboxFrame {
  /** The original file — full resolution, deliberately not a derivative. */
  src: string;
  alt: string;
  title?: string;
  /** Plate number, date, or whatever the surface numbers its frames with. */
  index?: string;
  caption?: string;
  /** Camera / lens / mode line. */
  meta?: string;
  /** In-site path to the entry this frame belongs to, when it has one. */
  href?: string;
  /**
   * What "read the story" should do instead of a full navigation — a listing
   * passes its quick-look opener here so the page behind the overlay is kept.
   * The `href` is still rendered, so the link stays real: cmd-click and
   * right-click behave, only a plain click is intercepted.
   */
  onOpenStory?: () => void;
}

interface LightboxProps {
  frames: LightboxFrame[];
  /** Index of the open frame, or null when closed. */
  openIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Lightbox — the frame at full size.
 *
 * A photograph is the thing itself, not an illustration for an article, so a
 * click on a plate opens the original here rather than the entry. The entry is
 * one link away in the caption bar, which is what keeps the URL and the story
 * reachable.
 *
 * It loads the original path directly and never the WebP derivatives: the
 * derivatives top out at 1536px, which is the one place on the site where that
 * is not enough.
 */
export default function Lightbox({ frames, openIndex, onClose, onNavigate }: LightboxProps) {
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const [loaded, setLoaded] = useState(false);

  const isOpen = openIndex !== null && openIndex >= 0 && openIndex < frames.length;
  const frame = isOpen ? frames[openIndex as number] : undefined;
  const source = normalizeImagePath(frame?.src);
  const hasMultiple = frames.length > 1;

  const step = useCallback(
    (delta: number) => {
      if (openIndex === null || frames.length === 0) return;
      const next = (openIndex + delta + frames.length) % frames.length;
      onNavigate(next);
    },
    [frames.length, onNavigate, openIndex]
  );

  // Each frame gets its own loading state, otherwise stepping through the set
  // shows the previous image until the next one decodes.
  useEffect(() => {
    setLoaded(false);
  }, [source]);

  // Keyboard: escape closes, arrows walk the set. Bound on the document because
  // the overlay can be opened from a card that then unmounts its own handlers.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (!hasMultiple) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hasMultiple, isOpen, onClose, step]);

  // Freeze the page behind the overlay, and hand focus over and back so the
  // keyboard does not stay on a card nobody can see.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      const restore = restoreFocusRef.current;
      if (restore instanceof HTMLElement) restore.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && frame && source && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={frame.title ? `${frame.title} — full frame` : 'Full frame'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.35, ease: EASE }}
          className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* ---------------- top bar ---------------- */}
          <div
            className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 md:px-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {frame.index && <span className="text-zinc-300">{frame.index}</span>}
              {hasMultiple && (
                <span className="ml-3">
                  {(openIndex as number) + 1} / {frames.length}
                </span>
              )}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close full frame"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-zinc-800 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* ---------------- the frame ---------------- */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-6">
            {!loaded && (
              <Loader2
                className="absolute h-5 w-5 animate-spin text-zinc-600"
                aria-hidden="true"
              />
            )}

            <motion.img
              key={source}
              src={source}
              alt={frame.alt}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.985 }}
              animate={{ opacity: loaded ? 1 : 0, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.4, ease: EASE }}
              // object-contain against the available box: the whole frame, as
              // large as the viewport allows, never cropped.
              className="max-h-full max-w-full cursor-zoom-out object-contain"
              decoding="async"
            />

            {hasMultiple && (
              <>
                <button
                  type="button"
                  aria-label="Previous frame"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 inline-flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent md:left-4"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next frame"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 inline-flex h-12 w-12 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent md:right-4"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {/* ---------------- caption ---------------- */}
          <div
            className="relative z-10 px-4 py-4 md:px-6 md:py-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4 md:flex-row md:items-end md:justify-between md:gap-6">
              <div className="min-w-0">
                {frame.title && (
                  <h2 className="font-display text-lg font-medium leading-tight tracking-[-0.03em] text-zinc-100 md:text-xl">
                    {frame.title}
                  </h2>
                )}
                {frame.caption && (
                  <p className="mt-1.5 max-w-2xl text-xs font-light leading-relaxed text-zinc-400 md:text-sm">
                    {frame.caption}
                  </p>
                )}
                {frame.meta && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                    {frame.meta}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                {frame.href && (
                  <a
                    href={frame.href}
                    onClick={(event) => {
                      if (!shouldInterceptClick(event)) return;
                      event.preventDefault();
                      onClose();
                      if (frame.onOpenStory) frame.onOpenStory();
                      else navigate(frame.href!);
                    }}
                    className="group inline-flex min-h-[44px] items-center gap-2 text-accent transition-colors hover:text-zinc-100"
                  >
                    read the story
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                <a
                  href={source}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-200"
                >
                  original
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
