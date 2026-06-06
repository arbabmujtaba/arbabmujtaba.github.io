import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';

const journalSections = [
  {
    title: "Life",
    description: "Personal experiences, daily observations, and reflections on the passage of time.",
    entries: [
      { title: "The Art of Slowing Down", date: "12 Oct 2024", readTime: "5 min" },
      { title: "A Return to Basics", date: "04 May 2023", readTime: "8 min" },
    ]
  },
  {
    title: "People",
    description: "Stories about meaningful people, conversations, and the impact of relationships.",
    entries: [
      { title: "Coffee with an Old Friend", date: "18 Aug 2024", readTime: "4 min" },
      { title: "Mentorship and Growth", date: "22 Feb 2024", readTime: "6 min" },
    ]
  },
  {
    title: "Travel",
    description: "Trips, places, memories, and observations from wandering.",
    entries: [
      { title: "Coffee, Code, and Tokyo", date: "28 Sep 2024", readTime: "8 min" },
      { title: "Autumn in Kyoto", date: "05 Nov 2023", readTime: "12 min" },
    ]
  },
  {
    title: "Thoughts",
    description: "Ideas, reflections, and lessons learned through building and breaking things.",
    entries: [
      { title: "Designing for Durability", date: "14 Aug 2024", readTime: "6 min" },
      { title: "The Value of Deep Work", date: "10 Jan 2024", readTime: "7 min" },
    ]
  },
  {
    title: "Milestones",
    description: "Important moments, achievements, and turning points in the journey.",
    entries: [
      { title: "Launching the New Architecture", date: "01 Dec 2024", readTime: "5 min" },
      { title: "One Year Solo", date: "15 Jul 2023", readTime: "10 min" },
    ]
  }
];

export default function Journal() {
  return (
    <motion.div
      key="journal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-24 mt-12 md:mt-24 max-w-3xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6"
          >
            Things I've Lived
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tight"
          >
            Journal.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed"
          >
            A collection of essays, travelogues, and reflections. Writing as a tool for thinking, documenting the space between lines of code and quiet moments.
          </motion.div>
        </div>

        {/* Featured Story */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 group cursor-pointer"
        >
          <div className="border-b border-zinc-800/80 pb-4 mb-10">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Featured Story</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center">
            <div className="col-span-1 lg:col-span-3 order-2 lg:order-1 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-600">Travel</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-600">Nov 2024</span>
              </div>
              <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-100 mb-8 leading-[1.1] group-hover:text-zinc-300 transition-colors duration-500">
                The Architecture of Silence
              </h3>
              <p className="font-sans text-zinc-400 text-sm md:text-base font-light leading-relaxed mb-10 max-w-xl">
                Exploring the relationship between spatial design and mental clarity in traditional Japanese architecture. A reflection on finding quietness in a loud world.
              </p>
              <div>
                <ExploreArrow label="Read Essay" direction="up-right" />
              </div>
            </div>
            <div className="col-span-1 lg:col-span-2 order-1 lg:order-2">
              <div className="aspect-[3/4] bg-zinc-900 border border-zinc-800/50 relative overflow-hidden group-hover:border-zinc-700/80 transition-colors duration-700">
                <ParallaxImage 
                   src="https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=800&q=80" 
                   alt="Japanese Architecture" 
                   className="w-full h-full opacity-60 block mix-blend-screen"
                   imageClassName="grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-30 z-20">
                  <span className="font-serif italic text-zinc-700 text-2xl font-light scale-150 rotate-90 blur-[1px]">Silence</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Journal Sections */}
        <div className="space-y-32 mb-32">
          {journalSections.map((section, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-zinc-800/80 pt-12"
            >
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <h2 className="font-serif text-3xl md:text-4xl text-zinc-200 mb-2">{section.title}</h2>
                  <p className="font-sans text-sm text-zinc-400 font-light max-w-sm">{section.description}</p>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 mt-8 hidden lg:block">
                    {section.entries.length} Entries
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4 md:space-y-8">
                {section.entries.map((entry, entryIdx) => (
                  <article key={entryIdx} className="group cursor-pointer flex flex-col md:flex-row justify-between md:items-center py-6 border-b border-zinc-800/30 hover:border-zinc-700 transition-colors gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-500">{entry.date}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:block"></span>
                        <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-600 hidden sm:block">{entry.readTime} read</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl text-zinc-300 group-hover:text-white transition-colors duration-300">{entry.title}</h3>
                    </div>
                    <div className="mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-500 hidden md:block">
                      <ExploreArrow direction="right" label="Read Entry" />
                    </div>
                    {/* Mobile arrow */}
                    <div className="md:hidden mt-2">
                       <ExploreArrow direction="right" label="Read Entry" />
                    </div>
                  </article>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="flex justify-center mt-16 mb-24">
           <ExploreArrow label="Explore Deeper" direction="down" />
        </div>

        {/* Footer spacing */}
        <div className="h-16" />

      </div>
    </motion.div>
  );
}
