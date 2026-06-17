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
import { getHomeConfig } from '../lib/cms';
import { HomeConfigEntry } from '../types';

interface HomeProps {
  setView: (view: string) => void;
}

interface ArchiveSectionProps {
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

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

  // Load all home page config from CMS
  const homeConfig = getHomeConfig().filter(h => h.visible).sort((a, b) => a.order - b.order);
  const gatewaySections = homeConfig.filter(h => h.configType === 'gateway');
  const quotes = homeConfig.filter(h => h.configType === 'quote');
  const principles = homeConfig.filter(h => h.configType === 'principle');
  const profile = homeConfig.find(h => h.configType === 'profile');

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
              {profile?.description || 'A magical digital archive of projects, memories, technology, photography, and personal stories.'}
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
              eyebrow={profile?.label || "Identity // Personal Index"}
              title={profile?.title || "A quiet room for everything I am learning to build, see, and understand."}
            />
            <div className="self-end">
              <motion.p
                className="font-serif text-2xl leading-[1.35] tracking-tight text-zinc-200 md:text-4xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {profile?.description || "Computer Engineering student at IET DAVV, Indore. Based between code, cameras, Jammu & Kashmir, and the small mysteries that make ordinary days worth documenting."}
              </motion.p>
              <motion.p
                className="mt-8 max-w-2xl font-sans text-sm font-light leading-relaxed text-zinc-400 md:text-base"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                {profile?.body || "This homepage is the threshold: part portfolio, part journal, part visual memory bank. Every section opens like a chapter in an archive that is still being written."}
              </motion.p>
            </div>
          </div>
        </ArchiveSection>

        {quotes.length > 0 && (
          <QuoteReveal
            containerRef={containerRef}
            quote={quotes[0]?.title || 'Every project begins with curiosity.'}
            author={quotes[0]?.author || 'Archive Note 001'}
          />
        )}

        {gatewaySections.length > 0 && (
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
              {gatewaySections.map((section, index) => (
                <MagicalGateway
                  key={section.slug}
                  label={section.label || ''}
                  title={section.title}
                  description={section.description || ''}
                  image={section.image || ''}
                  index={index}
                  featured={index === 0 || index === 3}
                  onClick={() => handleNavigate(section.navTarget || section.slug.replace('gateway-', ''))}
                />
              ))}
            </div>
          </ArchiveSection>
        )}

        {quotes.length > 1 && (
          <QuoteReveal
            containerRef={containerRef}
            quote={quotes[1]?.title || 'Some stories are written. Others are captured.'}
            author={quotes[1]?.author || 'Archive Note 002'}
          />
        )}

        {principles.length > 0 && (
          <ArchiveSection containerRef={containerRef}>
            <div className="grid gap-10 md:grid-cols-[0.9fr_1.5fr] md:gap-20">
              <SectionHeading
                eyebrow="Method // The Spellbook"
                title="Motion with restraint. Detail with purpose."
                body="The site should feel alive even when idle, but the movement stays slow, readable, and respectful of the editorial tone."
              />

              <div className="grid gap-6">
                {principles.map((item, index) => (
                  <motion.article
                    key={item.slug}
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
                      {item.description}
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </ArchiveSection>
        )}

        {quotes.length > 2 && (
          <QuoteReveal
            containerRef={containerRef}
            quote={quotes[2]?.title || 'Technology becomes meaningful when it touches real lives.'}
            author={quotes[2]?.author || 'Archive Note 003'}
          />
        )}

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
              {gatewaySections.slice(0, 3).map((section) => (
                <motion.button
                  key={section.slug}
                  type="button"
                  onClick={() => handleNavigate(section.navTarget || section.slug.replace('gateway-', ''))}
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
