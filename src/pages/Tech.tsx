import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Database, Server, Cpu, Cpu as Microchip, Network, Code2, Headphones, Activity, ArrowRight, ChevronDown } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';

const techNews = [
  { title: "The rise of local-first software architecture", date: "2026.06.02", category: "Architecture" },
  { title: "React compiler and the end of manual memoization", date: "2026.05.15", category: "React" },
  { title: "Transitioning toward memory-safe languages in systems", date: "2026.04.10", category: "Systems" },
  { title: "Advancements in LLM context windows", date: "2026.03.22", category: "Artificial Intelligence" }
];

const techILike = {
  "Ecosystems": ["TypeScript", "Java", "Python", "C++"],
  "Frameworks": ["React", "Express", "Node.js", "Swing"],
  "Systems": ["Linux", "MySQL", "MongoDB", "LoRaWAN"],
  "Domains": ["Networking", "DSP", "Audio Engineering", "AI"]
};

const buildLogs = [
  {
    id: "log-1",
    title: "Simulating Network Topologies",
    category: "Networking",
    tags: ["Python", "Networking", "Systems"],
    status: "Active",
    date: "2026.05.10",
    story: "Building a custom network simulation tool to model packet transfers, network topologies, and routing algorithms. The core challenge was implementing a reliable transmission protocol over an unreliable simulated medium without bottlenecking the main execution thread.",
    diagram: `
  [Node A] --(Simulated Link)--> [Router] --(Lossy Medium)--> [Node B]
     |                              |                            |
     |---[ Buffer ]                 |---[ Routing Table ]        |---[ Reassembly ]
     |---[ Retransmission ]         |---[ Congestion Ctrl]       |---[ ACK Queue ]
    `
  },
  {
    id: "log-2",
    title: "Real-time DSP Surround Engine",
    category: "Audio Engineering",
    tags: ["C++", "DSP", "Spatial Audio"],
    status: "Completed",
    date: "2026.03.05",
    story: "An exploration into processing digital signals using C++ to simulate spatial surround sound environments. We had to dig deep into Fast Fourier Transforms (FFT) and Head-Related Transfer Functions (HRTF) to create a convincing spatial illusion using just stereo headphones.",
    diagram: `
   [Input Signal] ----> [ FFT ] ----> [ HRTF Convolution ] ----> [ IFFT ] ----> [ Output L/R ]
                          |                     ^                                  ^
                          |                     |                                  |
                          +---> [ Analyzer ] ---+                                  |
                                                                                   |
   [Spatial Metadata] -------------------------------------------------------------+
    `
  },
  {
    id: "log-3",
    title: "Java Swing Persistence Layer",
    category: "Systems",
    tags: ["Java", "MySQL", "Swing"],
    status: "Archived",
    date: "2025.11.20",
    story: "Architecting a desktop application for student attendance. The goal was to build a robust GUI using Java Swing while maintaining a highly normalized MySQL database structure. Implementing an event-driven architecture decoupled the UI from the database transactions.",
    diagram: `
  [ Swing GUI ] <---> [ Action Listeners ] <---> [ Service Layer ]
                                                        |
                                                        v
  [ MySQL DB ]  <------------------------------> [ JDBC DAO Layer ]
    `
  },
  {
    id: "log-4",
    title: "Event Loop Optimizations",
    category: "Programming",
    tags: ["Node.js", "Express", "Backend"],
    status: "Active",
    date: "2026.02.14",
    story: "Addressing event loop blockage in heavy REST APIs. By offloading complex data transformations and machine learning inference tasks to worker threads, we managed to stabilize the latency for concurrent requests.",
    diagram: `
  [ Main Thread (Event Loop) ] ---> [ Task Route ] ---> | Non-Blocking | ---> [ Response ]
        |
        +-- (Heavy Task) --> [ Worker Thread Pool ]
                                   |
                             [ Computation ]
                                   |
        <----- (Result) -----------+
    `
  }
];

const experiments = [
  { title: "Kashmiri AI Assistant", tag: "Artificial Intelligence", preview: "Training experimental NLP models to interpret and generate conversational Kashmiri." },
  { title: "MoodMix Audio Space", tag: "Machine Learning", preview: "Curating playlists using ML models that analyze real-time spatial audio features." },
  { title: "Custom Linux Kernel Modules", tag: "Linux", preview: "Writing custom char device drivers to understand user-space to kernel-space context switching." },
  { title: "React State Reconciliation", tag: "React", preview: "Building a miniature clone of React's virtual DOM to study diffing algorithms." }
];

