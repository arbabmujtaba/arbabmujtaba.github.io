/**
 * Rushes motif primitives.
 *
 * The shared vocabulary for the film-lab design language: section labels,
 * stacked display headings, tickers, numbered index rows, count-up figures,
 * category tags, disclosure lists, and image plates.
 *
 * Every primitive degrades on touch devices and under prefers-reduced-motion.
 * Colour comes exclusively from the token layer in src/index.css — no literal
 * hex values belong in these files.
 */
export { default as RecLabel } from './RecLabel';
export { default as StackedHeading } from './StackedHeading';
export { default as Marquee } from './Marquee';
export { default as NumberedItem } from './NumberedItem';
export { default as CountUp } from './CountUp';
export { default as TagChip } from './TagChip';
export { default as Accordion } from './Accordion';
export { default as FrameCard } from './FrameCard';
export { default as MotionPlate } from './MotionPlate';
export { default as PillButton } from './PillButton';
export { default as QuotePanel } from './QuotePanel';
export { default as ImageTypeMask } from './ImageTypeMask';
export type { AccordionEntry } from './Accordion';
export type { QuoteEntry } from './QuotePanel';
