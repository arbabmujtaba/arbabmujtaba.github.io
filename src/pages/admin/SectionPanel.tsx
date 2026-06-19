/**
 * SectionPanel
 *
 * Placeholder component that displays the active section's metadata.
 * Editor functionality will be implemented in a future phase.
 */

import { motion } from 'motion/react';
import { Layers, FileText, Folder, Info } from 'lucide-react';
import type { SectionDef } from '../../lib/sections';

interface SectionPanelProps {
  section: SectionDef;
}

export default function SectionPanel({ section }: SectionPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-zinc-600">{section.page}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-xs font-mono text-zinc-500">{section.id}</span>
          </div>
          <h1 className="font-serif text-2xl text-zinc-100">{section.title}</h1>
          {section.description && (
            <p className="text-sm text-zinc-500 mt-1">{section.description}</p>
          )}
        </div>

        {/* Section Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              {section.kind === 'singleton' ? (
                <FileText size={14} className="text-orange-500" />
              ) : (
                <Folder size={14} className="text-orange-500" />
              )}
              <span className="text-xs font-mono uppercase text-zinc-500">Kind</span>
            </div>
            <p className="text-sm text-zinc-200 capitalize">{section.kind}</p>
          </div>
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} className="text-orange-500" />
              <span className="text-xs font-mono uppercase text-zinc-500">Collection</span>
            </div>
            <p className="text-sm text-zinc-200">{section.collection}</p>
          </div>
        </div>

        {/* Fields Preview */}
        <div className="mb-8">
          <h2 className="text-sm font-mono uppercase text-zinc-500 mb-3">
            Fields ({section.fields.length})
          </h2>
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            {section.fields.map((field, idx) => (
              <div
                key={field.name}
                className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                  idx > 0 ? 'border-t border-zinc-800/50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200">{field.label}</span>
                  {field.required && (
                    <span className="text-[10px] text-orange-500/70">*</span>
                  )}
                </div>
                <span className="text-xs font-mono text-zinc-600">{field.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="flex items-start gap-3 border border-zinc-800 rounded-lg p-4 bg-zinc-900/20">
          <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-zinc-300">Editor coming in next phase</p>
            <p className="text-xs text-zinc-600 mt-1">
              Content editing, preview, and publishing will be available here soon.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
