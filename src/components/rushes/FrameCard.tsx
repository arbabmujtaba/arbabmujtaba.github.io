import { motion } from 'motion/react';
import SafeImage from '../SafeImage';
import TagChip from './TagChip';

interface FrameCardProps {
  title: string;
  image?: string;
  tag?: string;
  /** Small mono line above the title — a date, a volume, a plate number. */
  index?: string;
  excerpt?: string;
  aspect?: string;
  onClick?: () => void;
  priority?: boolean;
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * FrameCard — the standard image plate.
 *
 * A hairline frame that warms to the accent on hover, a slow image scale, and
 * the caption block beneath. The scale transform sits on the image inside an
 * overflow-hidden frame so nothing can bleed into the page — the previous
 * layout audit flagged unclipped transforms as a source of horizontal overflow
 * on phones.
 */
export default function FrameCard({
  title,
  image,
  tag,
  index,
  excerpt,
  aspect = 'aspect-[4/3]',
  onClick,
  priority = false,
  className = '',
}: FrameCardProps) {
  const interactive = typeof onClick === 'function';

  const body = (
    <>
      <div className={`image-frame w-full overflow-hidden ${aspect}`}>
        <SafeImage
          src={image}
          alt={title}
          loading={priority ? 'eager' : 'lazy'}
          className="h-full w-full object-cover opacity-90 transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
          fallback={
            <div className="hairline-grid h-full w-full bg-well" aria-hidden="true" />
          }
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {index && (
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-zinc-500">
              {index}
            </span>
          )}
          <h3 className="font-display text-lg font-medium lowercase leading-tight tracking-[-0.03em] text-zinc-100 transition-colors group-hover:text-zinc-50 md:text-xl">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-2 max-w-md text-xs font-light leading-relaxed text-zinc-400 md:text-sm">
              {excerpt}
            </p>
          )}
        </div>

        {tag && <TagChip className="mt-0.5 shrink-0">{tag}</TagChip>}
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, ease: EASE }}
      className={className}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          className="group block w-full cursor-pointer text-left"
        >
          {body}
        </button>
      ) : (
        <div className="group block w-full">{body}</div>
      )}
    </motion.div>
  );
}
