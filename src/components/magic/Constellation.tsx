import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useMagic } from '../../lib/magic';
import { getEgg, isEggEnabled } from '../../lib/secrets';

/**
 * The Saptarishi — seven stars, the same seven over Sopore and over Indore.
 *
 * Night only. Seven slightly brighter stars sit in the hero's sky among a
 * scatter of faint ones. Touch one and it holds its light; light all seven and
 * the figure draws itself. Order doesn't matter. Keyboard users reach the
 * stars one at a time: only the next unlit star is in the tab order.
 */
const SEVEN = [
  { id: 'alkaid', x: 4, y: 30 },
  { id: 'mizar', x: 19, y: 18 },
  { id: 'alioth', x: 33, y: 22 },
  { id: 'megrez', x: 47, y: 31 },
  { id: 'phecda', x: 53, y: 62 },
  { id: 'merak', x: 85, y: 70 },
  { id: 'dubhe', x: 89, y: 36 },
];
// alkaid–mizar–alioth–megrez–dubhe–merak–phecda–megrez
const LINE = 'M4 30 L19 18 L33 22 L47 31 L89 36 L85 70 L53 62 L47 31';

function faint(count: number) {
  let s = 34308;
  const rand = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => ({ x: rand() * 100, y: rand() * 100, r: 0.12 + rand() * 0.22, o: 0.2 + rand() * 0.45 }));
}

export default function Constellation({ className = '' }: { className?: string }) {
  const { collect, whisperOf, found } = useMagic();
  const reduced = useReducedMotion();
  const enabled = useMemo(() => isEggEnabled('constellation'), []);
  const [lit, setLit] = useState<string[]>(() => (found.includes('star') ? SEVEN.map((s) => s.id) : []));
  const dust = useMemo(() => faint(46), []);
  const complete = lit.length === SEVEN.length;
  if (!enabled) return null;

  const light = (id: string) => {
    if (lit.includes(id)) return;
    const next = [...lit, id];
    setLit(next);
    if (next.length === SEVEN.length) {
      const egg = getEgg('constellation');
      window.setTimeout(() => {
        whisperOf(egg?.title || 'Saptarishi', egg?.description || 'Seven stars, the same over Sopore and over Indore.', 'star');
        collect('star');
      }, reduced ? 0 : 1300);
    }
  };

  const nextUnlit = SEVEN.find((s) => !lit.includes(s.id))?.id;

  return (
    <div className={`night-only pointer-events-none ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff6dc" opacity={d.o} vectorEffect="non-scaling-stroke" />
        ))}
        {complete && (
          <motion.path
            d={LINE}
            fill="none"
            stroke="var(--gilt)"
            strokeWidth="1"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: reduced ? 1 : 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.75 }}
            transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
          />
        )}
      </svg>
      {SEVEN.map((star) => {
        const on = lit.includes(star.id);
        return (
          <button
            key={star.id}
            type="button"
            tabIndex={star.id === nextUnlit ? 0 : -1}
            aria-label={on ? 'A lit star' : 'A bright star'}
            aria-pressed={on}
            data-enchanted="star"
            onClick={() => light(star.id)}
            className="pointer-events-auto absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gilt"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
          >
            <motion.span
              className="block rounded-full bg-[#fff6dc]"
              animate={{
                width: on ? 6 : 3,
                height: on ? 6 : 3,
                boxShadow: on
                  ? '0 0 14px 3px color-mix(in srgb, var(--gilt) 85%, transparent)'
                  : '0 0 6px 1px rgba(255, 246, 220, 0.45)',
              }}
              transition={{ duration: 0.6 }}
            />
          </button>
        );
      })}
      {complete && (
        <motion.p
          className="absolute -bottom-8 right-0 font-book text-base italic text-gilt"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: reduced ? 0 : 1.2 }}
        >
          Saptarishi
        </motion.p>
      )}
    </div>
  );
}
