import { useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useMagic } from '../../lib/magic';
import { getEgg, isEggEnabled } from '../../lib/secrets';

const KNOCKS = 7;

/** Hairline cracks that appear, one per knock, across the wax. */
const CRACKS = [
  'M20 8 L17 15 L19 19',
  'M30 12 L26 18',
  'M10 22 L16 21 L18 25',
  'M31 25 L25 23 L23 28',
  'M15 31 L19 27',
  'M24 33 L22 27',
];

/**
 * The wax seal at the very end of every page. It does nothing on the first
 * knock, and visibly not quite nothing on the second: a hairline crack. The
 * seventh breaks it, and what was under it is the `seal` easter egg's copy.
 *
 * `align="end"` pins the seal to the right edge: the message opens to its left,
 * so the seal itself does not move when it breaks.
 */
export default function WaxSeal({ align = 'start' }: { align?: 'start' | 'end' }) {
  const end = align === 'end';
  const { collect, whisperOf } = useMagic();
  const reduced = useReducedMotion();
  const [knocks, setKnocks] = useState(0);
  const [nudge, setNudge] = useState(0);
  if (!isEggEnabled('seal')) return null;

  const broken = knocks >= KNOCKS;
  const egg = getEgg('seal');

  const knock = () => {
    if (broken) return;
    const next = knocks + 1;
    setKnocks(next);
    setNudge((n) => n + 1);
    if (next === KNOCKS) {
      window.setTimeout(() => {
        whisperOf(egg?.title || 'Sealed', egg?.description || 'Opened after seven knocks.', 'seal');
        collect('seal');
      }, 500);
    }
  };

  return (
    <div className={`flex items-center gap-5 ${end ? 'flex-row-reverse text-right' : ''}`}>
      <m.button
        type="button"
        onClick={knock}
        aria-label={broken ? 'A broken wax seal' : 'A wax seal'}
        data-enchanted="seal"
        key={nudge}
        animate={reduced || broken ? undefined : { rotate: [0, -7, 5, -2, 0] }}
        transition={{ duration: 0.45 }}
        className="relative h-14 w-14 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="wax" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#3f7ce0" />
              <stop offset="70%" stopColor="#1558c9" />
              <stop offset="100%" stopColor="#0a2f72" />
            </radialGradient>
          </defs>
          <g style={{ transformOrigin: '20px 20px', transform: broken ? 'rotate(-14deg) translate(-2px, 1px)' : undefined, transition: 'transform 0.8s' }}>
            <path
              d="M20 2.5c2.6 0 3.4 1.8 5.6 2.5 2.4.8 4.2 1.3 4.5 3.9.3 2.4-1.2 3.4-1.2 5.4s1.5 3 1.2 5.4c-.3 2.6-2.1 3.1-4.5 3.9-2.2.7-3 2.5-5.6 2.5s-3.4-1.8-5.6-2.5c-2.4-.8-4.2-1.3-4.5-3.9-.3-2.4 1.2-3.4 1.2-5.4s-1.5-3-1.2-5.4c.3-2.6 2.1-3.1 4.5-3.9 2.2-.7 3-2.5 5.6-2.5z"
              transform="translate(0 6) scale(1 0.86)"
              fill="url(#wax)"
            />
            <circle cx="20" cy="20" r="9" fill="none" stroke="#9cc0ff" strokeOpacity="0.45" strokeWidth="0.8" />
            <text x="20" y="23.4" textAnchor="middle" fontFamily="EB Garamond, Georgia, serif" fontStyle="italic" fontSize="9.5" fill="#d6e4ff" fillOpacity="0.85">
              AM
            </text>
            {CRACKS.slice(0, Math.max(0, knocks - 1)).map((d) => (
              <path key={d} d={d} stroke="#04112b" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            ))}
          </g>
        </svg>
      </m.button>
      <AnimatePresence>
        {broken && (
          <m.p
            initial={{ opacity: 0, x: end ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="max-w-xs font-book text-lg italic leading-snug text-zinc-300"
          >
            {egg?.body?.trim() || 'An archive still being written.'}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
}
