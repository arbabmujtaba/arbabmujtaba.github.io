import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import Hero from '../components/Hero';
import ScrollIndicator from '../components/ScrollIndicator';
import ExploreArrow from '../components/ExploreArrow';

interface HomeProps {
  setView: (view: string) => void;
  key?: string;
}

const StorySection = ({ children, containerRef, index }: { children: React.ReactNode, containerRef: React.RefObject<HTMLDivElement>, index: number }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ["start end", "center center"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const y = useTransform(smoothProgress, [0, 1], [150, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [0, 0.1, 1]);
  const scale = useTransform(smoothProgress, [0, 1], [0.95, 1]);

  return (
    <motion.div 
      ref={targetRef} 
      style={{ y, opacity, scale }}
      className="p-6 md:p-12 lg:p-16 relative z-20 bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-800/30"
    >
      {children}
    </motion.div>
  );
};

const CinematicReveal = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress: entranceProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ["start end", "center center"]
  });

  const smoothEntrance = useSpring(entranceProgress, {
    stiffness: 70, damping: 20, restDelta: 0.001
  });

  const scale = useTransform(smoothEntrance, [0, 1], [0.85, 1]);
  const opacity = useTransform(smoothEntrance, [0, 1], [0, 1]);

  const { scrollYProgress: parallaxProgress } = useScroll({
    target: targetRef,
    container: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothParallax = useSpring(parallaxProgress, {
    stiffness: 70, damping: 20, restDelta: 0.001
  });

  const imgScale = useTransform(smoothParallax, [0, 1], [1, 1.15]);
  const y = useTransform(smoothParallax, [0, 1], ["-10%", "10%"]);

  return (
    <div ref={targetRef} className="w-full relative z-20 py-12 md:py-24 px-6 md:px-12 lg:px-16 flex justify-center items-center pointer-events-none">
      <motion.div 
        style={{ scale, opacity }} 
        className="w-full h-[60vh] md:h-[85vh] overflow-hidden bg-zinc-950 border border-zinc-800/50 shadow-2xl shadow-black relative pointer-events-auto"
      >
        <motion.div style={{ y, scale: imgScale, height: '120%', top: '-10%', position: 'relative' }} className="w-full">
          <img 
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80" 
            alt="Atmospheric landscape"
            className="w-full h-full object-cover grayscale-[40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-zinc-950/30 mix-blend-overlay pointer-events-none" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function Home({ setView }: HomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll({ 
    container: containerRef 
  });

  const smoothScrollY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroOpacity = useTransform(smoothScrollY, [0, 300], [1, 0]);
  const heroY = useTransform(smoothScrollY, [0, 400], [0, 150]);
  const heroScale = useTransform(smoothScrollY, [0, 400], [1, 0.9]);
  const indicatorOpacity = useTransform(smoothScrollY, [0, 100], [1, 0]);

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div 
        ref={containerRef}
        className="flex-grow overflow-y-auto scroll-smooth custom-scrollbar relative z-10 w-full pt-0"
      >
        
        {/* Full-height Hero Section */}
        <div className="min-h-[85vh] flex flex-col justify-end p-6 md:p-12 lg:p-16 pb-24 md:pb-32 relative">
          <motion.div style={{ opacity: heroOpacity, y: heroY, scale: heroScale }} className="w-full origin-bottom-left">
            <Hero />
          </motion.div>
          <motion.div style={{ opacity: indicatorOpacity }} className="absolute bottom-0 left-0 w-full pointer-events-none">
            <ScrollIndicator />
          </motion.div>
        </div>

        {/* Cinematic Reveal Component */}
        <CinematicReveal containerRef={containerRef} />

        {/* Storytelling Section 1: Philosophy */}
        <StorySection containerRef={containerRef} index={0}>
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 py-12 md:py-24">
            <div className="md:w-1/3">
               <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">Philosophy</h2>
               <span className="block w-8 h-[1px] bg-zinc-700"></span>
            </div>
            <div className="md:w-2/3 max-w-2xl">
               <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-zinc-200 leading-[1.4] mb-8">
                 I believe in building software that outlasts the hype cycle. Tools that feel responsive, systems that scale predictably, and interfaces that respect the user's attention.
               </p>
               <p className="font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed">
                 My work exists at the intersection of systems engineering and digital craft. Through a blend of rigorous backend architecture and meticulous frontend execution, I create digital environments that are as robust as they are refined.
               </p>
            </div>
          </div>
        </StorySection>

        {/* Section 2: Selected Work & Journal Teaser */}
        <StorySection containerRef={containerRef} index={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 py-12 md:py-24">
            
            <div className="group cursor-pointer flex flex-col" onClick={() => setView('portfolio')}>
               <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800/50 mb-8 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent group-hover:scale-105 transition-transform duration-1000"></div>
                 <div className="absolute bottom-6 left-6 font-mono text-[10px] text-zinc-500 tracking-widest">01 // VISUAL_ENGINE</div>
               </div>
               <h3 className="font-serif text-3xl text-zinc-200 mb-4 group-hover:text-white transition-colors">Portfolio</h3>
               <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed mb-6 max-w-sm">
                 A curated selection of technical work. Distributed systems, web architectures, and interactive experiences.
               </p>
               <ExploreArrow label="Explore Work" direction="up-right" onClick={() => setView('portfolio')} />
            </div>

            <div className="group cursor-pointer flex flex-col mt-0 md:mt-24" onClick={() => setView('journal')}>
               <div className="aspect-[3/4] bg-zinc-900 border border-zinc-800/50 mb-8 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-zinc-900/50 group-hover:opacity-80 transition-opacity duration-1000"></div>
                 <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif italic text-4xl text-zinc-800 blur-[0.5px]">Journal</span>
               </div>
               <h3 className="font-serif text-3xl text-zinc-200 mb-4 group-hover:text-white transition-colors">Written Thoughts</h3>
               <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed mb-6 max-w-sm">
                 Essays, technical notes, and observations. Documenting the learning process and architectural decisions.
               </p>
               <ExploreArrow label="Read Entries" direction="up-right" onClick={() => setView('journal')} />
            </div>

          </div>
        </StorySection>

        {/* Section 3: Lab & Camera */}
        <StorySection containerRef={containerRef} index={2}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 py-12 md:py-24">
            
            <div className="md:col-span-5 flex flex-col justify-center">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4">Laboratory</h2>
              <h3 className="font-serif text-4xl text-zinc-200 mb-6 font-light">The Workshop.</h3>
              <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed mb-10">
                A structured index of ongoing technical explorations, experiments, and unfinished side-projects. This is where I go to break things and understand how they work under the hood.
              </p>
              <ExploreArrow label="Enter Lab" direction="up-right" onClick={() => setView('tech')} />
            </div>

            <div className="md:col-span-7 group cursor-pointer relative" onClick={() => setView('photography')}>
              <div className="aspect-[16/9] bg-zinc-900 border border-zinc-800/50 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80" 
                  alt="Camera lens" 
                  className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-[50%] transition-all duration-1000 scale-105 group-hover:scale-100"
                />
              </div>
              <div className="absolute top-6 left-6 text-white/80">
                <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-300 drop-shadow-md">Photography</h2>
                <h3 className="font-serif text-2xl mt-1 drop-shadow-md">The Archive</h3>
              </div>
            </div>

          </div>
        </StorySection>

        {/* Section 4: Collection */}
        <StorySection containerRef={containerRef} index={3}>
          <div className="text-center group cursor-pointer flex flex-col items-center justify-center py-12 md:py-32" onClick={() => setView('collection')}>
             <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 block">Ongoing</span>
             <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-300 mb-12 italic group-hover:text-white transition-colors">The Collection</h3>
             <ExploreArrow label="View Archive" direction="right" onClick={() => setView('collection')} />
          </div>
        </StorySection>

        {/* Optional trailing space so the last element can cleanly slide to center */}
        <div className="h-[20vh] w-full" />

      </div>
    </motion.div>
  );
}
