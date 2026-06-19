/**
 * AdminSidebar
 *
 * Renders page groups with expandable section lists.
 * Supports search filtering and highlights the active section.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Camera, Folder, Cpu, BookOpen, Briefcase, Globe,
  ChevronRight, Search, Layers, Rocket,
} from 'lucide-react';
import type { SectionDef } from '../../lib/sections';

const PAGE_ICONS: Record<string, React.ReactNode> = {
  home: <Home size={16} />,
  photography: <Camera size={16} />,
  collection: <Folder size={16} />,
  tech: <Cpu size={16} />,
  journal: <BookOpen size={16} />,
  portfolio: <Briefcase size={16} />,
  site: <Globe size={16} />,
};

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  photography: 'Photography',
  collection: 'Collection',
  tech: 'Tech',
  journal: 'Journal',
  portfolio: 'Portfolio',
  site: 'Site / Global',
};

const PAGE_ORDER = ['home', 'photography', 'collection', 'tech', 'journal', 'portfolio', 'site'];

interface AdminSidebarProps {
  sections: SectionDef[];
  activeSection: string | null;
  onSelectSection: (id: string) => void;
  onNavigateDashboard: () => void;
  onOpenDeployment: () => void;
}

export default function AdminSidebar({
  sections,
  activeSection,
  onSelectSection,
  onNavigateDashboard,
  onOpenDeployment,
}: AdminSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(PAGE_ORDER));

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.page.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [sections, search]);

  const groupedByPage = useMemo(() => {
    const groups: Record<string, SectionDef[]> = {};
    for (const s of filteredSections) {
      const page = s.page.toLowerCase();
      if (!groups[page]) groups[page] = [];
      groups[page].push(s);
    }
    return groups;
  }, [filteredSections]);

  const togglePage = (page: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  return (
    <aside className="w-64 min-w-[16rem] h-full border-r border-zinc-800 bg-[#0a0a09] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <button
          onClick={onNavigateDashboard}
          className="font-serif text-lg tracking-tight text-zinc-100 hover:text-orange-500 transition-colors cursor-pointer"
        >
          CMS Admin
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter sections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Section Groups */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {PAGE_ORDER.filter((page) => groupedByPage[page]?.length).map((page) => (
          <div key={page} className="mb-1">
            {/* Page Header */}
            <button
              onClick={() => togglePage(page)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <motion.span
                animate={{ rotate: expandedPages.has(page) ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight size={12} />
              </motion.span>
              <span className="text-zinc-600">{PAGE_ICONS[page]}</span>
              <span>{PAGE_LABELS[page] || page}</span>
              <span className="ml-auto text-zinc-700 text-[10px]">
                {groupedByPage[page]?.length}
              </span>
            </button>

            {/* Section Items */}
            <AnimatePresence initial={false}>
              {expandedPages.has(page) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {groupedByPage[page]?.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => onSelectSection(section.id)}
                      className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-sm transition-colors ${
                        activeSection === section.id
                          ? 'text-orange-500 bg-orange-500/5 border-r-2 border-orange-500'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Layers size={12} className="shrink-0 opacity-50" />
                      <span className="truncate">{section.title}</span>
                      <span className="ml-auto text-[10px] font-mono text-zinc-600">
                        {section.kind === 'singleton' ? 'S' : 'C'}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-600">
            No sections match "{search}"
          </div>
        )}
      </nav>

      {/* Footer - Deployment */}
      <div className="border-t border-zinc-800 p-3">
        <button
          onClick={onOpenDeployment}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-orange-500 hover:bg-zinc-800/50 rounded transition-colors"
        >
          <Rocket size={14} />
          <span>Deployment</span>
        </button>
      </div>
    </aside>
  );
}
