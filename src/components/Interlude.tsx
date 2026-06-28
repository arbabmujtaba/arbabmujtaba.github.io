import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { normalizeImagePath } from '../lib/image';
import type { HomeConfigEntry } from '../types';

interface InterludeProps {
  entry: HomeConfigEntry;
  index: number;
}

const indexLabel = (i: number) => String(i + 1).padStart(3, '0');
const EASE = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Stat parsing + helpers (for the optional "stat" template)
// ---------------------------------------------------------------------------
interface Stat {
  value: string;
  num: number;
  suffix: string;
  label: string;
}

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
      return { value, num: m ? parseFloat(m[1]) : 0, suffix: m ? m[2].trim() : '', label };
    })
    .filter((s) => s.label || s.value);
}

function useInViewOnce(amount = 0.4) {
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

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

// ---------------------------------------------------------------------------
// Shared editorial pieces — keep every interlude visually consistent
// ---------------------------------------------------------------------------
function IndexMarker({ index, label, rm }: { index: number; label?: string; rm: boolean }) {
  return (
    <motion.div
      className="mb-9 flex items-center justify-center gap-3"
      initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-orange-400/55" />
      <span className="font-mono text-[10px] uppercase tracking-[0.38em] text-orange-400/75">{label || 'Interlude'}</span>
      <span className="text-zinc-700">&middot;</span>
      <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-600">{indexLabel(index)}</span>
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-orange-400/55" />
    </motion.div>
  );
}

function AccentRule({ rm }: { rm: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className="mx-auto mt-9 h-px w-14 origin-center bg-gradient-to-r from-transparent via-orange-400/65 to-transparent"
      initial={{ scaleX: rm ? 1 : 0, opacity: rm ? 1 : 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
    />
  );
}

function SubLine({ text, rm }: { text?: string; rm: boolean }) {
  if (!text) return null;
  return (
    <motion.p
      className="mx-auto mt-7 max-w-xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-[15px]"
      initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
    >
      {text}
    </motion.p>
  );
}

function Source({ author }: { author?: string }) {
  // Hide placeholder-looking "Archive Note NNN" labels; only show a real source.
  if (!author || /^archive note\b/i.test(author.trim())) return null;
  return (
    <motion.p
      className="mt-6 font-sans text-[11px] uppercase tracking-[0.28em] text-zinc-500"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      — {author}
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
function QuoteBody({ entry, index, rm }: { entry: HomeConfigEntry; index: number; rm: boolean }) {
  return (
    <div className="relative mx-auto max-w-3xl text-center">
      <IndexMarker index={index} label={entry.label} rm={rm} />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none select-none bg-gradient-to-br from-orange-400/35 via-amber-300/12 to-transparent bg-clip-text font-serif text-[3.6rem] leading-[0.5] text-transparent md:text-[5rem]"
        initial={{ opacity: 0, scale: rm ? 1 : 0.9, y: rm ? 0 : 8 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1, ease: EASE }}
      >
        &ldquo;
      </motion.div>
      <motion.blockquote
        className="mt-2 font-serif text-[1.7rem] leading-[1.24] tracking-tight text-zinc-100 [text-wrap:balance] sm:text-[2.1rem] md:text-[2.9rem] md:leading-[1.16]"
        initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 18, clipPath: rm ? undefined : 'inset(0 0 14% 0)' }}
        whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: EASE }}
      >
        {entry.title}
      </motion.blockquote>
      <AccentRule rm={rm} />
      <SubLine text={entry.description} rm={rm} />
      <Source author={entry.author} />
    </div>
  );
}

function StatementBody({ entry, index, rm }: { entry: HomeConfigEntry; index: number; rm: boolean }) {
  return (
    <div className="relative mx-auto max-w-4xl text-center">
      <IndexMarker index={index} label={entry.label} rm={rm} />
      <motion.h2
        className="font-serif text-[2rem] font-medium leading-[1.06] tracking-tight text-zinc-100 [text-wrap:balance] sm:text-5xl md:text-[3.5rem] md:leading-[1.02]"
        initial={{ opacity: rm ? 1 : 0, clipPath: rm ? undefined : 'inset(0 0 100% 0)', y: rm ? 0 : 10 }}
        whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {entry.title}
      </motion.h2>
      <AccentRule rm={rm} />
      <SubLine text={entry.description} rm={rm} />
      <Source author={entry.author} />
    </div>
  );
}

function MarqueeBody({ entry, index, rm }: { entry: HomeConfigEntry; index: number; rm: boolean }) {
  const phrase = entry.title || '';
  const items = [0, 1, 2, 3, 4].map((k) => (
    <span key={k} className="flex items-center font-serif text-3xl tracking-tight text-zinc-200/85 md:text-5xl">
      <span className="px-8">{phrase}</span>
      <span className="text-orange-400/40">&middot;</span>
    </span>
  ));
  return (
    <div className="w-full text-center">
      <IndexMarker index={index} label={entry.label} rm={rm} />
      <span className="sr-only">{phrase}</span>
      <div aria-hidden="true" className="relative w-full overflow-hidden py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0a0a09] to-transparent md:w-52" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0a0a09] to-transparent md:w-52" />
        <motion.div
          className="flex w-max flex-nowrap whitespace-nowrap"
          animate={rm ? undefined : { x: ['0%', '-50%'] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        >
          <div className="flex shrink-0">{items}</div>
          <div className="flex shrink-0">{items}</div>
        </motion.div>
      </div>
      <SubLine text={entry.description} rm={rm} />
    </div>
  );
}

function StatItem({ stat, active, rm }: { stat: Stat; active: boolean; rm: boolean }) {
  const v = useCountUp(stat.num, active && !rm && stat.num > 0);
  const display = rm || stat.num <= 0 ? stat.value : `${Math.round(v)}${stat.suffix}`;
  return (
    <div className="text-center">
      <div className="font-serif text-4xl font-medium tracking-tight text-zinc-100 md:text-6xl">{display}</div>
      <div className="mx-auto mt-3 max-w-[12rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-zinc-500">{stat.label}</div>
    </div>
  );
}

function StatBody({ entry, index, rm }: { entry: HomeConfigEntry; index: number; rm: boolean }) {
  const stats = parseStats(entry.text);
  const { ref, seen } = useInViewOnce(0.3);
  return (
    <div ref={ref} className="mx-auto max-w-4xl text-center">
      <IndexMarker index={index} label={entry.label} rm={rm} />
      {entry.title && (
        <motion.h2
          className="mb-12 font-serif text-2xl leading-tight tracking-tight text-zinc-100 [text-wrap:balance] md:text-4xl"
          initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {entry.title}
        </motion.h2>
      )}
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-y-12 gap-x-6 md:grid-cols-4 md:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={`${s.value}-${s.label}-${i}`}
              initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            >
              <StatItem stat={s} active={seen} rm={rm} />
            </motion.div>
          ))}
        </div>
      ) : (
        <SubLine text={entry.description} rm={rm} />
      )}
      <Source author={entry.author} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell — composed background shared by every interlude
