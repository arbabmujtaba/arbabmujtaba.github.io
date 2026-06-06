import { motion } from 'motion/react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import { Disc3 } from 'lucide-react';

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
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500/80 mb-6"
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
            A personal archive of thoughts, late-night reflections, and milestones. Writing as a tool for figuring things out and finding stability in the noise of creating something real.
          </motion.div>
        </div>

        {/* Featured Story */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 cursor-pointer relative"
        >
          <div className="border border-zinc-800/80 bg-zinc-900/40 p-8 md:p-12 lg:p-16 relative overflow-hidden group">
             {/* Background Image / Texture overlay */}
             <div className="absolute inset-0 opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity duration-1000">
               <ParallaxImage 
                 src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80"
                 alt="Night sky"
                 className="w-full h-full object-cover"
               />
             </div>
             
             <div className="relative z-10 flex flex-col md:flex-row gap-12 lg:gap-24">
                <div className="md:w-3/5">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="font-sans text-[9px] uppercase tracking-widest text-orange-500/80">Featured Entry</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-500">Vol. 01</span>
                  </div>
                  
                  <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-zinc-100 leading-[1.15] mb-6">
                    Growing Up,
                    <br />
                    <span className="italic font-light text-zinc-400">Figuring Out</span>
                  </h3>
                  
                  <article className="space-y-6 font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed mb-10">
                    <p>
                      There's a strange dichotomy in being an engineering student. On one hand, you're constantly building systems—learning how to create structure, logic, and predictability out of thin air. On the other, your twenties feel like the exact opposite: unstructured, chaotic, and deeply unpredictable.
                    </p>
                    <p>
                      Late nights turn into early mornings, accompanied by glowing screens and the quiet hum of a compiler. It's in these quiet hours that the search for purpose feels the loudest. We are all trying to build a meaningful life, oscillating between the desire for unbridled freedom and the innate need for stability.
                    </p>
                    <p>
                      I think part of the journey is realizing that creating something real—whether it's software that outlives its author, or a life that feels authentic—requires abandoning the blueprint every once in a while. Music becomes the companion. Solitude becomes the workshop.
                    </p>
                  </article>
                  
                  <div className="flex items-center gap-6 mt-8 p-4 border border-zinc-800/50 bg-zinc-950/50 w-max rounded-sm">
                     <Disc3 className="w-8 h-8 text-orange-500/80 animate-[spin_5s_linear_infinite]" strokeWidth={1} />
                     <div className="flex flex-col">
                        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">On Rotation</span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif italic text-zinc-200">I Told You Things</span>
                          <span className="font-sans text-xs text-zinc-500">— Gracie Abrams</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="md:w-2/5 flex flex-col justify-end">
                   <div className="mt-8 md:mt-0 flex flex-col items-start lg:items-end w-full">
                     <ExploreArrow label="Read Full Essay" direction="down-right" />
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
                  <article key={entryIdx} className="group cursor-pointer flex flex-col md:flex-row justify-between md:items-center py-6 border-b border-zinc-800/30 hover:border-orange-500/30 transition-colors gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-500">{entry.date}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:block"></span>
                        <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-600 hidden sm:block">{entry.readTime} read</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl text-zinc-300 group-hover:text-white transition-colors duration-300">{entry.title}</h3>
                    </div>
                    <div className="mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-500 hidden md:block">
                      <ExploreArrow direction="right" label="Explore" />
                    </div>
                    {/* Mobile arrow */}
                    <div className="md:hidden mt-2">
                       <ExploreArrow direction="right" label="Explore" />
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
