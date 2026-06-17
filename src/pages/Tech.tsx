import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Microchip, Activity, Database, Code2, Server, Network, Headphones, ArrowRight, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import { getTechEntries, getFavoriteItems } from '../lib/cms';
import { TechEntry, FavoriteItem } from '../types';

const groupIconMap: Record<string, React.ReactNode> = {
  "Ecosystems": <Code2 className="w-3 h-3 text-orange-500/80" />,
  "Frameworks": <Server className="w-3 h-3 text-orange-500/80" />,
  "Systems": <Network className="w-3 h-3 text-orange-500/80" />,
  "Domains": <Headphones className="w-3 h-3 text-orange-500/80" />,
};

export default function Tech() {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TechEntry | null>(null);

  // Load from CMS
  const logs = useMemo(() => getTechEntries(), []);

  // Load and group "Things I Like" from favorites collection
  const techILikeItems = useMemo(() => {
    return getFavoriteItems()
      .filter(f => f.visible && f.category === "Things I Like")
      .sort((a, b) => a.order - b.order);
  }, []);

  const thingsILikeByGroup = useMemo(() => {
    return techILikeItems.reduce((acc, item) => {
      const group = item.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, FavoriteItem[]>);
  }, [techILikeItems]);

  // Load experiments from tech collection
  const experimentEntries = useMemo(() => {
    return getTechEntries()
      .filter(t => t.category === "Experiments")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  // Filter for tech news section dynamically based on category
  const techNews = useMemo(() => {
    return logs
      .filter(l => l.category !== "Experiments")
      .slice(0, 4)
      .map(l => ({
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
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-16 md:mb-24 lg:mb-32 mt-8 sm:mt-12 md:mt-32 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[3rem] sm:text-[5rem] md:text-[8rem] lg:text-[14rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
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
            className="font-serif font-medium text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
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

        <div className="space-y-16 md:space-y-24 lg:space-y-32 mb-16 md:mb-24 lg:mb-32">

          {/* Build Logs & Implementation Stories */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-[#0a0a09]/72 backdrop-blur-sm z-20 pt-10">
              <Terminal className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
              <h2 className="font-serif text-3xl text-zinc-200">Build Logs</h2>
            </div>

            <div className="space-y-6">
              {logs.map((log) => {
                const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: '2-digit', day: '2-digit'
                }).replace(/\//g, '.');

                return (
                  <div key={log.slug} className="border border-zinc-850 bg-zinc-900/10 overflow-hidden transition-colors hover:border-zinc-800/80">
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
          {experimentEntries.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col relative"
            >
              <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-6 mb-12 sticky top-0 bg-[#0a0a09]/72 backdrop-blur-sm z-20 pt-10">
                <Microchip className="w-5 h-5 text-orange-500/80" strokeWidth={1.5} />
                <h2 className="font-serif text-3xl text-zinc-200">Experiments & Linux Notes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {experimentEntries.map((note) => (
                  <div
                    key={note.slug}
                    onClick={() => setSelectedEntry(note)}
                    className="group border border-zinc-850 bg-zinc-900/10 p-8 flex flex-col hover:border-orange-500/20 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-3 py-1 border border-zinc-800 bg-zinc-950/50 text-orange-500/70 font-sans text-[9px] uppercase tracking-widest">{note.category}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-300 transition-colors -rotate-45" />
                    </div>
                    <h3 className="font-serif text-2xl text-zinc-200 mb-4">{note.title}</h3>
                    <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed mt-auto">{note.excerpt}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

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
            {Object.keys(thingsILikeByGroup).length > 0 && (
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
                  {Object.entries(thingsILikeByGroup).map(([group, items]) => (
                    <div key={group}>
                      <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
                        {groupIconMap[group] || <Database className="w-3 h-3 text-orange-500/80" />}
                        <span>{group}</span>
                      </h3>
                      <ul className="space-y-3">
                        {items.map((item) => (
                          <li key={item.slug} className="font-sans text-xs md:text-sm text-zinc-300 font-light flex items-center group">
                            <span className="w-1.5 h-1.5 bg-zinc-800 group-hover:bg-orange-500/80 transition-colors rounded-full mr-3 shrink-0"></span>
                            {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

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
