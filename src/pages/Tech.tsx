import { motion } from 'motion/react';
import { Newspaper, Star, FileCode2, Hammer, ArrowUpRight, Cpu, Terminal, Layers } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';

const techNews = [
  { title: "The rise of local-first software architecture", date: "2026.06.02", category: "Architecture" },
  { title: "WebAssembly outside the browser", date: "2026.05.28", category: "WASM" },
  { title: "React compiler and the end of manual memoization", date: "2026.05.15", category: "Frontend" },
  { title: "Transitioning toward memory-safe languages in systems", date: "2026.04.10", category: "Systems" }
];

const techILike = {
  "Ecosystems": ["TypeScript", "Rust", "Go"],
  "Frameworks": ["React & Next.js", "Tailwind CSS", "Framer Motion"],
  "Software": ["Neovim & Tmux", "Ghostty", "Raycast", "Linear"],
  "Hardware": ["HHKB Professional Hybrid Type-S", "M3 Max MacBook Pro", "Apple Studio Display"]
};

const techNotes = [
  { title: "Mental models for Rust lifetimes", tag: "Rust", preview: "Focus on who owns the data and how long the data needs to live before reaching out for references." },
  { title: "Building a performant React table", tag: "React", preview: "Virtualization is essential, but isolating state changes to avoid cascading renders is the real bottleneck." },
  { title: "Designing an event-driven system", tag: "Architecture", preview: "Events represent facts about the past, commands represent intent. Decoupling these simplifies boundaries." },
  { title: "Demystifying CSS subgrid", tag: "CSS", preview: "Aligning nested grids has historically been painful. Subgrid delegates track sizing to the parent, creating perfect alignment." }
];

const buildLogs = [
  { title: "Overlay Network Orchestrator", status: "Active", description: "Building a custom wireguard mesh topology manager for secure container networking across regions." },
  { title: "GPU-accelerated Terminal", status: "Paused", description: "Experimenting with WebGL and Rust to render thousands of glyphs at 120fps with minimal CPU overhead." },
  { title: "Edge Inference Node", status: "Completed", description: "Running optimized local models on edge hardware using quantized structures and memory mapping." }
];

export default function Tech() {
  return (
    <motion.div
      key="tech"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-24 mt-12 md:mt-24 max-w-3xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center"
          >
            <span className="w-2 h-2 bg-zinc-500 rounded-sm mr-3 animate-pulse opacity-50 block"></span>
            Digital Laboratory
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tight"
          >
            Tech.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed"
          >
            A structured index of ongoing technical explorations, architecture decisions, and engineering discoveries. Welcome to the workshop.
          </motion.div>
        </div>

        <div className="space-y-32 mb-32">
          {/* Tech News */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <Newspaper className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Tech News</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {techNews.map((news, idx) => (
                <div key={idx} className="group cursor-pointer border border-zinc-800/40 bg-zinc-900/20 p-6 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">{news.category}</span>
                    <span className="font-mono text-[9px] text-zinc-600">{news.date}</span>
                  </div>
                  <h3 className="font-sans text-lg text-zinc-300 group-hover:text-zinc-100 transition-colors leading-snug">{news.title}</h3>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Tech I Like */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <Star className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Tech I Like</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.entries(techILike).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                    {category === "Hardware" ? <Cpu className="w-3 h-3" /> : category === "Software" ? <Terminal className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                    {category}
                  </h3>
                  <ul className="space-y-4">
                    {items.map((item, idx) => (
                      <li key={idx} className="font-sans text-sm text-zinc-300 font-light flex items-center">
                         <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full mr-3 shrink-0"></span>
                         {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Tech Notes */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <FileCode2 className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Tech Notes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {techNotes.map((note, idx) => (
                <div key={idx} className="group cursor-pointer border border-zinc-800/40 bg-zinc-900/20 p-8 flex flex-col hover:border-zinc-700/50 transition-colors">
                   <div className="flex justify-between items-center mb-6">
                     <span className="px-2 py-1 bg-zinc-800/50 text-zinc-400 font-mono text-[9px] uppercase tracking-widest">{note.tag}</span>
                     <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100" />
                   </div>
                   <h3 className="font-serif text-xl text-zinc-200 mb-4">{note.title}</h3>
                   <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed mt-auto">{note.preview}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Build Logs */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <Hammer className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Build Logs</h2>
            </div>
            <div className="space-y-6">
              {buildLogs.map((log, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/30 pb-6 cursor-pointer gap-4 md:gap-8">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl text-zinc-300 group-hover:text-white transition-colors mb-2">{log.title}</h3>
                    <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed">{log.description}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${
                         log.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 
                         log.status === 'Completed' ? 'bg-zinc-500' : 'bg-amber-500'
                       }`}></span>
                       <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">{log.status}</span>
                    </div>
                    <span className="hidden md:flex font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-600 group-hover:text-zinc-300 transition-colors cursor-pointer">
                      Read Log
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
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
