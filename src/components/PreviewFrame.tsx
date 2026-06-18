/**
 * PreviewFrame
 *
 * Responsive content preview with device viewport toggles.
 * Uses an iframe pointing to /preview/:collection/:slug for
 * production-like rendering with actual site CSS.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Monitor, Tablet, Smartphone, Loader2, RefreshCw, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeImagePath } from '../lib/image';

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_CONFIGS: Record<ViewportMode, { width: number; label: string }> = {
  desktop: { width: 1200, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
};

interface PreviewFrameProps {
  collection: string;
  slug: string;
  /** Live body override: when provided, renders a client-side srcdoc instead of the saved content route */
  liveContent?: {
    body: string;
    frontmatter: Record<string, any>;
  } | null;
}

export default function PreviewFrame({ collection, slug, liveContent }: PreviewFrameProps) {
  const [mode, setMode] = useState<ViewportMode>('desktop');
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const [srcdoc, setSrcdoc] = useState<string>('');

  // Available space inside the scroll canvas (content box, excluding padding).
  // Used to scale the device viewport so the *full* logical layout (e.g. a
  // 1200px desktop) fits the pane instead of being clamped to half the screen
  // — which previously left the dark hero/cover dominating the visible area.
  const canvasRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const style = window.getComputedStyle(el);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setAvail({
        width: Math.max(0, el.clientWidth - padX),
        height: Math.max(0, el.clientHeight - padY),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const config = VIEWPORT_CONFIGS[mode];

  // Scale the device frame down to fit the available width (never up past 1:1).
  const scale = avail.width > 0 ? Math.min(1, avail.width / config.width) : 1;
  // The unscaled frame height is chosen so that, once scaled, it exactly fills
  // the available canvas height. Falls back to a sane default before measuring.
  const frameHeight = avail.height > 0 ? Math.max(400, avail.height / scale) : 400;

  // Build live srcdoc when liveContent changes
  const buildLiveSrcdoc = useCallback((body: string, frontmatter: Record<string, any>) => {
    const title = frontmatter.title || 'Untitled';
    const date = frontmatter.date || '';
    const category = frontmatter.category || '';
    const rawCover = frontmatter.coverImage || frontmatter.projectImage || '';
    const coverImage = normalizeImagePath(rawCover);

    // Simple markdown-to-HTML conversion for live preview (basic)
    const htmlBody = body
      .replace(/^# (.*$)/gim, '<h1 class="font-serif text-3xl text-zinc-200 font-medium tracking-tight mb-6">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="font-serif text-2xl text-zinc-300 font-medium tracking-tight mt-8 mb-4">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="font-serif text-xl text-zinc-300 font-medium mt-6 mb-3">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-zinc-300">$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-6 mb-4 space-y-1 text-zinc-350">$&</ul>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-950 border border-zinc-900 p-4 rounded overflow-x-auto text-xs font-mono text-zinc-300 mb-4">$1</pre>')
      .replace(/`(.*?)`/g, '<code class="bg-zinc-900 px-1.5 py-0.5 rounded text-orange-300 text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-500/80 hover:text-orange-400 underline underline-offset-2">$1</a>')
      .replace(/\n{2,}/g, '</p><p class="text-zinc-350 leading-relaxed mb-4">')
      .replace(/^(.+)$/gim, '<p class="text-zinc-350 leading-relaxed mb-4">$1</p>');

    const coverHtml = coverImage
      ? `<div class="relative aspect-[16/9] w-full overflow-hidden border border-zinc-900 bg-zinc-950 mb-10">
           <img src="${coverImage}" alt="${title}" class="w-full h-full object-cover grayscale-[15%]" referrerPolicy="no-referrer" onerror="this.style.display='none'" />
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview — ${title}</title>
  <link rel="stylesheet" href="/src/index.css">
</head>
<body class="bg-[#0d0d0c] text-zinc-100">
  <div class="min-h-screen bg-[#0d0d0c] text-zinc-100 p-6 md:p-12 lg:p-16 space-y-12 max-w-4xl mx-auto">
    ${coverHtml}
    <div class="flex items-center gap-4">
      ${category ? `<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded">${category}</span>` : ''}
      ${date ? `<span class="font-sans text-[10px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">${date}</span>` : ''}
    </div>
    <div class="space-y-6">
      <h1 class="font-serif text-3xl md:text-5xl lg:text-6xl text-zinc-100 tracking-tight leading-[1.1]">${title}</h1>
    </div>
    <div class="markdown-body pt-4 border-t border-zinc-900">
      ${htmlBody}
    </div>
  </div>
  <script>window.addEventListener('DOMContentLoaded', () => parent.postMessage({type:'preview-loaded'}, '*'));</script>
</body>
</html>`;
  }, []);

  // Generate srcdoc based on mode
  useEffect(() => {
    if (liveContent) {
      const doc = buildLiveSrcdoc(liveContent.body, liveContent.frontmatter);
      setSrcdoc(doc);
      setLoading(false);
    }
  }, [liveContent, buildLiveSrcdoc]);

  const handleRefresh = () => {
    setLoading(true);
    setKey(k => k + 1);
    setTimeout(() => setLoading(false), 500);
  };

  const handleModeChange = (m: ViewportMode) => {
    setMode(m);
    handleRefresh();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a09]">
      {/* Device Toolbar */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            {liveContent ? 'Live Preview' : 'Production Preview'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((m) => {
            const Icon = m === 'desktop' ? Monitor : m === 'tablet' ? Tablet : Smartphone;
            return (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-2.5 py-1.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === m
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-zinc-500 hover:text-zinc-200 border border-transparent hover:bg-zinc-900'
                }`}
                title={VIEWPORT_CONFIGS[m].label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-sans text-[10px] uppercase tracking-wider hidden sm:block">{VIEWPORT_CONFIGS[m].label}</span>
              </button>
            );
          })}

          <button
            onClick={handleRefresh}
            className="ml-2 p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-sm transition-all cursor-pointer"
            title="Refresh Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
          {config.width}px
        </div>
      </div>

      {/* Viewport Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto bg-zinc-950/30 flex justify-center items-start p-4 custom-scrollbar"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${key}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
            // Outer wrapper reserves the *scaled* footprint so the flex layout
            // (and centering) accounts for the transform applied below.
            style={{ width: config.width * scale, height: frameHeight * scale }}
          >
            <div
              className="absolute top-0 left-0 bg-[#0a0a09] border border-zinc-900 shadow-2xl shadow-black/50 overflow-hidden"
              // Render the device frame at its true logical size, then scale it
              // down to fit the available pane. transform-origin top-left keeps it
              // aligned with the reserved footprint above.
              style={{
                width: config.width,
                height: frameHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a09] z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Loading preview…</span>
                  </div>
                </div>
              )}

              {liveContent ? (
                <iframe
                  key={`srcdoc-${key}`}
                  title="Live Preview"
                  srcDoc={srcdoc}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                  onLoad={() => setLoading(false)}
                />
              ) : (
                <iframe
                  key={`route-${key}`}
                  title="Production Preview"
                  src={`/preview/${collection}/${slug}`}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={() => setLoading(false)}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
