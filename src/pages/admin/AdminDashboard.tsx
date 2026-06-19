/**
 * AdminDashboard
 *
 * Landing view showing overview cards (total content count, sections count,
 * recent edits) and quick links to each page's sections.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Layers, FileText, Home, Camera, Folder, Cpu, BookOpen, Briefcase, Globe,
} from 'lucide-react';
import type { SectionDef } from '../../lib/sections';

const PAGE_ICONS: Record<string, React.ReactNode> = {
  home: <Home size={18} />,
  photography: <Camera size={18} />,
  collection: <Folder size={18} />,
  tech: <Cpu size={18} />,
  journal: <BookOpen size={18} />,
  portfolio: <Briefcase size={18} />,
  site: <Globe size={18} />,
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

interface AdminDashboardProps {
  sections: SectionDef[];
  onSelectSection: (id: string) => void;
}

export default function AdminDashboard({ sections, onSelectSection }: AdminDashboardProps) {
  const groupedByPage = useMemo(() => {
    const groups: Record<string, SectionDef[]> = {};
    for (const s of sections) {
      const page = s.page.toLowerCase();
      if (!groups[page]) groups[page] = [];
      groups[page].push(s);
    }
    return groups;
  }, [sections]);

  const singletonCount = sections.filter((s) => s.kind === 'singleton').length;
  const collectionCount = sections.filter((s) => s.kind === 'collection').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl text-zinc-100 mb-1">Dashboard</h1>
          <p className="text-sm text-zinc-500">Manage your site content sections</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} className="text-orange-500" />
              <span className="text-xs font-mono uppercase text-zinc-500">Sections</span>
            </div>
            <p className="text-2xl font-serif text-zinc-100">{sections.length}</p>
          </div>
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-orange-500" />
              <span className="text-xs font-mono uppercase text-zinc-500">Singletons</span>
            </div>
            <p className="text-2xl font-serif text-zinc-100">{singletonCount}</p>
          </div>
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Folder size={16} className="text-orange-500" />
              <span className="text-xs font-mono uppercase text-zinc-500">Collections</span>
            </div>
            <p className="text-2xl font-serif text-zinc-100">{collectionCount}</p>
          </div>
        </div>

        {/* Page Quick Links */}
        <div className="mb-6">
          <h2 className="font-serif text-lg text-zinc-200 mb-4">Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAGE_ORDER.filter((page) => groupedByPage[page]?.length).map((page) => (
              <motion.div
                key={page}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  const first = groupedByPage[page]?.[0];
                  if (first) onSelectSection(first.id);
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-zinc-500 group-hover:text-orange-500 transition-colors">
                    {PAGE_ICONS[page]}
                  </span>
                  <span className="font-serif text-zinc-200">{PAGE_LABELS[page] || page}</span>
                </div>
                <div className="space-y-1">
                  {groupedByPage[page]?.map((section) => (
                    <button
                      key={section.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSection(section.id);
                      }}
                      className="block w-full text-left text-xs text-zinc-500 hover:text-orange-500 transition-colors pl-1 truncate"
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
