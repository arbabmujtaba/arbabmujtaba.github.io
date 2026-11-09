import { useMemo } from 'react';
import { m, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import Footer from '../components/Footer';
import { Rise } from '../components/rushes/Depth';
import { usePointerDepth, useScrollDepth } from '../lib/depth';
import Constellation from '../components/magic/Constellation';
import FullStop from '../components/magic/FullStop';
import InkNote from '../components/magic/InkNote';
import {
  Bookshelf,
  CountUp,
  LastNotes,
  LivingJournal,
  Marquee,
  PhotoShuffle,
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
import { pickHeroBlock, resolveHero } from '../lib/hero';
import { buildMosaic } from '../lib/mosaic';
import { scrollToElement } from '../lib/scroll';
import HeroMosaic from '../components/home/HeroMosaic';
import IntroStatement from '../components/home/IntroStatement';
import BigCards from '../components/home/BigCards';
import ChapterRoute from '../components/home/ChapterRoute';
import WorkColumn from '../components/home/WorkColumn';
import StorySection from '../components/home/StorySection';
import { isRoomEnabled } from '../lib/secrets';
import { useMediaQuery } from '../lib/useMediaQuery';

interface HomeProps {
  setView: (view: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** The italic line under the name when the lead Hero block has no label of its own. */
const DEFAULT_TAGLINE = 'An archive still being written.';

function Section({
  children,
  className = '',
  id,
  flat = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Skip the 3D rise — for sections holding sticky or fixed elements. */
  flat?: boolean;
}) {
  return (
    <section id={id} className={`relative z-20 border-t border-zinc-800 px-5 py-16 md:px-12 md:py-28 lg:px-16 ${className}`}>
      {flat ? children : <Rise>{children}</Rise>}
    </section>
  );
}

/** The hero's lean: slow enough to feel like weight, quick enough to follow. */
const LEAN = { stiffness: 60, damping: 20, mass: 0.8 };

function SeeAll({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex min-h-[44px] items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-accent-ink md:self-auto"
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
  // The wall sinks into the dark as the page leaves it.
  const heroDim = useTransform(scrollY, [0, 760], [0, 0.65]);

  // ---- the hero in depth (desktop, fine pointer, motion allowed) ----
  // Three planes: the photograph far back, the sky's stars between, the name
  // and copy in front. The pointer leans them apart in opposite directions,
  // which is what reads as depth; scrolling tips the copy back on its base and
  // dollies into the photograph. All of it is motion values on transforms.
  const pointerDepth = usePointerDepth();
  const scrollDepth = useScrollDepth();
  const leanX = useMotionValue(0);
  const leanY = useMotionValue(0);
  const lx = useSpring(leanX, LEAN);
  const ly = useSpring(leanY, LEAN);
  const plateX = useTransform(lx, (v) => v * -28);
  const plateY = useTransform(ly, (v) => v * -18);
  const plateScale = useTransform(scrollY, [0, 900], [1.02, 1.1]);
  const copyX = useTransform(lx, (v) => v * 16);
  const copyRotateY = useTransform(lx, (v) => v * 7);
  const copyTilt = useTransform(scrollY, [0, 650], [0, 18]);
  const copyRotateX = useTransform([ly, copyTilt] as MotionValue<number>[], ([lean, tilt]: number[]) => lean * -5 + tilt);
  const copyY = useTransform(scrollY, [0, 650], [0, -36]);
  const onHeroPointer = (event: React.PointerEvent) => {
    if (!pointerDepth || event.pointerType !== 'mouse') return;
    leanX.set(event.clientX / window.innerWidth - 0.5);
    leanY.set(event.clientY / window.innerHeight - 0.5);
  };
  const onHeroLeave = () => {
    leanX.set(0);
    leanY.set(0);
  };

  // ---- content, all from the markdown archive ----
  const homeConfig = useMemo(
    () =>
      getHomeConfig()
        .filter((entry) => entry.visible)
        .sort((a, b) => a.order - b.order),
    []
  );

  // Every hero block, visible or not — resolveHero skips the hidden ones.
  const hero = useMemo(() => resolveHero(getHomeConfig()), []);
  const tagline = useMemo(() => pickHeroBlock(getHomeConfig())?.label?.trim() || DEFAULT_TAGLINE, []);
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

  const intro = homeConfig.find((entry) => entry.configType === 'intro');
  const story = homeConfig.find((entry) => entry.configType === 'story');

  const projects = useMemo(() => getPortfolioProjects(), []);
  const photography = useMemo(() => getPhotographyEntries(), []);
  const journal = useMemo(() => getJournalEntries(), []);
  const tech = useMemo(() => getTechEntries(), []);
  const gear = useMemo(() => getGearItems(), []);
  const favorites = useMemo(() => getFavoriteItems(), []);
  const timeline = useMemo(() => getTimelineMilestones().filter((m) => m.visible), []);
  const darkroom = useMemo(() => isRoomEnabled('darkroom'), []);

  /**
   * Six lines is an index, not a dump. The CMS already orders projects by
   * priority (0 = featured, then 1, 2…), then the Featured switch.
   */
  const projectIndex = useMemo(() => projects.slice(0, 6), [projects]);

  /** The big cards: the archive's photographs, by priority (0 = featured first). */
  const selectedFrames = useMemo(() => photography.filter((entry) => entry.coverImage).slice(0, 4), [photography]);

  /** The wall behind the name: the lead Hero photo in the centre, then the archive. */
  const mosaic = useMemo(
    () =>
      buildMosaic(
        hero,
        getHomeConfig(),
        photography.map((entry) => ({ image: entry.coverImage, customization: entry.customization })),
        journal.map((entry) => ({ image: entry.featuredImage || entry.coverImage, customization: entry.customization })),
        homeConfig
          .filter((entry) => entry.configType === 'gateway')
          .map((entry) => ({ image: entry.image, customization: entry.customization }))
      ),
    [hero, photography, journal, homeConfig]
  );

  /** "Builder · Thinker · Engineer · Witness", from the archive doors' labels. */
  const roles = gateways
    .map((gateway) => gateway.label?.replace(/^\d+\s*\/\/\s*/, '').trim())
    .filter(Boolean)
    .join(' · ');

  const targetOf = (entry: { navTarget?: string; slug: string }) =>
    entry.navTarget || entry.slug.replace('gateway-', '');

  return (
    <m.div
      key="home"
      initial={{ opacity: 0, y: isTouchDevice ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isTouchDevice ? 0 : -18 }}
      transition={{ duration: isTouchDevice ? 0.2 : 0.85, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-clip"
    >
      <div className="relative z-10 w-full flex-grow">
        {/* ===================== HERO =====================
            A wall of photographs behind the name. The lead Hero photo from
            /admin is the centre tile (and the one index.html preloads); the
            other Hero photos and the archive's covers fill the rest. */}
        <section
          data-surface="ink"
          onPointerMove={onHeroPointer}
          onPointerLeave={onHeroLeave}
          className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-24 pt-24 text-zinc-100 md:px-12 md:pb-12 md:pt-28 lg:min-h-[calc(100vh-4rem)] lg:px-16"
        >
          <m.div
            aria-hidden="true"
            className="absolute inset-0 -z-10 overflow-hidden bg-canvas-deep"
            style={shouldParallax ? { y: heroImageY } : undefined}
          >
            <m.div
              className="absolute inset-0"
              style={pointerDepth ? { x: plateX, y: plateY, scale: scrollDepth ? plateScale : 1.02 } : undefined}
            >
              <HeroMosaic tiles={mosaic} scrollY={scrollY} parallax={shouldParallax} />
            </m.div>
            {/* Dark where the type sits: a pool behind the name, a scrim along
                the bottom for the copy and one along the top for the header. */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_46%_at_50%_50%,color-mix(in_srgb,var(--bg-deep)_78%,transparent)_0%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-canvas via-canvas/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/80 to-transparent" />
            <m.div className="pointer-events-none absolute inset-0 bg-canvas-deep" style={shouldParallax ? { opacity: heroDim } : { opacity: 0 }} />
          </m.div>

          {/* once, after a while: something crossing the sky */}
          <span aria-hidden="true" className="night-only shooting-star left-[6%] top-[9%] md:left-[22%] md:top-[8%]" />
          {/* the sky above the name, after dark */}
          <Constellation className="absolute left-[10%] top-[11%] h-[30vw] max-h-[15rem] w-[52vw] max-w-[30rem] md:left-[27%] md:top-[15%] md:h-[26vw] md:w-[44vw]" />
          <InkNote section="hero" className="absolute right-5 top-[30%] text-right md:left-12 md:right-auto md:top-28 md:text-left lg:left-16" />

          <m.div
            className="pointer-events-none relative flex flex-1 flex-col"
            style={
              pointerDepth
                ? {
                    x: copyX,
                    rotateY: copyRotateY,
                    rotateX: scrollDepth ? copyRotateX : 0,
                    y: scrollDepth ? copyY : 0,
                    transformPerspective: 1200,
                    transformOrigin: '50% 60%',
                  }
                : undefined
            }
          >
            <m.div
              className="hidden md:flex md:flex-row md:items-center md:justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
            >
              <RecLabel bright>sopore &rarr; indore</RecLabel>
              {roles && <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-300 md:text-[11px]">{roles}</p>}
            </m.div>

            <div className="flex flex-1 flex-col items-center justify-center pb-8 pt-16 text-center md:py-12">
              <h1
                data-levitate
                className="pointer-events-auto flex items-baseline font-book text-[26vw] font-medium leading-[0.8] tracking-[-0.045em] text-bone [text-shadow:0_4px_60px_rgba(0,0,0,0.5)] md:text-[17vw] lg:text-[15vw]"
              >
                <span className="flex overflow-hidden pb-[0.1em]">
                  {'Arbab'.split('').map((letter, index) => (
                    <m.span
                      key={index}
                      className="inline-block"
                      initial={shouldReduceMotion ? { opacity: 0 } : { y: '105%' }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { y: '0%' }}
                      transition={{ duration: 1.25, delay: 0.35 + index * 0.07, ease: EASE }}
                    >
                      {letter}
                    </m.span>
                  ))}
                </span>
                <m.span
                  className="inline-block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
                >
                  <FullStop />
                </m.span>
              </h1>
              <m.p
                className="mt-4 font-book text-2xl italic leading-tight text-zinc-50 md:mt-2 md:text-4xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
              >
                {tagline}
              </m.p>
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              {/* On phones the place and the roles sit down here, so the sky
                  above the name stays clear for the constellation. */}
              <m.div
                className="flex flex-col gap-2 md:hidden"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
              >
                <RecLabel bright>sopore &rarr; indore</RecLabel>
                {roles && <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">{roles}</p>}
              </m.div>
              <m.p
                className="max-w-sm text-[13px] font-light leading-relaxed text-zinc-300 md:text-base"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.95, ease: EASE }}
              >
                {profile?.description ||
                  'Computer Engineering student at IET DAVV, Indore. Based between code, cameras, and the small mysteries that make ordinary days worth documenting.'}
              </m.p>

            </div>
          </m.div>

          {!isTouchDevice && (
            <m.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
              style={shouldParallax ? { opacity: heroFade } : undefined}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500">scroll</span>
              <span className="relative h-10 w-px overflow-hidden bg-zinc-800">
                <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-zinc-300" />
              </span>
            </m.div>
          )}
        </section>

        {/* ===================== ROLE TICKER ===================== */}
        <div className="relative z-20 border-y border-zinc-800 py-5">
          <Marquee duration={38}>
            {gateways.map((gateway, index) => (
              <span key={gateway.slug} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                <span className="text-accent-ink">{String(index + 1).padStart(2, '0')}/</span>
                {gateway.label?.replace(/^\d+\s*\/\/\s*/, '') || gateway.title}
                <span aria-hidden="true" className="text-zinc-700">
                  &mdash;
                </span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ===================== INTRO ===================== */}
        {intro?.title && (
          <Section className="py-20 md:py-40">
            <IntroStatement label={intro.label || 'intro'} text={intro.title} />
          </Section>
        )}

        {/* ===================== SELECTED FRAMES — the big cards =====================
            The photographs, large, in the order the archive ranks them
            (priority in /admin). The projects follow later, as a quiet list. */}
        {selectedFrames.length > 0 && (
          <Section>
            <InkNote section="frames" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <RecLabel onDot={darkroom ? () => openRoom('darkroom') : undefined} dotLabel="A red safelight">
                  selected frames
                </RecLabel>
                <StackedHeading
                  lines={['Light I couldn’t', 'quite let go of']}
                  className="mt-7"
                  body="Skies over home, friends around a fire, the long light of ordinary evenings. Open any frame to see it whole."
                />
              </div>
              <SeeAll onClick={() => setView('photography')}>all {photography.length} frames</SeeAll>
            </div>
            <BigCards
              collection="photography"
              parallax={shouldParallax}
              className="mt-10 md:mt-24"
              items={selectedFrames.map((entry) => ({
                slug: entry.slug,
                title: entry.title,
                image: entry.coverImage,
                customization: entry.customization,
                meta: [entry.category, entry.date?.slice(0, 4)].filter(Boolean).join(' · '),
              }))}
            />
          </Section>
        )}

        {/* ===================== STORY ===================== */}
        {story?.title && (
          <Section id="story" flat>
            <StorySection
              story={{
                label: story.label || 'my story',
                heading: story.title,
                lead: story.description,
                body: story.body,
                image: story.image,
                customization: story.customization,
              }}
              parallax={shouldParallax}
              footer={
                timeline.length > 0 ? (
                  <SeeAll
                    onClick={() => {
                      const chapters = document.getElementById('chapters');
                      if (chapters) scrollToElement(chapters, -24);
                    }}
                  >
                    read it in chapters
                  </SeeAll>
                ) : undefined
              }
            />
          </Section>
        )}

        {/* ===================== WORK — one narrow column =====================
            No label, no headline: a line of italic on one side, the projects
            as a single quiet column on the other. */}
        {projectIndex.length > 0 && (
          <Section className="md:py-24">
            <InkNote section="work" className="absolute right-4 top-10 text-right md:right-12 lg:right-16" />
            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="md:sticky md:top-28 md:self-start">
                <p className="max-w-xs font-book text-2xl italic leading-snug text-zinc-300 md:text-3xl">
                  And a few things I built, to understand them.
                </p>
                <div className="mt-6">
                  <SeeAll onClick={() => setView('portfolio')}>all {projects.length} projects</SeeAll>
                </div>
              </div>
              <WorkColumn projects={projectIndex} />
            </div>
          </Section>
        )}

        {/* ===================== THE INDEX ===================== */}
        <Section>
          <RecLabel>the index</RecLabel>
          <dl className="mt-12 grid grid-cols-2 border-t border-zinc-800 md:grid-cols-4">
            {[
              { value: projects.length, label: 'things built and shipped' },
              { value: photography.length, label: 'frames I keep going back to' },
              { value: journal.length, label: 'volumes of the journal' },
              { value: favorites.length, label: 'small notes worth keeping' },
            ].map((count, index) => (
              <div
                key={count.label}
                className={`flex flex-col-reverse gap-3 border-b border-zinc-800 py-8 md:border-b-0 md:py-12 ${
                  index % 2 === 0 ? 'pr-4' : 'pl-4 md:pl-0'
                } md:px-8 md:first:pl-0 ${index < 3 ? 'md:border-r' : ''}`}
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{count.label}</dt>
                <dd className="font-book text-6xl leading-none tracking-[-0.03em] text-zinc-50 md:text-8xl">
                  <CountUp value={count.value} />
                </dd>
              </div>
            ))}
          </dl>
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
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <RecLabel>the contact sheet</RecLabel>
                <StackedHeading
                  lines={['Every frame,', 'shuffled']}
                  className="mt-7"
                  body="The whole shelf, reshuffling itself while you look."
                />
              </div>
              <SeeAll onClick={() => setView('photography')}>all {photography.length} frames</SeeAll>
            </div>
            <PhotoShuffle entries={photography} className="mt-14" />
          </Section>
        )}

        {/* ===================== CHAPTERS =====================
            The timeline and the map as one line: the road from Sopore to
            Indore with a year for every chapter. */}
        {timeline.length > 0 && (
          <Section id="chapters" className="md:py-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <RecLabel>chapters</RecLabel>
                <p className="mt-6 max-w-lg font-book text-2xl italic leading-snug text-zinc-300 md:text-3xl">
                  {timeline.length} years, one long road between two cities.
                </p>
              </div>
            </div>
            <ChapterRoute chapters={timeline} photography={photography} journal={journal} className="mt-14" />
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
                    body="A few lines I keep close. They turn over on their own — hold one to keep it, or swipe it away."
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
            <InkNote section="archive" className="absolute right-4 top-6 text-right md:right-12 lg:right-16" />
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

        <Footer setView={setView} />
      </div>
    </m.div>
  );
}
