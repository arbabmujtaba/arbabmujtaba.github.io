import { useMemo, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import Footer from '../components/Footer';
import Constellation from '../components/magic/Constellation';
import FullStop from '../components/magic/FullStop';
import InkNote from '../components/magic/InkNote';
import {
  ArchiveDoor,
  Bookshelf,
  ChapterTimeline,
  CountUp,
  LastNotes,
  LivingJournal,
  Marquee,
  MemoryMap,
  PhotoShuffle,
  ProjectIndex,
  RecLabel,
  ReelShowcase,
  StackedHeading,
  ThoughtDrawer,
} from '../components/rushes';
import {
  getFavoriteItems,
  getGearItems,
  getHomeConfig,
  getJournalEntries,
  getPhotographyEntries,
  getPortfolioProjects,
  getTechEntries,
  getTimelineMilestones,
} from '../lib/cms';
import { useMagic } from '../lib/magic';
import { getLocalWebpSources } from '../lib/image';
import { isRoomEnabled } from '../lib/secrets';
import { useMediaQuery } from '../lib/useMediaQuery';

interface HomeProps {
  setView: (view: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hero backdrop. Assigned in `.kiro/IMAGE_MAP.md`: at mean luminance 50 it is
 * the darkest large photograph in the archive, so the bone hero type stays
 * legible over it. The hero is an ink plate at any hour (data-surface="ink").
 *
 * The frame is a portrait. Landscape screens get a 3:2 band baked out of it at
 * full resolution (`npm run hero:image`) — clouds, the low sun beside the name,
 * the tree line — instead of the middle of the 1536 px portrait derivative,
 * which was soft on large screens and hid the sun behind the wordmark. Portrait
 * screens keep the portrait frame.
 */
// Also preloaded by index.html — change both together.
const HERO_IMAGE = '/uploads/photography/1785134270800-642096424.jpeg';
const HERO_WIDE_SRCSET = [1280, 1920, 2560]
  .map((width) => `/uploads/optimized/home/hero-dusk-wide-${width}.webp ${width}w`)
  .join(', ');
const HERO_TALL_SRCSET = getLocalWebpSources(HERO_IMAGE)?.srcSet;

function HeroPlate() {
  // A missing derivative makes the whole <picture> fail; fall back to the original.
  const [failed, setFailed] = useState(false);
  const img = (
    <img
      src={HERO_IMAGE}
      alt=""
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onError={() => setFailed(true)}
      className="hero-plate h-[114%] w-full object-cover object-[50%_42%]"
    />
  );
  if (failed) return img;
  return (
    <picture>
      <source media="(orientation: landscape)" type="image/webp" srcSet={HERO_WIDE_SRCSET} sizes="100vw" />
      {HERO_TALL_SRCSET && <source type="image/webp" srcSet={HERO_TALL_SRCSET} sizes="100vw" />}
      {img}
    </picture>
  );
}

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative z-20 border-t border-zinc-800 px-4 py-20 md:px-12 md:py-32 lg:px-16 ${className}`}>
      {children}
    </section>
  );
}

function SeeAll({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex min-h-[44px] items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-accent md:self-auto"
    >
      {children}
      <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1">
        &rarr;
      </span>
    </button>
  );
}

export default function Home({ setView }: HomeProps) {
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const shouldParallax = !shouldReduceMotion && !isTouchDevice;
  const { openRoom } = useMagic();

  // The window scrolls. (The inner box this used to read never did — see
  // FloatingMagicalArrow — so the parallax below had been frozen.)
  const { scrollY } = useScroll();
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
  const profile = homeConfig.find((entry) => entry.configType === 'profile');
  const reels = homeConfig.filter((entry) => entry.configType === 'reel' && !!entry.video);

  const notes = useMemo(
    () =>
      homeConfig
        .filter((entry) => entry.configType === 'quote')
        .map((entry) => ({
          id: entry.slug,
          text: entry.title,
          aside: entry.description,
          author: entry.author || undefined,
        })),
    [homeConfig]
  );

  const projects = useMemo(() => getPortfolioProjects(), []);
  const photography = useMemo(() => getPhotographyEntries(), []);
  const journal = useMemo(() => getJournalEntries(), []);
  const tech = useMemo(() => getTechEntries(), []);
  const gear = useMemo(() => getGearItems(), []);
  const favorites = useMemo(() => getFavoriteItems(), []);
  const timeline = useMemo(() => getTimelineMilestones().filter((m) => m.visible), []);
  const darkroom = useMemo(() => isRoomEnabled('darkroom'), []);

  /** Featured work first, then the rest — six lines is an index, not a dump. */
  const projectIndex = useMemo(
    () => [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6),
    [projects]
  );

  const targetOf = (entry: { navTarget?: string; slug: string }) =>
    entry.navTarget || entry.slug.replace('gateway-', '');

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: isTouchDevice ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isTouchDevice ? 0 : -18 }}
      transition={{ duration: isTouchDevice ? 0.2 : 0.85, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-clip"
    >
      <div className="relative z-10 w-full flex-grow">
        {/* ===================== HERO ===================== */}
        <section
          data-surface="ink"
          className="relative flex min-h-[88vh] flex-col justify-end overflow-hidden px-4 pb-14 pt-28 text-zinc-100 md:min-h-[100vh] md:px-12 md:pb-20 md:pt-32 lg:min-h-[calc(100vh-4rem)] lg:px-16"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 -z-10 overflow-hidden bg-canvas-deep"
            style={shouldParallax ? { y: heroImageY } : undefined}
          >
            <HeroPlate />
            {/* Light where the sky is, dark where the type sits: a scrim along
                the bottom for the name and the copy, a thin one along the top
                for the header, and the photograph left at full strength between. */}
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 via-35% to-transparent" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_100%,var(--bg)_0%,transparent_60%)] opacity-70" />
          </motion.div>

          {/* once, after a while: something crossing the sky */}
          <span aria-hidden="true" className="night-only shooting-star left-[6%] top-[9%] md:left-[22%] md:top-[8%]" />
          {/* the sky above the name, after dark */}
          <Constellation className="absolute left-[8%] top-[13%] h-[26vw] max-h-[15rem] w-[44vw] max-w-[30rem] md:left-[27%] md:top-[15%]" />
          <InkNote section="hero" className="absolute right-4 top-24 md:left-12 md:right-auto md:top-28 lg:left-16" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          >
            <RecLabel bright>sopore &rarr; indore</RecLabel>
          </motion.div>

          <motion.h1
            data-levitate
            className="mt-6 font-display text-[16vw] font-bold uppercase leading-[0.82] tracking-[-0.055em] text-bone md:text-[13vw]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
          >
            Arbab
            <FullStop />
          </motion.h1>

          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <motion.div
              className="max-w-md"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
            >
              <p className="font-book text-2xl italic leading-tight text-zinc-50 md:text-3xl">An archive still being written.</p>
              <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300 md:text-base">
                {profile?.description ||
                  'Computer Engineering student at IET DAVV, Indore. Based between code, cameras, and the small mysteries that make ordinary days worth documenting.'}
              </p>
            </motion.div>

            <motion.ul
              className="space-y-1 md:text-right"
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
                    <span className="text-zinc-500 group-hover:text-accent">{String(index + 1).padStart(2, '0')}/</span>
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
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500">scroll</span>
            </motion.div>
          )}
        </section>

        {/* ===================== ROLE TICKER ===================== */}
        <div className="relative z-20 border-y border-zinc-800 py-5">
          <Marquee duration={38}>
            {gateways.map((gateway, index) => (
              <span key={gateway.slug} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                <span className="text-accent">{String(index + 1).padStart(2, '0')}/</span>
                {gateway.label?.replace(/^\d+\s*\/\/\s*/, '') || gateway.title}
                <span aria-hidden="true" className="text-zinc-700">
                  &mdash;
                </span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ===================== THE INDEX ===================== */}
        <Section>
          <RecLabel>the index</RecLabel>
          <p className="mt-8 max-w-5xl font-display text-3xl font-medium leading-[1.14] tracking-[-0.045em] text-zinc-50 md:text-5xl lg:text-[3.6rem]">
            So far: <CountUp value={projects.length} className="text-accent" /> things built and shipped,{' '}
            <CountUp value={photography.length} className="text-accent" /> frames{' '}
            <span className="font-book font-normal italic tracking-[-0.02em] text-zinc-300">I keep going back to</span>,{' '}
            <CountUp value={journal.length} className="text-accent" /> volumes of the journal, and{' '}
            <CountUp value={favorites.length} className="text-accent" /> small notes{' '}
            <span className="font-book font-normal italic tracking-[-0.02em] text-zinc-300">worth keeping</span>.
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            counted from the archive itself · {timeline.length} chapters since {timeline[0]?.year || '2019'}
          </p>
        </Section>

        {/* ===================== THE DESK (living journal + the shelf) =====================
            Was two sections: "On the desk, lately" and "Ink, still drying", which
            listed the same three journal volumes twice. One desk now — the newest
            things on it, every volume on the shelf behind, and the odd book. */}
        <Section>
          <InkNote section="writing" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <RecLabel>lately</RecLabel>
              <StackedHeading
                lines={['On the desk,', 'lately']}
                className="mt-7"
                body="Whatever was added last, from every corner of the archive — a volume, a frame, a log — with every volume of the journal on the shelf behind it. Anything new since your last visit is marked."
              />
            </div>
            {journal.length > 0 && <SeeAll onClick={() => setView('journal')}>the journal</SeeAll>}
          </div>
          <LivingJournal journal={journal} photography={photography} tech={tech} className="mt-14">
            {journal.length > 0 && <Bookshelf volumes={journal} className="mt-14" />}
          </LivingJournal>
        </Section>

        {/* ===================== REELS ===================== */}
        {reels.length > 0 && (
          <Section>
            <RecLabel>reels</RecLabel>
            <StackedHeading
              lines={['Frames that', 'keep moving']}
              className="mt-7"
              body="Short clips from the same archive — the parts a still photograph cannot hold."
            />
            <div data-surface="ink" className="mt-14">
              <ReelShowcase reels={reels} />
            </div>
          </Section>
        )}

        {/* ===================== FRAMES ===================== */}
        {photography.length > 0 && (
          <Section>
            <InkNote section="frames" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <RecLabel onDot={darkroom ? () => openRoom('darkroom') : undefined} dotLabel="A red safelight">
                  frames
                </RecLabel>
                <StackedHeading
                  lines={['Light I couldn’t', 'quite let go of']}
                  className="mt-7"
                  body="Pictures I keep coming back to — skies over home, friends around a fire, the long light of ordinary evenings. The shelf reshuffles itself while you look; open any frame to see it whole."
                />
              </div>
              <SeeAll onClick={() => setView('photography')}>all {photography.length} frames</SeeAll>
            </div>
            <PhotoShuffle entries={photography} className="mt-14" />
          </Section>
        )}

        {/* ===================== WORK ===================== */}
        {projectIndex.length > 0 && (
          <Section>
            <InkNote section="work" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <RecLabel>work</RecLabel>
                <StackedHeading
                  lines={['Things I built', 'to understand them']}
                  className="mt-7"
                  body="Every project here began as a question I couldn't leave alone — how packets find their way, how a login stays safe, how a machine might learn a language from home."
                />
              </div>
              <SeeAll onClick={() => setView('portfolio')}>all {projects.length} projects</SeeAll>
            </div>
            <ProjectIndex projects={projectIndex} className="mt-14" />
          </Section>
        )}

        {/* ===================== CHAPTERS ===================== */}
        {timeline.length > 0 && (
          <Section id="chapters">
            <RecLabel>chapters</RecLabel>
            <StackedHeading
              lines={['From Sopore', 'to Indore, so far']}
              className="mt-7"
              body={`${timeline.length} years, ${timeline.length} chapters — school, the long pursuit, leaving home, and everything I've been learning since. Turn a page to read a little more.`}
            />
            <ChapterTimeline milestones={timeline} className="mt-16 md:mt-20" />

            <div className="mt-8 border-t border-zinc-800 pt-14 md:pt-20">
              <RecLabel quiet>the map of it</RecLabel>
              <p className="mt-5 max-w-lg font-book text-2xl italic leading-snug text-zinc-200 md:text-3xl">
                Two cities, a valley, and the long road between them.
              </p>
              <MemoryMap chapters={timeline} photography={photography} journal={journal} reels={reels} className="mt-10" />
            </div>
          </Section>
        )}

        {/* ===================== NOTES ===================== */}
        {notes.length > 0 && (
          <Section className="overflow-hidden">
            <InkNote section="notes" className="absolute bottom-10 left-4 md:left-12 lg:left-16" />
            <LastNotes
              notes={notes}
              intro={
                <>
                  <RecLabel>notes</RecLabel>
                  <StackedHeading
                    lines={['Loose leaves,', 'left on the desk']}
                    className="mt-7"
                    body="A few lines I keep close. They turn over on their own; hover to hold one."
                  />
                </>
              }
            />
            <div className="mt-20 border-t border-zinc-800 pt-12 md:mt-28">
              <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">the drawer · a thought from the archive</p>
              <ThoughtDrawer />
            </div>
          </Section>
        )}

        {/* ===================== KIT ===================== */}
        {gear.length > 0 && (
          <Section className="py-14 md:py-20">
            <RecLabel>kit</RecLabel>
            <div className="mt-8">
              <Marquee duration={30} reverse>
                {gear.map((item) => (
                  <span key={item.slug} className="font-display text-2xl font-medium tracking-[-0.03em] text-zinc-500 md:text-4xl">
                    {item.title}
                  </span>
                ))}
              </Marquee>
            </div>
          </Section>
        )}

        {/* ===================== WAYS IN ===================== */}
        <Section>
          <InkNote section="archive" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
          <RecLabel>sections</RecLabel>
          <StackedHeading
            lines={['Ways into', 'the archive']}
            className="mt-7"
            body={profile?.body || 'Part portfolio, part journal, part visual memory bank.'}
          />
          <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {gateways.map((gateway, index) => (
              <ArchiveDoor
                key={gateway.slug}
                title={gateway.title}
                image={gateway.image}
                index={`${String(index + 1).padStart(2, '0')}/`}
                role={gateway.label?.replace(/^\d+\s*\/\/\s*/, '')}
                description={gateway.description}
                href={`/${targetOf(gateway)}`}
                onOpen={() => setView(targetOf(gateway))}
                delay={index * 0.08}
              />
            ))}
          </div>
        </Section>

        <Footer setView={setView} />
      </div>
    </motion.div>
  );
}
