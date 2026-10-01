import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { shouldInterceptClick } from '../../lib/navigation';
import { useOpenEntry } from '../../lib/entryNavigation';
import type { PortfolioProject } from '../../types';

interface ProjectIndexProps {
  projects: PortfolioProject[];
  className?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function stackOf(project: PortfolioProject): string[] {
  return (project.techStack || [])
    .map((item) => (typeof item === 'string' ? item : item.tech))
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * ProjectIndex — the work, as an index rather than a gallery.
 *
 * No images: a number, a name, one line of what it is, and the stack. Rows
 * rest at readable contrast (the old dim-until-hover rows read as disabled) and
 * on hover a hairline wash sweeps in from the left while the arrow lifts.
 * Each row is a real anchor to the case study; a plain click opens it as a
 * quick look over the home page.
 */
export default function ProjectIndex({ projects, className = '' }: ProjectIndexProps) {
  const shouldReduceMotion = useReducedMotion();
  const openEntry = useOpenEntry();

  return (
    <ol className={`border-t border-zinc-800 ${className}`}>
      {projects.map((project, index) => {
        const href = `/portfolio/${project.slug}`;
        const stack = stackOf(project);
        return (
          <motion.li
            key={project.slug}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.7, delay: shouldReduceMotion ? 0 : (index % 4) * 0.05, ease: EASE }}
            className="border-b border-zinc-800"
          >
            <a
              href={href}
              onClick={(event) => {
                if (!shouldInterceptClick(event)) return;
                event.preventDefault();
                openEntry('portfolio', project.slug);
              }}
              className="group/row relative grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-4 gap-y-2 overflow-hidden py-6 md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:gap-x-8 md:py-8 focus-visible:outline-none"
            >
              {/* hover wash */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-[var(--accent-soft)] via-[var(--well)] to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-x-100 group-focus-visible/row:scale-x-100"
              />

              <span className="relative font-mono text-[11px] text-zinc-500 transition-colors group-hover/row:text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="relative min-w-0 font-display text-2xl font-medium leading-[1.05] tracking-[-0.04em] text-zinc-100 transition-transform duration-500 ease-out group-hover/row:translate-x-2 md:text-4xl">
                {project.title}
                {project.featured && (
                  <span className="ml-3 inline-block translate-y-[-0.4em] font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                    featured
                  </span>
                )}
              </span>

              <span className="relative col-start-2 col-end-4 max-w-md text-xs font-light leading-relaxed text-zinc-400 md:col-start-3 md:col-end-4 md:text-sm">
                {project.description}
                {stack.length > 0 && (
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    {stack.join(' · ')}
                  </span>
                )}
              </span>

              <span className="relative col-start-3 row-start-1 flex h-9 w-9 items-center justify-center self-center rounded-full border border-zinc-800 text-zinc-400 transition-all duration-500 group-hover/row:rotate-45 group-hover/row:border-accent group-hover/row:bg-accent group-hover/row:text-canvas md:col-start-4">
                <ArrowUpRight size={15} strokeWidth={1.6} />
              </span>
            </a>
          </motion.li>
        );
      })}
    </ol>
  );
}
