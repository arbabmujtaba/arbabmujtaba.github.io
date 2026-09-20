import { motion, useReducedMotion } from 'motion/react';
import SafeImage from '../SafeImage';
import { shouldInterceptClick } from '../../lib/navigation';
import { normalizeImagePath } from '../../lib/image';

interface NumberedItemProps {
  /** Position in the list; rendered zero-padded. */
  index: number;
  label: string;
  /** Right-hand column copy. */
  description?: string;
  /** Far-right figure — a spec, a year, a count. Rendered in the accent. */
  meta?: string;
  onClick?: () => void;
  /**
   * In-site destination. Supplied alongside `onClick`, the row becomes a real
   * anchor so the index is crawlable and each line can be opened in a new tab,
   * while a plain left click still runs `onClick` (the quick look).
   */
  href?: string;
  /**
   * Small square still shown before the number. Gear entries carry an `image`
   * in their front-matter which previously had nowhere to render.
   */
  thumbnail?: string;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * NumberedItem — the `01 label` index row.
 *
 * Rows rest dim and come up to full contrast on hover or focus, which lets a
 * long list read as one quiet block until the reader engages with a line. The
 * description sits in a right-hand column on desktop and stacks underneath on
 * phones. Interactive rows render as buttons so they stay keyboard reachable,
 * and the dim state is only ever applied alongside a hover/focus recovery so
 * nothing is permanently low-contrast.
 */
export default function NumberedItem({
  index,
  label,
  description,
  meta,
  onClick,
  href,
  thumbnail,
  className = '',
}: NumberedItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const interactive = typeof onClick === 'function';
  const number = String(index).padStart(2, '0');

  const resolvedThumbnail = normalizeImagePath(thumbnail);

  const content = (
    <>
      {resolvedThumbnail && (
        <span className="image-frame h-12 w-12 shrink-0 overflow-hidden md:h-14 md:w-14">
          <SafeImage
            src={resolvedThumbnail}
            alt={label}
            className="h-full w-full object-cover"
          />
        </span>
      )}

      <span className="w-7 shrink-0 pt-2 font-mono text-[11px] leading-none text-zinc-500 transition-colors group-hover/item:text-accent">
        {number}
      </span>

      <span className="min-w-0 flex-1 font-display text-2xl font-medium leading-[1.05] tracking-[-0.04em] text-zinc-500 transition-colors duration-500 group-hover/item:text-zinc-50 group-focus-visible/item:text-zinc-50 md:text-4xl lg:text-5xl">
        {label}
      </span>

      {description && (
        <span className="mt-2 block max-w-sm text-xs font-light leading-relaxed text-zinc-500 transition-colors duration-500 group-hover/item:text-zinc-300 group-focus-visible/item:text-zinc-300 md:mt-0 md:shrink-0 md:text-right md:text-sm">
          {description}
        </span>
      )}

      {meta && (
        <span className="shrink-0 font-display text-xl font-medium text-accent md:text-3xl">
          {meta}
        </span>
      )}
    </>
  );

  const shared = `group/item flex w-full flex-col gap-1 border-b border-zinc-800 py-8 text-left md:flex-row md:items-start md:gap-10 md:py-12 ${className}`;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, ease: EASE }}
    >
      {href ? (
        <a
          href={href}
          className={shared}
          onClick={(event) => {
            if (!interactive || !shouldInterceptClick(event)) return;
            event.preventDefault();
            onClick?.();
          }}
        >
          {content}
        </a>
      ) : interactive ? (
        <button type="button" onClick={onClick} className={shared}>
          {content}
        </button>
      ) : (
        <div className={shared}>{content}</div>
      )}
    </motion.div>
  );
}
