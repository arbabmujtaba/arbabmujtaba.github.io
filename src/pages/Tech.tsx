import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Database, Server, Cpu, Cpu as Microchip, Network, Code2, Headphones, Activity, ArrowRight, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import EditButton from '../components/EditButton';
import { getTechEntries } from '../lib/cms';
import { TechEntry } from '../types';

const techILike = {
  "Ecosystems": ["TypeScript", "Java", "Python", "C++"],
  "Frameworks": ["React", "Express", "Node.js", "Swing"],
  "Systems": ["Linux", "MySQL", "MongoDB", "LoRaWAN"],
  "Domains": ["Networking", "DSP", "Audio Engineering", "AI"]
};

const experiments = [
  { title: "Kashmiri AI Assistant", tag: "Artificial Intelligence", preview: "Training experimental NLP models to interpret and generate conversational Kashmiri." },
  { title: "MoodMix Audio Space", tag: "Machine Learning", preview: "Curating playlists using ML models that analyze real-time spatial audio features." },
  { title: "Custom Linux Kernel Modules", tag: "Linux", preview: "Writing custom char device drivers to understand user-space to kernel-space context switching." },
  { title: "React State Reconciliation", tag: "React", preview: "Building a miniature clone of React's virtual DOM to study diffing algorithms." }
];

export default function Tech() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TechEntry | null>(null);

  // Load from Decap CMS
  const logs = useMemo(() => getTechEntries(), []);

  // Filter for tech news section dynamically based on category
  const techNews = useMemo(() => {
    return logs.slice(0, 4).map(l => ({
      title: l.title,
      date: new Date(l.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      category: l.category
    }));
  }, [logs]);

  const toggleLog = (slug: string) => {
    if (expandedLog === slug) {
      setExpandedLog(null);
    } else {
      setExpandedLog(slug);
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
        <div className="mb-32 mt-12 md:mt-32 max-w-4xl relative">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[8rem] md:text-[14rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
            TECH
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 relative z-10 flex items-center gap-4"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Tech</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif font-medium text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
          >
            Tech
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed relative z-10"
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
              {logs.map((log) => {
                const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: '2-digit', day: '2-digit'
                }).replace(/\//g, '.');

                return (
                  <div key={log.slug} className="relative border border-zinc-850 bg-zinc-900/10 overflow-hidden transition-colors hover:border-zinc-800/80">
                    <EditButton
                      item={{
                        type: 'tech',
                        slug: log.slug,
                        filePath: `/content/tech/${log.slug}.md`,
                        title: log.title,
                        data: {
                          title: log.title,
                          slug: log.slug,
                          date: log.date,
                          category: log.category,
                          coverImage: log.coverImage,
                          excerpt: log.excerpt,
                        },
                        body: log.body,
                      }}
                    />
                    <div 
                      onClick={() => toggleLog(log.slug)}
                      className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-6"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-sans text-[10px] uppercase tracking-widest text-orange-500">{log.category}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                          <span className="font-mono text-[10px] text-zinc-500">{formattedDate}</span>
                        </div>
                        <h3 className="font-serif text-2xl text-zinc-200 group-hover:text-white transition-colors">{log.title}</h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(log);
                          }}
                          className="font-sans text-[10px] uppercase tracking-widest border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 px-3 py-1.5 text-zinc-300 rounded-sm hover:border-orange-500/30 transition-all cursor-pointer"
                        >
                          Deep Read Link
                        </button>
                        <div className={`transform transition-transform duration-300 ${expandedLog === log.slug ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-5 h-5 text-zinc-500" />
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedLog === log.slug && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden border-t border-zinc-850"
                        >
                          <div className="p-6 md:p-8 bg-zinc-950/30">
                            <div className="mb-4">
                              <h4 className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Implementation Snapshot</h4>
                              <p className="font-sans text-sm lg:text-base text-zinc-400 font-light leading-relaxed">
                                {log.excerpt}
                              </p>
                            </div>
                            
                            <div className="mt-6">
                              <button 
                                onClick={() => setSelectedEntry(log)}
                                className="font-sans text-xs text-orange-500 hover:text-orange-400 font-semibold group flex items-center gap-1 cursor-pointer"
                              >
                                View full story detail and code diagrams
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
                <div key={idx} className="group border border-zinc-850 bg-zinc-900/10 p-8 flex flex-col hover:border-orange-500/20 transition-colors">
                   <div className="flex justify-between items-center mb-6">
                     <span className="px-3 py-1 border border-zinc-800 bg-zinc-950/50 text-orange-500/70 font-sans text-[9px] uppercase tracking-widest">{note.tag}</span>
                     <ArrowRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-300 transition-colors -rotate-45" />
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
                <h2 className="font-serif text-2xl text-zinc-200">Tech Logs</h2>
              </div>
              <div className="flex flex-col gap-4">
                {techNews.map((news, idx) => (
                  <div key={idx} className="border border-zinc-850 bg-zinc-900/10 p-5 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-500">{news.category}</span>
                      <span className="font-mono text-[9px] text-zinc-600">{news.date}</span>
                    </div>
                    <h3 className="font-sans text-sm md:text-base text-zinc-300 leading-relaxed">{news.title}</h3>
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

        <Footer />
      </div>

      {/* Dynamic Overlay detail */}
      <AnimatePresence>
        {selectedEntry && (
          <ContentModal 
            isOpen={!!selectedEntry}
            onClose={() => setSelectedEntry(null)}
            title={selectedEntry.title}
            category={selectedEntry.category}
            date={new Date(selectedEntry.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            excerpt={selectedEntry.excerpt}
            body={selectedEntry.body}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
