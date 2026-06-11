import React from 'react';

interface StatusBadgeProps {
  state?: 'draft' | 'review' | 'published' | 'archived';
}

const STYLES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  published: 'bg-green-500/10 text-green-400 border-green-500/20',
  archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function StatusBadge({ state }: StatusBadgeProps) {
  if (!state) return null;
  return (
    <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${STYLES[state]}`}>
      {state}
    </span>
  );
}