export default function Tech() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const toggleLog = (id: string) => {
    if (expandedLog === id) {
      setExpandedLog(null);
    } else {
      setExpandedLog(id);
    }
  };

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
        
        {/* Header Section */}
        <div className="mb-24 mt-12 md:mt-24 max-w-3xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500/80 mb-6 flex items-center"
          >
            Things I'm Exploring
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
            A digital laboratory, engineering notebook, and technical archive. Documenting experiments, systems, and implementation stories.
          </motion.div>
        </div>

        <div className="space-y-32 mb-32">
          
          {/* Build Logs & Implementation Stories */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <Terminal className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Build Logs</h2>
            </div>
            
            <div className="space-y-6">
              {buildLogs.map((log) => (
                <div key={log.id} className="border border-zinc-800/40 bg-zinc-900/20 overflow-hidden transition-colors hover:border-zinc-700/50">
                  <div 
                    onClick={() => toggleLog(log.id)}
                    className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-sans text-[10px] uppercase tracking-widest text-orange-500/80">{log.category}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span className="font-mono text-[10px] text-zinc-500">{log.date}</span>
                      </div>
                      <h3 className="font-serif text-2xl text-zinc-200">{log.title}</h3>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${
                           log.status === 'Active' ? 'bg-orange-500 animate-pulse' : 
                           log.status === 'Completed' ? 'bg-zinc-500' : 'bg-zinc-700'
                         }`}></span>
                         <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400">{log.status}</span>
                      </div>
                      <div className={`transform transition-transform duration-300 ${expandedLog === log.id ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedLog === log.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-zinc-800/40"
                      >
                        <div className="p-6 md:p-8 bg-zinc-950/50">
                          <div className="mb-8">
                            <h4 className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Implementation Story</h4>
                            <p className="font-sans text-sm lg:text-base text-zinc-400 font-light leading-relaxed">
                              {log.story}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-4">System Diagram</h4>
                            <div className="p-6 bg-zinc-900 border border-zinc-800/50 overflow-x-auto custom-scrollbar">
                              <pre className="font-mono text-[10px] sm:text-xs text-orange-500/70 leading-relaxed">
                                {log.diagram}
                              </pre>
                            </div>
                          </div>
                          
                          <div className="mt-8 flex flex-wrap gap-3">
                            {log.tags.map(tag => (
                              <span key={tag} className="font-sans text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 px-3 py-1 bg-zinc-900/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Experiments & Notes */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <Microchip className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Experiments & Linux Notes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {experiments.map((note, idx) => (
                <div key={idx} className="group cursor-pointer border border-zinc-800/40 bg-zinc-900/20 p-8 flex flex-col hover:border-orange-500/30 transition-colors">
                   <div className="flex justify-between items-center mb-6">
                     <span className="px-3 py-1 border border-zinc-800 bg-zinc-950/50 text-orange-500/70 font-sans text-[9px] uppercase tracking-widest">{note.tag}</span>
                     <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100 group-hover:-rotate-45" />
                   </div>
                   <h3 className="font-serif text-2xl text-zinc-200 mb-4">{note.title}</h3>
                   <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed mt-auto">{note.preview}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Tech News & Things I Like Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Tech News */}
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-8">
                <Activity className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
                <h2 className="font-serif text-2xl text-zinc-200">Tech News</h2>
              </div>
              <div className="flex flex-col gap-4">
                {techNews.map((news, idx) => (
                  <div key={idx} className="group cursor-pointer border border-zinc-800/40 bg-zinc-900/10 p-5 hover:bg-zinc-900/40 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-500">{news.category}</span>
                      <span className="font-mono text-[9px] text-zinc-600">{news.date}</span>
                    </div>
                    <h3 className="font-sans text-sm md:text-base text-zinc-300 group-hover:text-zinc-100 transition-colors leading-relaxed">{news.title}</h3>
                  </div>
                ))}
              </div>
            </motion.section>

             {/* Things I Like */}
             <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-8">
                <Database className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
                <h2 className="font-serif text-2xl text-zinc-200">Things I Like</h2>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {Object.entries(techILike).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
                       {category === 'Ecosystems' && <Code2 className="w-3 h-3 text-orange-500/80" />}
                       {category === 'Frameworks' && <Server className="w-3 h-3 text-orange-500/80" />}
                       {category === 'Systems' && <Network className="w-3 h-3 text-orange-500/80" />}
                       {category === 'Domains' && <Headphones className="w-3 h-3 text-orange-500/80" />}
                      <span>{category}</span>
                    </h3>
                    <ul className="space-y-3">
                      {items.map((item, idx) => (
                        <li key={idx} className="font-sans text-xs md:text-sm text-zinc-300 font-light flex items-center group">
                           <span className="w-1.5 h-1.5 bg-zinc-800 group-hover:bg-orange-500/80 transition-colors rounded-full mr-3 shrink-0"></span>
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>

        </div>

        {/* Footer spacing */}
        <div className="h-16" />

      </div>
    </motion.div>
  );
}

