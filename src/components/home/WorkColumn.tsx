import { useState } from 'react';
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import { usePointerDepth } from '../../lib/depth';
import { getLocalWebpSources, ownerArchiveImage } from '../../lib/image';
import type { PortfolioProject } from '../../types';

const EASE = [0.16, 1, 0.3, 1] as const;
const FOLLOW = { stiffness: 260, damping: 28, mass: 0.6 };

function stackOf(project: PortfolioProject): string {
  return (project.techStack || [])
    .map((item) => (typeof item === 'string' ? item : item.tech))
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
}

/**
 * WorkColumn — the projects as one narrow, quiet column.
 *
 * A serif name and a whisper of stack per line, divided by hairlines. Lines
 * rise in one after another; hovering one dims the rest and, with a mouse, a
 * small print of the project floats beside the pointer on a spring. Every line
 * is a real link; a plain click opens the case study as a quick look.
 */
export default function WorkColumn({ projects, className = '' }: { projects: PortfolioProject[]; className?: string }) {
  const openEntry = useOpenEntry();
  const reduced = useReducedMotion();
  const pointer = usePointerDepth();
  const [hovered, setHovered] = useState<PortfolioProject | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const px = useSpring(x, FOLLOW);
  const py = useSpring(y, FOLLOW);

  const preview = hovered ? ownerArchiveImage(hovered.projectImage) || ownerArchiveImage(hovered.videoPoster) : undefined;
  const sources = preview ? getLocalWebpSources(preview, '240px') : undefined;

  return (
    <div
      className={`relative ${className}`}
      onPointerMove={(event) => {
        if (!pointer || event.pointerType !== 'mouse') return;
        x.set(event.clientX);
        y.set(event.clientY);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <ol className="group/list">
        {projects.map((project, index) => (
          <m.li
            key={project.slug}
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, delay: reduced ? 0 : index * 0.06, ease: EASE }}
            className="border-b border-zinc-800 first:border-t"
          >
            <a
              href={`/portfolio/${project.slug}`}
              onClick={(event) => {
                if (!shouldInterceptClick(event)) return;
                event.preventDefault();
                openEntry('portfolio', project.slug);
              }}
              onPointerEnter={() => setHovered(project)}
              onFocus={() => setHovered(project)}
              onBlur={() => setHovered(null)}
              className="group/line flex min-h-[44px] items-baseline gap-4 py-4 transition-opacity duration-500 group-hover/list:opacity-40 hover:!opacity-100 focus-visible:!opacity-100 focus-visible:outline-none md:py-5"
            >
              <span className="w-6 shrink-0 font-mono text-[10px] text-zinc-600 transition-colors group-hover/line:text-accent-ink">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 truncate font-book text-xl leading-tight tracking-[-0.01em] text-zinc-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/line:translate-x-1.5 md:text-[1.6rem]">
                {project.title}
              </span>
              <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 sm:block">
                {stackOf(project)}
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 -translate-x-1 font-mono text-xs text-accent-ink opacity-0 transition-all duration-500 group-hover/line:translate-x-0 group-hover/line:opacity-100 group-focus-visible/line:opacity-100"
              >
                &rarr;
              </span>
            </a>
          </m.li>
        ))}
      </ol>

      {/* the print that follows the pointer */}
      {pointer && (
        <m.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-40"
          style={{ x: px, y: py }}
        >
          <AnimatePresence>
            {preview && hovered && (
              <m.div
                key={hovered.slug}
                className="absolute left-6 top-0 h-36 w-56 -translate-y-1/2 overflow-hidden bg-canvas-deep shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <picture>
                  {sources && <source type="image/webp" srcSet={sources.srcSet} sizes={sources.sizes} />}
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                </picture>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </div>
  );
}
