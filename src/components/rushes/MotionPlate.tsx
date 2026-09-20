import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import SafeImage from '../SafeImage';
import { normalizeImagePath } from '../../lib/image';

interface MotionPlateProps {
  /** `/uploads/...` path to an .mp4, .webm or .gif. */
  src: string;
  /** Still shown before playback, and while a GIF is paused. */
  poster?: string;
  /** Accessible name — also the caption under the plate when `caption` is set. */
  title: string;
  caption?: string;
  aspect?: string;
  /** Start playing when scrolled into view. Ignored under reduced motion. */
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function isGif(src: string): boolean {
  return src.split('?')[0].toLowerCase().endsWith('.gif');
}

/**
 * MotionPlate — a short clip in the same framed plate as a photograph.
 *
 * Three behaviours worth knowing:
 *
 * 1. **Muted by default, and it stays that way until asked.** Browsers block
 *    autoplay with sound, so an unmuted autoplay would simply not start.
 * 2. **Playback follows visibility.** An IntersectionObserver starts the clip
 *    when the plate scrolls in and pauses it when it leaves, so a page with a
 *    reel on it does not decode video the reader cannot see.
 * 3. **Reduced motion is honoured properly.** Autoplay is skipped and the
 *    poster is shown with a play control, so the clip is still reachable — it
 *    just never moves without being asked.
 *
 * GIFs cannot be paused natively. When a poster is supplied the pause control
 * swaps the animation for the still; without one the control is hidden rather
 * than rendered dead.
 */
export default function MotionPlate({
  src,
  poster,
  title,
  caption,
  aspect = 'aspect-[16/9]',
  autoPlay = true,
  loop = true,
  className = '',
}: MotionPlateProps) {
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedSrc = normalizeImagePath(src) || '';
  const resolvedPoster = normalizeImagePath(poster) || undefined;
  const gif = isGif(resolvedSrc);

  const wantsAutoPlay = autoPlay && !shouldReduceMotion;
  const [playing, setPlaying] = useState(wantsAutoPlay);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  /**
   * The reader's intent, held in a ref as well as state.
   *
   * The visibility observer needs to know whether playback is wanted, but it
   * must not be torn down and rebuilt every time that changes: a fresh
   * IntersectionObserver fires immediately with the current ratio, so
   * re-subscribing on a state change would pause a clip the moment someone
   * pressed play on a plate that was only partly in view.
   */
  const wantsPlayRef = useRef(wantsAutoPlay);

  /** Pause off-screen, resume on-screen — only while the reader wants it playing. */
  useEffect(() => {
    if (gif || !containerRef.current) return;
    const node = containerRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          if (wantsPlayRef.current) void video.play().catch(() => undefined);
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [gif]);

  const togglePlay = useCallback(() => {
    if (gif) {
      setPlaying((was) => {
        wantsPlayRef.current = !was;
        return !was;
      });
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      wantsPlayRef.current = true;
      void video.play().catch(() => undefined);
      setPlaying(true);
    } else {
      wantsPlayRef.current = false;
      video.pause();
      setPlaying(false);
    }
  }, [gif]);

  const toggleMuted = useCallback(() => {
    const video = videoRef.current;
    setMuted((was) => {
      const next = !was;
      if (video) video.muted = next;
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    wantsPlayRef.current = true;
    void video.play().catch(() => undefined);
    setPlaying(true);
  }, []);

  if (!resolvedSrc || failed) {
    // No clip, or it would not load: fall back to the poster, then to the grid.
    return resolvedPoster ? (
      <div className={className}>
        <div className={`image-frame w-full overflow-hidden ${aspect}`}>
          <SafeImage src={resolvedPoster} alt={title} className="h-full w-full object-cover" />
        </div>
      </div>
    ) : null;
  }

  /** GIFs pause by swapping in the still; without a still there is nothing to swap to. */
  const canPause = !gif || !!resolvedPoster;
  const gifSource = gif && !playing && resolvedPoster ? resolvedPoster : resolvedSrc;

  return (
    <motion.div
      ref={containerRef}
      className={className}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.85, ease: EASE }}
    >
      <div className={`image-frame group/plate relative w-full overflow-hidden ${aspect}`}>
        {gif ? (
          /* Deliberately a plain <img>, not SafeImage: SafeImage emits a
             <picture><source> pointing at WebP derivatives, the optimizer only
             generates those for jpg/png/webp, and a <source> has no fallback —
             so a GIF routed through it would render broken. */
          <img
            src={gifSource}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={resolvedSrc}
            poster={resolvedPoster}
            muted={muted}
            loop={loop}
            playsInline
            autoPlay={wantsAutoPlay}
            preload={wantsAutoPlay ? 'auto' : 'metadata'}
            aria-label={title}
            onError={() => setFailed(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="h-full w-full object-cover"
          />
        )}

        {/* Controls. Always reachable by keyboard; they fade up on hover on a
            pointer device and stay visible on touch, where there is no hover. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover/plate:opacity-100 md:focus-within:opacity-100">
          {canPause && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? `Pause ${title}` : `Play ${title}`}
              className="pointer-events-auto flex h-[44px] w-[44px] items-center justify-center rounded-full bg-canvas/80 text-zinc-100 backdrop-blur-sm transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              {playing ? <Pause size={15} strokeWidth={1.8} /> : <Play size={15} strokeWidth={1.8} />}
            </button>
          )}

          {!gif && (
            <>
              <button
                type="button"
                onClick={toggleMuted}
                aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
                className="pointer-events-auto flex h-[44px] w-[44px] items-center justify-center rounded-full bg-canvas/80 text-zinc-100 backdrop-blur-sm transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                {muted ? <VolumeX size={15} strokeWidth={1.8} /> : <Volume2 size={15} strokeWidth={1.8} />}
              </button>

              <button
                type="button"
                onClick={restart}
                aria-label={`Restart ${title}`}
                className="pointer-events-auto flex h-[44px] w-[44px] items-center justify-center rounded-full bg-canvas/80 text-zinc-100 backdrop-blur-sm transition-colors hover:bg-accent hover:text-canvas focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <RotateCcw size={14} strokeWidth={1.8} />
              </button>
            </>
          )}

          <span className="pointer-events-none ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-300">
            {gif ? 'gif' : 'clip'}
          </span>
        </div>
      </div>

      {caption && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          {caption}
        </p>
      )}
    </motion.div>
  );
}
