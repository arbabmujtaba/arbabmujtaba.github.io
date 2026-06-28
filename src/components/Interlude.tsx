import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { normalizeImagePath } from '../lib/image';
import type { HomeConfigEntry } from '../types';

interface InterludeProps {
  entry: HomeConfigEntry;
  index: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

const indexLabel = (i: number) => String(i + 1).padStart(3, '0');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Stat {
  value: string;
  num: number;
  suffix: string;
  label: string;
}

/** Parse the CMS `text` field — one "value | label" per line — into stat items. */
function parseStats(text?: string): Stat[] {
  if (!text) return [];
  return text
    .split(/[\r\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...rest] = line.split('|');
      const value = (rawValue || '').trim();
      const label = rest.join('|').trim();
      const m = value.match(/^([\d.]+)(.*)$/);
      return {
        value,
        num: m ? parseFloat(m[1]) : 0,
        suffix: m ? m[2].trim() : '',
        label,
      };
    })
    .filter((s) => s.label || s.value);
}

/** Fire once when the element first scrolls into view. */
function useInViewOnce(amount = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold: amount }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [seen, amount]);
  return { ref, seen };
}

/** Ease a number from 0 → target once `active`. */
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      <span className="h-px w-10 bg-orange-400/35" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-400/70">{children}</span>
      <span className="h-px w-10 bg-orange-400/35" />
    </div>
  );
}

