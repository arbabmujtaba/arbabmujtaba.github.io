/**
 * Which sentences of a journal body can stand on their own. Pure, so it can be
 * tested without a Vite build (tests/hiddenLayer.test.ts).
 */

/** Openers that only make sense after the sentence before them. */
export const DEPENDENT_OPENER =
  /^(she|he|her|his|they|them|then|but|and|so|or|yes|no|instead|eventually|three|ordinarily|after|looking|one thing|things|unfortunately|surprisingly|meanwhile|still|for now|perhaps|it was|that|this|those|these|across|a question|the event|the station|the experiment|chapter|in retrospect|from my|i stood|i remember|i opened|i tried|i spoke|i did|i could|i know|i was|i never|i found|i started|i had|i believed|i have found|i wanted|i've sacrificed|on one hand|on the other|it all|it wasn|it's in these|every conversation|we would|there's something|a gaze|if coincidence|for a brief|as a software|maybe i realized|two years|yet|in the tapestry|a celestial|certain stories|time, as)\b/i;

/** Lines that point at a particular person or a private exchange stay in context. */
export const PRIVATE = /\b(she|her|hers|sahil|instagram|assalamu|relationship|insecur|allah|username)\b/i;

export function sentences(body: string): string[] {
  return body
    .replace(/^#+\s.*$/gm, ' ')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?”"])\s+(?=["“A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function standsAlone(sentence: string): boolean {
  return (
    !DEPENDENT_OPENER.test(sentence) &&
    !PRIVATE.test(sentence) &&
    !/["“”]/.test(sentence) &&
    /[.!?]$/.test(sentence) &&
    !/:\s*$|---/.test(sentence)
  );
}

/** Lines from one body that can be read without the page around them. */
export function linesFrom(body: string): string[] {
  const list = sentences(body);
  const out: string[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const first = list[i];
    if (!standsAlone(first)) continue;
    let text = first;
    // A short line borrows the next one when that reads as one thought
    // ("Memory is selective. It forgets conversations, …").
    if (text.length < 48 && list[i + 1] && !PRIVATE.test(list[i + 1]) && !/["“”]/.test(list[i + 1])) {
      text = `${text} ${list[i + 1]}`;
      i += 1;
    }
    if (text.length >= 48 && text.length <= 175) out.push(text);
  }
  return out;
}

