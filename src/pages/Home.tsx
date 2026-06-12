import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import CinematicImageReveal from '../components/CinematicImageReveal';
import EnhancedHeroName from '../components/EnhancedHeroName';
import Footer from '../components/Footer';
import MagicalGateway from '../components/MagicalGateway';
import QuoteReveal from '../components/QuoteReveal';
import ScrollIndicator from '../components/ScrollIndicator';

interface HomeProps {
  setView: (view: string) => void;
}

interface ArchiveSectionProps {
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const GATEWAY_SECTIONS = [
  {
    id: 'portfolio',
    label: '01 // Builder',
    title: 'Portfolio',
    description:
      'Selected engineering work, shaped as case studies of systems, interfaces, and careful technical decisions.',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'journal',
    label: '02 // Thinker',
    title: 'Journal',
    description:
      'Essays, observations, and fragments from the human side of learning, building, and becoming.',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'tech',
    label: '03 // Engineer',
    title: 'Tech',
    description:
      'A living lab of experiments, notes, architecture sketches, and problems worth opening twice.',
    image:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'photography',
    label: '04 // Witness',
    title: 'Photography',
    description:
      'Light, place, and memory gathered into a visual archive of streets, quiet details, and passing weather.',
    image:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'collection',
    label: '05 // Curator',
    title: 'Collection',
    description:
      'Books, music, objects, and references that leave a trace on taste, thought, and craft.',
    image:
      'https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=1800&q=80',
  },
];

const QUOTES = [
  {
    text: 'Every project begins with curiosity.',
    author: 'Archive Note 001',
  },
  {
    text: 'Some stories are written. Others are captured.',
    author: 'Archive Note 002',
  },
  {
    text: 'Technology becomes meaningful when it touches real lives.',
    author: 'Archive Note 003',
  },
];

const PRINCIPLES = [
  {
    label: 'Memory',
    title: 'Collected Slowly',
    text: 'Projects, photographs, and notes are treated as evidence of a life in motion, not isolated entries on a page.',
  },
  {
    label: 'Craft',
    title: 'Built Carefully',
    text: 'The technical work is grounded in systems thinking, pragmatic detail, and the quiet pleasure of making things hold together.',
  },
  {
    label: 'Wonder',
    title: 'Kept Alive',
    text: 'The archive leaves room for mystery: enough movement to feel alive, enough restraint to stay personal and premium.',
  },
];

function useSectionSeen() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return { ref, seen };
}

function ArchiveSection({ children, containerRef, className = '' }: ArchiveSectionProps) {
  const targetRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { ref: observerRef, seen } = useSectionSeen();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 0.5, 1], [70, 0, -25]);
  const opacity = useTransform(smoothProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0.72]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.97, 1, 0.99]);

  return (
    <motion.section
      ref={(node) => {
        targetRef.current = node;
        observerRef.current = node;
      }}
      style={shouldReduceMotion ? undefined : { y, opacity, scale }}
      className={`relative z-20 border-t border-zinc-800/20 bg-[#0a0a09]/58 px-4 py-16 backdrop-blur-sm md:px-12 md:py-32 lg:px-16 ${className}`}
      data-seen={seen ? 'true' : 'false'}
    >
      {children}
    </motion.section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      <motion.p
        className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-orange-400/75"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        className="font-serif text-4xl leading-[1.02] tracking-tighter text-zinc-100 md:text-6xl lg:text-7xl"
        initial={{ clipPath: 'inset(0 0 100% 0)', y: 28 }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
      </motion.h2>
      {body && (
        <motion.p
          className="mt-8 max-w-xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-base"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {body}
        </motion.p>
      )}
    </div>
  );
}