// ---------------------------------------------------------------------------
export default function Interlude({ entry, index }: InterludeProps) {
  const variant = entry.variant || 'quote';
  const rm = !!useReducedMotion();
  const img = normalizeImagePath(entry.image);

  return (
    <section className="relative z-20 flex min-h-[58vh] items-center justify-center overflow-hidden border-t border-zinc-800/15 px-5 py-20 md:min-h-[66vh] md:px-12 md:py-28 lg:px-16">
      {/* Optional faint image atmosphere */}
      {img && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <img src={img} alt="" className="h-full w-full object-cover opacity-[0.12] grayscale" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-[#0a0a09]/85" />
        </div>
      )}

      {/* Softly breathing centre glow (wrapper centres it; inner animates so the
          Motion transform never clobbers the centering translate) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          aria-hidden="true"
          className="h-[58vh] w-[58vh] rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08), transparent 62%)' }}
          animate={rm ? undefined : { opacity: [0.5, 0.95, 0.5], scale: [0.92, 1.06, 0.92] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Editorial side lines that draw outward from the centre (scaleY, so no
          conflict with a positioning translate) */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[27%] left-[7%] top-[27%] hidden w-px origin-center bg-gradient-to-b from-transparent via-zinc-600/40 to-transparent md:block"
        initial={{ scaleY: rm ? 1 : 0, opacity: rm ? 1 : 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[27%] right-[7%] top-[27%] hidden w-px origin-center bg-gradient-to-b from-transparent via-zinc-600/40 to-transparent md:block"
        initial={{ scaleY: rm ? 1 : 0, opacity: rm ? 1 : 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, delay: 0.1, ease: EASE }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        {variant === 'statement' ? (
          <StatementBody entry={entry} index={index} rm={rm} />
        ) : variant === 'marquee' ? (
          <MarqueeBody entry={entry} index={index} rm={rm} />
        ) : variant === 'stat' ? (
          <StatBody entry={entry} index={index} rm={rm} />
        ) : (
          <QuoteBody entry={entry} index={index} rm={rm} />
        )}
      </div>
    </section>
  );
}
