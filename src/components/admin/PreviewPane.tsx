/**
 * PreviewPane
 *
 * Iframe-based preview component for the admin editor.
 * Shows a server-rendered preview of the current section item.
 * Auto-refreshes when lastSaved timestamp changes.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Loader2, Eye, ExternalLink } from 'lucide-react';

interface PreviewPaneProps {
  /** The resolved preview URL (e.g., /preview/journal/my-post) */
  previewUrl: string;
  /** Timestamp of last successful save. Changing this triggers a reload. */
  lastSaved: number;
}

export default function PreviewPane({ previewUrl, lastSaved }: PreviewPaneProps) {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-refresh when lastSaved changes
  useEffect(() => {
    if (lastSaved > 0) {
      setLoading(true);
      setRefreshKey((k) => k + 1);
    }
  }, [lastSaved]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a09] border-l border-zinc-800">
      {/* Toolbar */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition-all cursor-pointer"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={refreshKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a09] z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Loading preview...
                  </span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={`preview-${refreshKey}`}
              title="Section Preview"
              src={`${previewUrl}?t=${refreshKey}`}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts"
              onLoad={handleLoad}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
