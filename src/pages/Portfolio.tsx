import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Footer from '../components/Footer';
import {
  FrameCard,
  NumberedItem,
  RecLabel,
  StackedHeading,
  TagChip,
} from '../components/rushes';
import { getPortfolioProjects } from '../lib/cms';
import { detailPath } from '../lib/collections';
import { useOpenEntry } from '../lib/entryNavigation';
import { ownerArchiveImage } from '../lib/image';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { PortfolioProject } from '../types';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The owner's stack, carried over verbatim from the pre-retheme page. Kept in
 * the page rather than the CMS because it is presentation grouping, not content.
 */
const technicalSkills = [
  { category: 'Java', items: ['Swing', 'JDBC', 'OOP', 'Desktop Applications'] },
  { category: 'Python', items: ['Scripting', 'Network Tools', 'Machine Learning'] },
  { category: 'PHP', items: ['Authentication Systems', 'MySQL'] },
  { category: 'React', items: ['Hooks', 'Components', 'Frontend Applications'] },
  { category: 'Node.js', items: ['Express', 'REST APIs', 'MongoDB', 'MERN'] },
  { category: 'TypeScript', items: ['Interfaces', 'Scalable Applications'] },
  { category: 'C++', items: ['DSP', 'Audio Engineering', 'Spatial Audio'] },
  { category: 'Networking', items: ['LoRaWAN', 'Packet Simulation', 'Network Topologies'] },
];

/**
 * techStack arrives either as plain strings or as `{ tech }` objects depending
 * on whether the entry was hand-written or produced by the CMS list widget.
 * Normalised defensively so a malformed row can never break the index.
 */
function techList(stack: PortfolioProject['techStack'] | undefined): string[] {
  const items = (Array.isArray(stack) ? stack : []) as Array<
    string | { tech?: string } | null | undefined
  >;

  return items
    .map((item) => (typeof item === 'string' ? item : item?.tech ?? ''))
    .map((tech) => tech.trim())
    .filter((tech) => tech.length > 0);
}

/**
 * Project plates use the shared owner-archive guard: a project renders its
 * photograph only when that photograph is the owner's, otherwise no plate.
 */
export default function Portfolio() {
  const openEntry = useOpenEntry();
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const flatten = shouldReduceMotion || isTouchDevice;

  // Load from CMS dynamically
  const projects = useMemo(() => getPortfolioProjects(), []);

  /** Only projects with one of the owner's own photographs get an image plate. */
  const plates = useMemo(
    () =>
      projects
        .map((project) => ({ project, image: ownerArchiveImage(project.projectImage) }))
        .filter((plate): plate is { project: PortfolioProject; image: string } =>
          Boolean(plate.image)
        ),
    [projects]
  );

  return (
    <motion.div
      key="portfolio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: flatten ? 0.25 : 0.8, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-hidden"
    >
      <div className="page-shell custom-scrollbar relative z-10 flex-grow overflow-y-auto pt-0">
        {/* ===================== INTRO ===================== */}
        <div className="page-intro" data-mark="WORK">
          <motion.div
            className="page-eyebrow"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <RecLabel>work</RecLabel>
          </motion.div>

          <motion.h1
            className="page-title"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: EASE }}
          >
            Portfolio
          </motion.h1>

          <motion.div
            className="page-description"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
          >
            <p>
              A collection of engineering case studies. Building with an emphasis on
              performance, precision, and robust architectures.
            </p>
          </motion.div>
        </div>

        {/* ===================== THE INDEX ===================== */}
        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: shouldReduceMotion ? 0.35 : 0.85, ease: EASE }}
          className="border-t border-zinc-800 pt-7"
        >
          <div className="flex items-baseline justify-between gap-4">
            <RecLabel>index</RecLabel>
            <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
              {String(projects.length).padStart(3, '0')}
            </span>
          </div>

          <StackedHeading
            lines={['selected', 'case studies']}
            body="Open a line for the full write-up — stack, constraints, and what shipped."
            className="mt-7"
          />

          <div className="mt-12 border-t border-zinc-800 md:mt-16">
            {projects.map((project, index) => (
              <NumberedItem
                key={project.slug || `project-${index}`}
                index={index + 1}
                label={project.title}
                description={project.description}
                meta={techList(project.techStack)[0]}
                href={detailPath('portfolio', project.slug)}
                onClick={() => openEntry('portfolio', project.slug)}
                className="min-h-[44px]"
              />
            ))}
          </div>
        </motion.section>

        {/* ===================== IMAGE PLATES ===================== */}
        {plates.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: shouldReduceMotion ? 0.35 : 0.85, ease: EASE }}
            className="mt-24 border-t border-zinc-800 pt-7 md:mt-32"
          >
            <RecLabel>plates</RecLabel>
            <StackedHeading
              lines={['the work', 'in frames']}
              size="text-3xl md:text-5xl lg:text-6xl"
              className="mt-7"
            />

            <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 md:mt-16">
              {plates.map(({ project, image }, index) => (
                <FrameCard
                  key={project.slug || `plate-${index}`}
                  title={project.title}
                  image={image}
                  index={String(index + 1).padStart(2, '0')}
                  tag={techList(project.techStack)[0]}
                  excerpt={project.description}
                  aspect="aspect-[4/3] sm:aspect-[16/10]"
                  priority={index === 0}
                  href={detailPath('portfolio', project.slug)}
                  onClick={() => openEntry('portfolio', project.slug)}
                  className="min-h-[44px]"
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* ===================== TECHNICAL CONTEXT ===================== */}
        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: shouldReduceMotion ? 0.35 : 0.85, ease: EASE }}
          className="mt-24 border-t border-zinc-800 pb-24 pt-7 md:mt-32 md:pb-32"
        >
          <RecLabel>stack</RecLabel>
          <StackedHeading
            lines={['technical', 'context']}
            body="The languages and systems the case studies above are built on."
            className="mt-7"
          />

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
            {technicalSkills.map((section, index) => (
              <div key={section.category} className="min-w-0">
                <h3 className="flex items-baseline gap-3 border-b border-zinc-800 pb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                  <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 break-words">{section.category}</span>
                </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {section.items.map((item) => (
                    <TagChip key={item}>{item}</TagChip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <Footer />
      </div>
    </motion.div>
  );
}
