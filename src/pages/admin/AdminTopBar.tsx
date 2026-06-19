/**
 * AdminTopBar
 *
 * Global search input, deploy status badge, View Site link,
 * and back navigation to exit admin.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search, ExternalLink, ArrowLeft, Activity, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

interface DeployStatusInfo {
  currentStatus: 'idle' | 'building' | 'success' | 'failed';
  latestResult: 'success' | 'failed' | 'unknown';
}

interface AdminTopBarProps {
  onExitAdmin: () => void;
  onSearch: (query: string) => void;
}

export default function AdminTopBar({ onExitAdmin, onSearch }: AdminTopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [deployStatus, setDeployStatus] = useState<DeployStatusInfo | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/deploy/status');
        if (res.ok) {
          const data = await res.json();
          setDeployStatus({
            currentStatus: data.currentStatus,
            latestResult: data.latestResult,
          });
        }
      } catch {
        // Silently fail - deploy status is informational
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const getStatusIcon = () => {
    if (!deployStatus) return <Activity size={14} className="text-zinc-600" />;
    switch (deployStatus.currentStatus) {
      case 'building':
        return <Loader2 size={14} className="text-orange-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 size={14} className="text-green-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Activity size={14} className="text-zinc-500" />;
    }
  };

  const getStatusLabel = () => {
    if (!deployStatus) return 'Status';
    switch (deployStatus.currentStatus) {
      case 'building':
        return 'Building...';
      case 'success':
        return 'Live';
      case 'failed':
        return 'Failed';
      default:
        return deployStatus.latestResult === 'success' ? 'Live' : 'Idle';
    }
  };

  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0a0a09] flex items-center px-4 gap-4 shrink-0">
      {/* Back button */}
      <button
        onClick={onExitAdmin}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
        title="Exit Admin"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Global Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search content..."
          value={searchValue}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-900/50 border border-zinc-800 rounded text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Deploy Status */}
      <motion.div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 text-xs"
        whileHover={{ borderColor: 'rgb(113 113 122)' }}
      >
        {getStatusIcon()}
        <span className="text-zinc-400 font-mono">{getStatusLabel()}</span>
      </motion.div>

      {/* View Site */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-orange-500 transition-colors"
      >
        <ExternalLink size={14} />
        <span className="hidden sm:inline">View Site</span>
      </a>
    </header>
  );
}
