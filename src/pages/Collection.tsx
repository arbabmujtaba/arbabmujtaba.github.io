import { motion } from 'motion/react';
import { Monitor, Cpu, BookOpen, Music, Glasses, Layers, Disc3, Clock, Compass, Terminal, Code2 } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import Footer from '../components/Footer';

const timelineMilestones = [
  { year: "2024", title: "Scale & Architecture", desc: "Leading advanced projects in real-time interactions with Node.js and React. Deep diving into backend optimization." },
  { year: "2023", title: "DSP & Spatial Audio", desc: "Built a real-time DSP surround engine in C++. Discovered the intersection of programming and audio engineering." },
  { year: "2022", title: "Network Systems", desc: "Fell in love with networking protocols. Built a simulator in Python to understand packet transfers and topologies." },
  { year: "2021", title: "First Significant Build", desc: "Developed a Student Attendance Management System in Java. The moment software shifted from code to a real-world tool." },
  { year: "2019", title: "The Beginning", desc: "Wrote the first lines of code. Discovered that the screen is a canvas, and a keyboard is the brush." }
];

const uses = {
  "Favorite Technologies": ["React", "Node.js & Express", "C++", "Java", "Python"],
  "Favorite Software": ["Neovim & Tmux", "Ghostty", "Raycast", "Figma"],
  "Favorite Linux Tools": ["grep", "htop", "rsync", "sed & awk", "systemd"],
  "Favorite Gear": ["MacBook Pro", "HHKB Professional", "Sony A7III & Fuji X-T4", "Focusrite Scarlett"],
  "Favorite Setups": ["Single Ultrawide Monitor", "Blank Keycaps", "Warm Desk Lamp", "Notebook & Pen"]
};

const influences = [
  { name: "Less, but better", category: "Idea", desc: "Dieter Rams' design philosophy. Applied to engineering, photography, and the architecture of life." },
  { name: "The Pragmatic Programmer", category: "Book", desc: "Andrew Hunt & David Thomas. Fundamentally changed how I approach building robust systems." },
  { name: "In Praise of Shadows", category: "Book", desc: "Jun'ichirō Tanizaki. Understanding aesthetics, subtlety, and the beauty of analog imperfection." },
  { name: "The Pursuit of Quietness", category: "Idea", desc: "Finding stillness and clarity in an increasingly loud and connected world." }
];

const music = [
  { album: "I Told You Things", artist: "Gracie Abrams", year: "2023" },
  { album: "Good Riddance", artist: "Gracie Abrams", year: "2023" },
  { album: "Peripheral Vision", artist: "Turnover", year: "2015" },
  { album: "Selected Ambient Works", artist: "Aphex Twin", year: "1992" },
];

export default function Collection() {
  return (
    <motion.div
      key="collection"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-32 mt-12 md:mt-32 max-w-4xl relative">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[8rem] md:text-[14rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
            COLLECTION
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 relative z-10 flex items-center gap-4"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Collection</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif font-medium text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
          >
            Collection
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed relative z-10"
          >
            A personal museum archive. Documenting the timelines, tools, literature, and soundscapes that shape my engineering journey and creative output.
          </motion.div>
        </div>

        {/* Timeline Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 relative"
        >
          <div className="border-b border-zinc-800/80 pb-4 mb-16 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 01 — Journey</h2>
            <Clock className="w-4 h-4 text-orange-500/80" strokeWidth={1} />
          </div>

          <div className="relative border-l border-zinc-800/50 pl-8 md:pl-12 space-y-16 py-4 max-w-4xl">
            {timelineMilestones.map((milestone, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[37px] md:-left-[53px] top-1.5 w-3 h-3 rounded-full bg-zinc-950 border-2 border-zinc-700 group-hover:border-orange-500/80 transition-colors"></div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 mb-3">
                  <span className="font-mono text-sm md:text-base text-orange-500/80 shrink-0">{milestone.year}</span>
                  <h3 className="font-serif text-2xl md:text-3xl text-zinc-200">{milestone.title}</h3>
                </div>
                <p className="font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed md:ml-[4.5rem]">
                  {milestone.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 mb-32">
          {/* Uses & Gear Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 02 — Uses & Gear</h2>
              <Terminal className="w-4 h-4 text-orange-500/80" strokeWidth={1} />
            </div>

            <div className="space-y-12">
              {Object.entries(uses).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-serif italic text-xl text-zinc-300 mb-6 flex items-center gap-2">
                    {category}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    {items.map((item, idx) => (
                      <li key={idx} className="group flex items-baseline border-b border-zinc-800/30 pb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-orange-500/80 transition-colors mr-3 shrink-0"></span>
                        <span className="font-sans text-sm font-light text-zinc-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Ideas & Inspirations */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 03 — Inspirations</h2>
              <Compass className="w-4 h-4 text-orange-500/80" strokeWidth={1} />
            </div>

            <ul className="space-y-10">
              {influences.map((influence, idx) => (
                <li key={idx} className="group flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                     <span className="font-serif text-xl md:text-2xl text-zinc-200 group-hover:text-white transition-colors">{influence.name}</span>
                     <span className="font-sans text-[9px] uppercase tracking-widest text-orange-500/80 shrink-0 mt-2 ml-4 px-2 py-1 bg-orange-500/10 rounded-sm">{influence.category}</span>
                  </div>
                  <span className="font-sans text-sm text-zinc-400 font-light leading-relaxed">{influence.desc}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-16 bg-zinc-900/30 border border-zinc-800/50 p-6 md:p-8 flex flex-col md:flex-row items-start gap-6">
                <Layers className="w-5 h-5 text-orange-500/80 shrink-0 mt-1" strokeWidth={1} />
                <div>
                   <span className="block font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Curator's Note</span>
                   <p className="font-sans text-sm text-zinc-300 font-light leading-relaxed italic">
                     "We are generally the product of what we consume. Building a curated environment of high-quality inputs is essential for producing meaningful outputs."
                   </p>
                </div>
            </div>
          </motion.div>
        </div>


        {/* Audio Archive */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col relative max-w-4xl mb-32"
        >
          <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 04 — Music</h2>
            <Disc3 className="w-4 h-4 text-orange-500/80 animate-[spin_4s_linear_infinite]" strokeWidth={1} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {music.map((track, idx) => (
              <div key={idx} className="group cursor-pointer">
                  <div className="aspect-square bg-zinc-900 border border-zinc-800/50 mb-6 relative overflow-hidden group-hover:border-orange-500/40 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800/20 to-zinc-900"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-zinc-700/50 group-hover:scale-110 group-hover:border-orange-500/50 transition-all duration-700"></div>
                    </div>
                  </div>
                  <h3 className="font-serif text-lg text-zinc-200 mb-2 truncate" title={track.album}>{track.album}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs text-zinc-500 font-light truncate max-w-[70%]">{track.artist}</span>
                    <span className="font-mono text-[9px] text-zinc-600 shrink-0">{track.year}</span>
                  </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center mt-16 mb-24">
           <ExploreArrow label="Back to Top" direction="up" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </div>

        <Footer />
      </div>
    </motion.div>
  );
}

