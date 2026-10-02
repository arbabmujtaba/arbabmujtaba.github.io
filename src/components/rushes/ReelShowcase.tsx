import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import MotionPlate from './MotionPlate';
import SafeImage from '../SafeImage';
import { MediaFxOverlays } from '../MediaFx';
import { getMediaFx } from '../../lib/customization';
import type { HomeConfigEntry } from '../../types';

interface ReelShowcaseProps {
  /** Visible `configType: reel` entries, already in display order. */
  reels: HomeConfigEntry[];
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * ReelShowcase — one reel on the big screen, the rest on a strip beneath it.
 *
 * Only the main plate holds a <video>; the strip is posters only, so a page
 * with ten reels still decodes one clip at a time. Picking a reel from the
 * strip remounts the plate (keyed on the slug) so the new clip starts from its
 * own first frame rather than inheriting the previous one's playback state.
 *
 * Every reel published from the admin's "Publish a reel" wizard lands here:
 * the lowest `order` is the main reel, everything after it joins the strip.
 */
export default function ReelShowcase({ reels, className = '' }: ReelShowcaseProps) {
  const shouldReduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  if (reels.length === 0) return null;
  const current = reels[Math.min(active, reels.length - 1)];
  const fx = getMediaFx(current.customization);
  const many = reels.length > 1;

  const step = (delta: number) => setActive((i) => (i + delta + reels.length) % reels.length);

  return (
    <div className={className}>
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.slug}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01, filter: 'blur(4px)' }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.6, ease: EASE }}
          >
            <MotionPlate
              src={current.video!}
              poster={current.videoPoster || current.image}
              title={current.title}
              aspect="aspect-[4/5] sm:aspect-[16/9]"
              mediaFilter={fx.filter}
              overlay={<MediaFxOverlays fx={fx} />}
            />
          </motion.div>
        </AnimatePresence>

        {many && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 md:flex">
            {[
              { delta: -1, label: 'Previous reel', Icon: ChevronLeft },
              { delta: 1, label: 'Next reel', Icon: ChevronRight },
            ].map(({ delta, label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => step(delta)}
                aria-label={label}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-canvas/60 text-zinc-100 opacity-70 backdrop-blur-sm transition hover:bg-accent hover:text-canvas hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <Icon size={18} strokeWidth={1.6} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Caption for the reel on screen */}
      <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.slug}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="min-w-0"
          >
            <h3 className="font-display text-xl font-medium tracking-[-0.03em] text-zinc-100 md:text-2xl">
              {current.title}
            </h3>
            {current.description && (
              <p className="mt-1.5 max-w-xl text-sm font-light leading-relaxed text-zinc-400">
                {current.description}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {current.label && <span className="text-zinc-300">{current.label}</span>}
          {many && (
            <span className="ml-3">
              {String(active + 1).padStart(2, '0')} / {String(reels.length).padStart(2, '0')}
            </span>
          )}
        </p>
      </div>

      {/* The strip — every other reel, posters only */}
      {many && (
        <div className="mt-10 border-t border-zinc-800 pt-6">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">more reels</p>
          <ul
            className="custom-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3"
            aria-label="Choose a reel"
          >
            {reels.map((reel, index) => {
              const selected = reel.slug === current.slug;
              return (
                <li key={reel.slug} className="w-[14rem] shrink-0 snap-start md:w-[17rem]">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-current={selected}
                    aria-label={`Play ${reel.title}`}
                    className="group block w-full text-left focus-visible:outline-none"
                  >
                    <span
                      className={`image-frame relative block aspect-[16/10] w-full overflow-hidden rounded-[2px] transition-[border-color] duration-500 ${
                        selected ? '!border-accent' : ''
                      }`}
                    >
                      <SafeImage
                        src={reel.videoPoster || reel.image}
                        alt=""
                        className={`h-full w-full object-cover transition-[transform,scale,opacity,filter] duration-700 ease-out group-hover:scale-[1.04] ${
                          selected ? 'opacity-100' : 'opacity-60 grayscale-[40%] group-hover:opacity-100 group-hover:grayscale-0'
                        }`}
                        fallback={<span className="hairline-grid block h-full w-full bg-well" />}
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition ${
                            selected ? 'bg-accent text-canvas' : 'bg-canvas/60 text-zinc-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                          }`}
                        >
                          {selected ? (
                            <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
                              {[0, 1, 2].map((bar) => (
                                <motion.span
                                  key={bar}
                                  className="block w-[2px] bg-current"
                                  animate={shouldReduceMotion ? { height: 8 } : { height: [4, 12, 6, 10, 4] }}
                                  transition={{ duration: 1.2, repeat: Infinity, delay: bar * 0.18, ease: 'easeInOut' }}
                                />
                              ))}
                            </span>
                          ) : (
                            <Play size={14} strokeWidth={1.8} />
                          )}
                        </span>
                      </span>
                    </span>
                    <span className="mt-3 flex items-baseline gap-2.5">
                      <span className={`font-mono text-[10px] ${selected ? 'text-accent' : 'text-zinc-500'}`}>
                        R{String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`truncate font-display text-sm font-medium tracking-[-0.02em] transition-colors ${
                          selected ? 'text-zinc-50' : 'text-zinc-300 group-hover:text-zinc-50'
                        }`}
                      >
                        {reel.title}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