export default function Home({ setView }: HomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll({ container: containerRef });

  const smoothScrollY = useSpring(scrollY, {
    stiffness: 95,
    damping: 30,
    restDelta: 0.001,
  });

  const heroOpacity = useTransform(smoothScrollY, [0, 360], [1, 0]);
  const heroY = useTransform(smoothScrollY, [0, 520], [0, 160]);
  const heroScale = useTransform(smoothScrollY, [0, 520], [1, 0.92]);
  const archiveMarkY = useTransform(smoothScrollY, [0, 700], [0, -120]);

  const handleNavigate = (section: string) => {
    setView(section);
  };

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -22, filter: 'blur(10px)' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-grow flex-col overflow-hidden"
    >
      <div
        ref={containerRef}
        className="custom-scrollbar relative z-10 w-full flex-grow overflow-y-auto scroll-smooth"
      >
        <section className="relative flex flex-col justify-start md:min-h-[94vh] md:justify-end overflow-hidden px-4 pb-8 pt-6 md:pt-24 md:px-12 md:pb-36 lg:px-16">
          <motion.div
            aria-hidden="true"
            style={shouldReduceMotion ? undefined : { y: archiveMarkY }}
            className="pointer-events-none absolute right-4 top-24 z-0 hidden font-serif text-[12vw] uppercase leading-none tracking-tighter text-zinc-900/35 lg:block"
          >
            Archive
          </motion.div>

          <motion.div
            style={shouldReduceMotion ? undefined : { opacity: heroOpacity, y: heroY, scale: heroScale }}
            className="relative z-20 w-full origin-bottom-left"
          >
            <EnhancedHeroName />
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="absolute bottom-24 right-6 hidden max-w-[18rem] border-l border-orange-400/25 pl-6 md:right-12 md:block lg:right-16"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 1.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-sans text-[11px] font-light uppercase leading-relaxed tracking-[0.28em] text-zinc-500">
              A magical digital archive of projects, memories, technology, photography, and personal stories.
            </p>
          </motion.div>

          <div className="hidden md:block">
            <ScrollIndicator />
          </div>
        </section>

        <CinematicImageReveal
          containerRef={containerRef}
          imageUrl="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
        />

        <ArchiveSection containerRef={containerRef}>
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.4fr] md:gap-24">
            <SectionHeading
              eyebrow="Identity // Personal Index"
              title="A quiet room for everything I am learning to build, see, and understand."
            />
            <div className="self-end">
              <motion.p
                className="font-serif text-2xl leading-[1.35] tracking-tight text-zinc-200 md:text-4xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                Computer Engineering student at IET DAVV, Indore. Based between code,
                cameras, Jammu &amp; Kashmir, and the small mysteries that make ordinary days worth documenting.
              </motion.p>
              <motion.p
                className="mt-8 max-w-2xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-base"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                This homepage is the threshold: part portfolio, part journal, part visual memory bank. Every
                section opens like a chapter in an archive that is still being written.
              </motion.p>
            </div>
          </div>
        </ArchiveSection>

        <QuoteReveal
          containerRef={containerRef}
          quote={QUOTES[0].text}
          author={QUOTES[0].author}
        />

        <ArchiveSection containerRef={containerRef} className="pb-16 md:pb-40">
          <div className="mb-10 flex flex-col justify-between gap-6 md:mb-24 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Gateways // Chapter Navigation"
              title="Choose a doorway into the archive."
              body="The main sections are no longer static cards. They are destinations: technical rooms, visual corridors, essays, collections, and work waiting behind the dark."
            />
            <motion.div
              className="hidden h-px flex-1 bg-gradient-to-r from-orange-400/30 via-zinc-700/25 to-transparent md:block"
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-6 md:gap-6 lg:gap-8">
            {GATEWAY_SECTIONS.map((section, index) => (
              <MagicalGateway
                key={section.id}
                label={section.label}
                title={section.title}
                description={section.description}
                image={section.image}
                index={index}
                featured={index === 0 || index === 3}
                onClick={() => handleNavigate(section.id)}
              />
            ))}
          </div>
        </ArchiveSection>

        <QuoteReveal
          containerRef={containerRef}
          quote={QUOTES[1].text}
          author={QUOTES[1].author}
        />

        <ArchiveSection containerRef={containerRef}>
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.5fr] md:gap-20">
            <SectionHeading
              eyebrow="Method // The Spellbook"
              title="Motion with restraint. Detail with purpose."
              body="The site should feel alive even when idle, but the movement stays slow, readable, and respectful of the editorial tone."
            />

            <div className="grid gap-6">
              {PRINCIPLES.map((item, index) => (
                <motion.article
                  key={item.title}
                  className="group relative overflow-hidden border border-zinc-800/45 bg-zinc-950/25 p-6 md:p-8"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.75, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400/65">
                    {item.label}
                  </p>
                  <h3 className="font-serif text-2xl tracking-tight text-zinc-100 md:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xl font-sans text-sm font-light leading-relaxed text-zinc-400">
                    {item.text}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </ArchiveSection>

        <QuoteReveal
          containerRef={containerRef}
          quote={QUOTES[2].text}
          author={QUOTES[2].author}
        />

        <ArchiveSection containerRef={containerRef} className="text-center">
          <motion.div
            className="mx-auto flex min-h-[46vh] max-w-4xl flex-col items-center justify-center"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.34em] text-orange-400/75">
              Begin // The Archive Is Open
            </p>
            <h2 className="font-serif text-5xl leading-[0.98] tracking-tighter text-zinc-100 md:text-7xl lg:text-8xl">
              Enter another chapter.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {GATEWAY_SECTIONS.slice(0, 3).map((section) => (
                <motion.button
                  key={section.id}
                  type="button"
                  onClick={() => handleNavigate(section.id)}
                  className="group relative overflow-hidden border border-zinc-800/70 px-5 py-3 font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-400 outline-none transition-colors duration-300 hover:border-orange-400/45 hover:text-zinc-100 focus-visible:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400/30"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-orange-400/70 transition-transform duration-500 group-hover:scale-x-100" />
                  {section.title}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </ArchiveSection>

        <Footer />
      </div>
    </motion.div>
  );
}