function Attribution({ author }: { author?: string }) {
  if (!author) return null;
  return (
    <motion.p
      className="mt-10 font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {author}
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// Variant: quote — kinetic word-by-word editorial quote
// ---------------------------------------------------------------------------
function QuoteContent({ entry, rm }: { entry: HomeConfigEntry; rm: boolean }) {
  const words = (entry.title || '').split(' ');
  return (
    <div className="relative mx-auto max-w-5xl text-center">
      <Eyebrow>{entry.label || 'Interlude'}</Eyebrow>
      <h2 className="font-serif text-4xl leading-[1.08] tracking-tighter text-zinc-100 md:text-6xl lg:text-7xl">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block pr-[0.22em]"
              initial={{ y: rm ? 0 : '100%', opacity: rm ? 1 : 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.72, delay: i * 0.045, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h2>
      {entry.description && (
        <motion.p
          className="mx-auto mt-8 max-w-2xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-base"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {entry.description}
        </motion.p>
      )}
      <Attribution author={entry.author} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: statement — oversized clip-reveal headline with a scroll drift
// ---------------------------------------------------------------------------
function StatementContent({
  entry,
  rm,
  driftX,
}: {
  entry: HomeConfigEntry;
  rm: boolean;
  driftX: MotionValue<string>;
}) {
  return (
    <div className="mx-auto max-w-6xl text-center">
      <Eyebrow>{entry.label || 'Interlude'}</Eyebrow>
      <motion.h2
        style={rm ? undefined : { x: driftX }}
        className="font-serif text-5xl font-medium leading-[0.95] tracking-tighter text-zinc-100 md:text-8xl lg:text-[8.5rem]"
        initial={{ clipPath: 'inset(0 0 100% 0)', opacity: rm ? 1 : 0 }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {entry.title}
      </motion.h2>
      {entry.description && (
        <motion.p
          className="mx-auto mt-10 max-w-xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-base"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {entry.description}
        </motion.p>
      )}
      <Attribution author={entry.author} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: marquee — seamless looping repeated phrase
// ---------------------------------------------------------------------------
function MarqueeContent({ entry, rm }: { entry: HomeConfigEntry; rm: boolean }) {
  const phrase = entry.title || '';
  const groupItems = [0, 1, 2, 3].map((k) => (
    <span
      key={k}
      className="flex items-center font-serif text-5xl font-medium tracking-tighter text-zinc-100/90 md:text-7xl lg:text-8xl"
    >
      <span className="px-6">{phrase}</span>
      <span className="text-orange-400/45">&middot;</span>
    </span>
  ));

  return (
    <div className="w-full text-center">
      <Eyebrow>{entry.label || 'Interlude'}</Eyebrow>
      <span className="sr-only">{phrase}</span>
      <div aria-hidden="true" className="relative w-full overflow-hidden py-6">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0a0a09] to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0a0a09] to-transparent md:w-40" />
        <motion.div
          className="flex w-max flex-nowrap whitespace-nowrap"
          animate={rm ? undefined : { x: ['0%', '-50%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <div className="flex shrink-0">{groupItems}</div>
          <div className="flex shrink-0">{groupItems}</div>
        </motion.div>
      </div>
      <Attribution author={entry.author} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: stat — animated milestone counters
// ---------------------------------------------------------------------------
function StatItem({ stat, active, rm }: { stat: Stat; active: boolean; rm: boolean }) {
  const v = useCountUp(stat.num, active && !rm && stat.num > 0);
  const display = rm || stat.num <= 0 ? stat.value : `${Math.round(v)}${stat.suffix}`;
  return (
    <div className="text-center">
      <div className="font-serif text-5xl font-medium tracking-tighter text-zinc-100 md:text-7xl">{display}</div>
      <div className="mx-auto mt-3 max-w-[12rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-zinc-500 md:text-xs">
        {stat.label}
      </div>
    </div>
  );
}

function StatContent({ entry, rm }: { entry: HomeConfigEntry; rm: boolean }) {
  const stats = parseStats(entry.text);
  const { ref, seen } = useInViewOnce(0.3);
  return (
    <div ref={ref} className="mx-auto max-w-5xl text-center">
      <Eyebrow>{entry.label || 'By The Numbers'}</Eyebrow>
      {entry.title && (
        <motion.h2
          className="mb-14 font-serif text-3xl leading-tight tracking-tight text-zinc-100 md:text-5xl"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {entry.title}
        </motion.h2>
      )}
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-y-12 gap-x-6 md:grid-cols-4 md:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={`${s.value}-${s.label}-${i}`}
              initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatItem stat={s} active={seen} rm={!!rm} />
            </motion.div>
          ))}
        </div>
      ) : (
        entry.description && (
          <p className="mx-auto max-w-xl font-sans text-sm font-light leading-relaxed text-zinc-400">{entry.description}</p>
        )
      )}
      <Attribution author={entry.author} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interlude shell — shared ambient backdrop + scroll reactivity
// ---------------------------------------------------------------------------
export default function Interlude({ entry, index, containerRef }: InterludeProps) {
  const variant = entry.variant || 'quote';
  const ref = useRef<HTMLElement>(null);
  const rm = !!useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset: ['start end', 'end start'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 26, restDelta: 0.001 });

  const contentY = useTransform(progress, [0, 0.5, 1], [50, 0, -50]);
  const numeralY = useTransform(progress, [0, 1], [90, -90]);
  const numeralOpacity = useTransform(progress, [0, 0.5, 1], [0.02, 0.06, 0.02]);
  const driftX = useTransform(progress, [0, 1], ['-3.5%', '3.5%']);

  const img = normalizeImagePath(entry.image);

  return (
    <section
      ref={ref}
      className="relative z-20 flex min-h-[66vh] items-center justify-center overflow-hidden border-t border-zinc-800/20 px-5 py-24 md:min-h-[80vh] md:px-12 md:py-32 lg:px-16"
    >
      {/* Optional faint image atmosphere */}
      {img && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <img src={img} alt="" className="h-full w-full object-cover opacity-[0.12] grayscale" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-[#0a0a09]/82" />
        </div>
      )}

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05),transparent_56%)]" />

      {/* Drifting hairline */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-px w-[72vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-orange-400/15 to-transparent"
        animate={rm ? undefined : { rotate: [-2, 2, -2], opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Giant ghosted archive index numeral */}
      <motion.span
        aria-hidden="true"
        style={rm ? { opacity: 0.04 } : { y: numeralY, opacity: numeralOpacity }}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-serif text-[40vw] font-bold leading-none tracking-tighter text-zinc-100 md:text-[26vw]"
      >
        {indexLabel(index)}
      </motion.span>

      {/* Content */}
      <motion.div style={rm ? undefined : { y: contentY }} className="relative z-10 w-full">
        {variant === 'statement' ? (
          <StatementContent entry={entry} rm={rm} driftX={driftX} />
        ) : variant === 'marquee' ? (
          <MarqueeContent entry={entry} rm={rm} />
        ) : variant === 'stat' ? (
          <StatContent entry={entry} rm={rm} />
        ) : (
          <QuoteContent entry={entry} rm={rm} />
        )}
      </motion.div>
    </section>
  );
}
