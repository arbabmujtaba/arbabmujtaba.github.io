import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import Footer from '../components/Footer';
import SafeImage from '../components/SafeImage';
import {
  CountUp,
  FrameCard,
  Marquee,
  NumberedItem,
  QuotePanel,
  RecLabel,
  StackedHeading,
  TagChip,
} from '../components/rushes';
import {
  getFavoriteItems,
  getGearItems,
  getHomeConfig,
  getJournalEntries,
  getPhotographyEntries,
  getPortfolioProjects,
  getTimelineMilestones,
} from '../lib/cms';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { PortfolioProject } from '../types';

interface HomeProps {
  setView: (view: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Hero backdrop. Reassign in .kiro/IMAGE_MAP.md once the audit lands. */
const HERO_IMAGE = '/uploads/home/1781841191101-361910064.jpeg';

/**
 * techStack arrives either as plain strings or as `{ tech }` objects, depending
 * on whether the entry was written by hand or through the CMS list widget.
 */
function firstTech(stack: PortfolioProject['techStack']): string | undefined {
  const first = stack?.[0];
  if (!first) return undefined;
  return typeof first === 'string' ? first : first.tech;
}

function Section({
  children,
  className = '',
  surface,
}: {
  children: React.ReactNode;
  className?: string;
  surface?: 'bone';
}) {
  return (
    <section
      data-surface={surface}
      className={`relative z-20 border-t border-zinc-800 px-4 py-20 md:px-12 md:py-32 lg:px-16 ${
        surface ? 'bg-canvas' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
}

export default function Home({ setView }: HomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const shouldParallax = !shouldReduceMotion && !isTouchDevice;
  const [activeQuote, setActiveQuote] = useState(0);

  const { scrollY } = useScroll({ container: containerRef });
  const heroImageY = useTransform(scrollY, [0, 900], ['0%', '14%']);
  const heroFade = useTransform(scrollY, [0, 520], [1, 0]);

  // ---- content, all from the markdown archive ----
  const homeConfig = useMemo(
    () =>
      getHomeConfig()
        .filter((entry) => entry.visible)
        .sort((a, b) => a.order - b.order),
    []
  );

  const gateways = homeConfig.filter((entry) => entry.configType === 'gateway');
  const principles = homeConfig.filter((entry) => entry.configType === 'principle');
  const profile = homeConfig.find((entry) => entry.configType === 'profile');

  const quotes = useMemo(
    () =>
      homeConfig
        .filter((entry) => entry.configType === 'quote')
        .map((entry) => ({
          id: entry.slug,
          quote: entry.title,
          name: entry.description,
        })),
    [homeConfig]
  );

  const projects = useMemo(() => getPortfolioProjects(), []);
  const photography = useMemo(() => getPhotographyEntries(), []);
  const journal = useMemo(() => getJournalEntries(), []);
  const gear = useMemo(() => getGearItems(), []);
  const favorites = useMemo(() => getFavoriteItems(), []);
  const timeline = useMemo(() => getTimelineMilestones(), []);

  const featured = useMemo(() => {
    const flagged = projects.filter((project) => project.featured);
    return (flagged.length >= 3 ? flagged : projects).slice(0, 3);
  }, [projects]);

  const targetOf = (entry: { navTarget?: string; slug: string }) =>
    entry.navTarget || entry.slug.replace('gateway-', '');

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: isTouchDevice ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isTouchDevice ? 0 : -18 }}
      transition={{ duration: isTouchDevice ? 0.2 : 0.85, ease: EASE }}
      className="relative flex h-full flex-grow flex-col overflow-hidden"
    >
      <div
        ref={containerRef}
        className="custom-scrollbar relative z-10 w-full flex-grow overflow-y-auto"
      >
        {/* ===================== HERO ===================== */}
        <section className="relative flex min-h-[86vh] flex-col justify-end overflow-hidden px-4 pb-14 pt-24 md:min-h-[94vh] md:px-12 md:pb-20 lg:px-16">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 -z-10 overflow-hidden"
            style={shouldParallax ? { y: heroImageY } : undefined}
          >
            <SafeImage
              src={HERO_IMAGE}
              alt=""
              loading="eager"
              className="h-[114%] w-full object-cover opacity-70"
              fallback={<div className="hairline-grid h-full w-full bg-canvas-deep" />}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/45 to-canvas/70" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          >
            <RecLabel bright>srinagar &rarr; indore</RecLabel>
          </motion.div>

          <motion.h1
            className="mt-6 font-display text-[16vw] font-bold uppercase leading-[0.82] tracking-[-0.055em] text-bone md:text-[13vw]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
          >
            Arbab<span className="text-accent">.</span>
          </motion.h1>

          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <motion.p
              className="max-w-sm text-sm font-light leading-relaxed text-zinc-300 md:text-base"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
            >
              {profile?.description ||
                'Computer Engineering student at IET DAVV, Indore. Based between code, cameras, and the small mysteries that make ordinary days worth documenting.'}
            </motion.p>

            <motion.ul
              className="space-y-2 md:text-right"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
            >
              {gateways.map((gateway, index) => (
                <li key={gateway.slug}>
                  <button
                    type="button"
                    onClick={() => setView(targetOf(gateway))}
                    className="group inline-flex min-h-[44px] items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-300 transition-colors hover:text-accent md:text-xs"
                  >
                    <span className="text-zinc-500 group-hover:text-accent">
                      {String(index + 1).padStart(2, '0')}/
                    </span>
                    {gateway.title}
                  </button>
                </li>
              ))}
            </motion.ul>
          </div>

          {!isTouchDevice && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block"
              style={shouldParallax ? { opacity: heroFade } : undefined}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                scroll
              </span>
            </motion.div>
          )}
        </section>

        {/* ===================== ROLE TICKER ===================== */}
        <div className="relative z-20 border-y border-zinc-800 py-5">
          <Marquee duration={38}>
            {gateways.map((gateway, index) => (
              <span
                key={gateway.slug}
                className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400"
              >
                <span className="text-accent">
                  {String(index + 1).padStart(2, '0')}/
                </span>
                {gateway.label?.replace(/^\d+\s*\/\/\s*/, '') || gateway.title}
                <span aria-hidden="true" className="text-zinc-700">
                  &mdash;
                </span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ===================== STAT SENTENCE ===================== */}
        <Section>
          <RecLabel>index</RecLabel>
          <p className="mt-8 max-w-4xl font-display text-3xl font-medium leading-[1.12] tracking-[-0.045em] text-bone md:text-5xl lg:text-6xl">
            <CountUp value={projects.length} suffix="+" className="text-accent" /> projects
            shipped, <CountUp value={photography.length} className="text-accent" /> frames
            kept, <CountUp value={journal.length} className="text-accent" /> journal
            volumes, and <CountUp value={favorites.length} className="text-accent" /> notes
            worth keeping.
          </p>
        </Section>

        {/* ===================== FEATURED WORK ===================== */}
        {featured.length > 0 && (
          <Section>
            <RecLabel>work</RecLabel>
            <div className="mt-7 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <StackedHeading
                lines={['things built', 'and shipped']}
                body="Engineering projects where the interesting part was never the framework."
              />
              <button
                type="button"
                onClick={() => setView('portfolio')}
                className="self-start font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-accent md:self-auto"
              >
                all work &rarr;
              </button>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              {featured.map((project, index) => (
                <FrameCard
                  key={project.slug}
                  title={project.title}
                  image={project.projectImage}
                  index={`0${index + 1}`}
                  tag={firstTech(project.techStack)}
                  excerpt={project.description}
                  aspect="aspect-[4/5]"
                  onClick={() => setView('portfolio')}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ===================== PRINCIPLES ===================== */}
        {principles.length > 0 && (
          <Section>
            <RecLabel>method</RecLabel>
            <StackedHeading
              lines={['how the work', 'gets made']}
              className="mt-7"
              body="Three habits that survived every rewrite."
            />

            <div className="mt-14 border-t border-zinc-800">
              {principles.map((principle, index) => (
                <NumberedItem
                  key={principle.slug}
                  index={index + 1}
                  label={principle.title}
                  description={principle.description}
                />
              ))}
            </div>
          </Section>
        )}

        {/* ===================== TIMELINE ===================== */}
        {timeline.length > 0 && (
          <Section>
            <RecLabel>timeline</RecLabel>
            <StackedHeading
              lines={['the years', 'behind it']}
              className="mt-7"
              body="Where the curiosity went, one year at a time."
            />

            <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {timeline.map((milestone, index) => (
                <motion.article
                  key={milestone.slug}
                  className="border border-zinc-800 bg-canvas-raised p-6"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.75, delay: index * 0.08, ease: EASE }}
                >
                  <TagChip tone="accent">{milestone.year}</TagChip>
                  <h3 className="mt-5 font-display text-xl font-medium lowercase leading-tight tracking-[-0.03em] text-zinc-100">
                    {milestone.title}
                  </h3>
                  <p className="mt-3 text-xs font-light leading-relaxed text-zinc-400">
                    {milestone.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </Section>
        )}

        {/* ===================== INTERLUDE ===================== */}
        {quotes.length > 0 && (
          <Section>
            <RecLabel>interlude</RecLabel>
            <QuotePanel
              entries={quotes}
              activeIndex={activeQuote}
              onSelect={setActiveQuote}
              className="mt-10"
            />
          </Section>
        )}

        {/* ===================== KIT TICKER ===================== */}
        {gear.length > 0 && (
          <Section className="py-14 md:py-20">
            <RecLabel>kit</RecLabel>
            <div className="mt-8">
              <Marquee duration={30} reverse>
                {gear.map((item) => (
                  <span
                    key={item.slug}
                    className="font-display text-2xl font-medium lowercase tracking-[-0.03em] text-zinc-600 md:text-4xl"
                  >
                    {item.title}
                  </span>
                ))}
              </Marquee>
            </div>
          </Section>
        )}

        {/* ===================== SECTION INDEX ===================== */}
        <Section>
          <RecLabel>sections</RecLabel>
          <StackedHeading
            lines={['ways into', 'the archive']}
            className="mt-7"
            body={
              profile?.body ||
              'Part portfolio, part journal, part visual memory bank.'
            }
          />

          <div className="mt-14 border-t border-zinc-800">
            {gateways.map((gateway, index) => (
              <NumberedItem
                key={gateway.slug}
                index={index + 1}
                label={gateway.title}
                description={gateway.description}
                onClick={() => setView(targetOf(gateway))}
              />
            ))}
          </div>
        </Section>

        <Footer wordmarkImage={HERO_IMAGE} setView={setView} />
      </div>
    </motion.div>
  );
}
