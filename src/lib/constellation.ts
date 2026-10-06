/**
 * The Saptarishi as a pattern, not a scatter.
 *
 * It used to unlock when all seven bright stars had been touched in any order —
 * any seven taps, no shape at all. Now the figure has to be drawn the way it
 * hangs in the sky: every step from one star to the next must follow a line of
 * the Big Dipper, the handle and the bowl, with nothing skipped and no stray
 * star in between. The sky also carries a few bright decoys, so "tap every
 * bright dot" is no longer an answer.
 *
 * Pure — tested in tests/hiddenLayer.test.ts. The component in
 * components/magic/Constellation.tsx only feeds it star ids.
 */

export type StarId = 'alkaid' | 'mizar' | 'alioth' | 'megrez' | 'phecda' | 'merak' | 'dubhe';

export interface Star {
  id: StarId;
  x: number;
  y: number;
}

/** Positions in a 100×100 box over the hero. Handle to the left, bowl to the right. */
export const SEVEN: Star[] = [
  { id: 'alkaid', x: 4, y: 30 },
  { id: 'mizar', x: 19, y: 18 },
  { id: 'alioth', x: 33, y: 22 },
  { id: 'megrez', x: 47, y: 31 },
  { id: 'phecda', x: 53, y: 62 },
  { id: 'merak', x: 85, y: 70 },
  { id: 'dubhe', x: 89, y: 36 },
];

/** Bright stars that are not part of the figure. Touching one breaks the pattern. */
export const DECOYS = [
  { id: 'decoy-1', x: 27, y: 58 },
  { id: 'decoy-2', x: 66, y: 12 },
  { id: 'decoy-3', x: 71, y: 47 },
  { id: 'decoy-4', x: 12, y: 74 },
] as const;

/** The figure's seven lines: the handle, then the bowl (closed through megrez). */
export const EDGES: [StarId, StarId][] = [
  ['alkaid', 'mizar'],
  ['mizar', 'alioth'],
  ['alioth', 'megrez'],
  ['megrez', 'dubhe'],
  ['dubhe', 'merak'],
  ['merak', 'phecda'],
  ['phecda', 'megrez'],
];

const STAR_IDS = new Set<string>(SEVEN.map((s) => s.id));
const edgeKey = (a: string, b: string) => [a, b].sort().join('|');
const EDGE_SET = new Set(EDGES.map(([a, b]) => edgeKey(a, b)));

export const isLine = (a: string, b: string) => EDGE_SET.has(edgeKey(a, b));

export type TraceVerdict =
  /** Nothing touched yet. */
  | { state: 'empty' }
  /** On the figure so far; keep going. */
  | { state: 'partial'; lit: StarId[]; edges: [StarId, StarId][] }
  /** All seven, along the figure's own lines. */
  | { state: 'complete'; lit: StarId[]; edges: [StarId, StarId][] }
  /** A wrong star: a decoy, a jump across the sky, or doubling back. */
  | { state: 'broken'; at: number; reason: 'decoy' | 'jump' | 'repeat' };

/**
 * Judge a trace (a list of touched star ids, in order).
 *
 * Rules:
 * - the first star can be any of the seven (a decoy breaks it at once);
 * - every next star must share a line of the figure with the previous one;
 * - a line may be walked once; a star may be revisited only by walking a new
 *   line into it (that is how the bowl closes back on megrez);
 * - it is complete the moment all seven are lit.
 *
 * So the handle can be drawn from its tip into the bowl, or the bowl can be
 * drawn first and the handle last — both are the Saptarishi. Starting in the
 * middle of the handle runs into a dead end, which is a broken pattern.
 */
export function judgeTrace(trace: string[]): TraceVerdict {
  if (trace.length === 0) return { state: 'empty' };
  const lit: StarId[] = [];
  const walked = new Set<string>();
  const edges: [StarId, StarId][] = [];

  for (let i = 0; i < trace.length; i += 1) {
    const id = trace[i];
    if (!STAR_IDS.has(id)) return { state: 'broken', at: i, reason: 'decoy' };
    const star = id as StarId;

    if (i > 0) {
      const prev = trace[i - 1] as StarId;
      if (prev === star) continue; // the same star reported twice by a drag
      if (!isLine(prev, star)) return { state: 'broken', at: i, reason: 'jump' };
      const key = edgeKey(prev, star);
      if (walked.has(key)) return { state: 'broken', at: i, reason: 'repeat' };
      walked.add(key);
      edges.push([prev, star]);
    }

    if (!lit.includes(star)) lit.push(star);
    if (lit.length === SEVEN.length) return { state: 'complete', lit, edges };
  }

  return { state: 'partial', lit, edges };
}

/** The whole figure as one SVG path, for the drawn-in finish. */
export const FIGURE_PATH = (() => {
  const at = (id: StarId) => SEVEN.find((s) => s.id === id)!;
  const order: StarId[] = ['alkaid', 'mizar', 'alioth', 'megrez', 'dubhe', 'merak', 'phecda', 'megrez'];
  return order.map((id, i) => `${i === 0 ? 'M' : 'L'}${at(id).x} ${at(id).y}`).join(' ');
})();
