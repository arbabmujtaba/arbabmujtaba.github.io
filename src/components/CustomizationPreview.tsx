/**
 * CustomizationPreview
 *
 * A live, miniature website preview for the Post Customization panel. It reuses
 * the same window-chrome aesthetic as DestinationPreview and renders a mock post
 * using the exact same helpers (`customization.ts`) that drive the real
 * ContentModal — so what the user sees here matches what publishes.
 *
 * Every option is reflected instantly because the preview is fully prop-driven:
 *  - animation preset/speed replays on change (and via the Replay button)
 *  - text size / font family, spacing, alignment, width, radius, shadow,
 *    gradient, accent, opacity, grain, vignette, blur, colour filter and the
 *    music chip all update in real time.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Music } from 'lucide-react';
import { normalizeImagePath } from '../lib/image';
import type { PostCustomization } from '../types';
import {
  getContentAnimationVariants,
  getContainerStyles,
  getCoverImageStyles,
  getTextAlignClass,
  getAccentColor,
  getGradientStyle,
  hasGrainEffect,
  hasVignetteEffect,
  getTypographyStyle,
  getTypographyFontFamily,
} from '../lib/customization';

interface CustomizationPreviewProps {
  value: PostCustomization;
  title?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
}

const GRAIN_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

const WIDTH_PCT: Record<string, string> = {
  narrow: '74%',
  default: '88%',
  wide: '96%',
  full: '100%',
};

export default function CustomizationPreview({
  value,
  title,
  excerpt,
  coverImage,
  category,
}: CustomizationPreviewProps) {
  // Replay the entry animation whenever the animation settings change.
  const [replayKey, setReplayKey] = useState(0);
  const preset = value.animation?.preset || 'none';
  const speed = value.animation?.speed || 'normal';
  useEffect(() => {
    setReplayKey((k) => k + 1);
  }, [preset, speed]);

  const contentAnim = getContentAnimationVariants(value);
  const containerStyles = getContainerStyles(value); // opacity + shadow
  const coverStyles = getCoverImageStyles(value); // radius + colour filter + blur
  const textAlign = getTextAlignClass(value);
  // Spacing is scaled down for the miniature stage (the live site uses full rem gaps).
  const MINI_GAP: Record<string, string> = { compact: '3px', default: '7px', relaxed: '13px', spacious: '20px' };
  const miniGap = MINI_GAP[value.layout?.spacing || 'default'] || '7px';
  const accent = getAccentColor(value);
  const gradient = getGradientStyle(value);
  const grain = hasGrainEffect(value);
  const vignette = hasVignetteEffect(value);
  const typography = getTypographyStyle(value); // --pts / --pff / fontFamily
  const typographyFamily = getTypographyFontFamily(value);

  const headingStyle: React.CSSProperties = {
    ...(accent ? { color: accent } : {}),
    ...(typographyFamily ? { fontFamily: typographyFamily } : {}),
  };

  const cover = normalizeImagePath(coverImage);
  const widthPct = WIDTH_PCT[value.layout?.contentWidth || 'default'];
  const hover = !!value.animation?.hoverEffects;

  const displayTitle = title?.trim() || 'Your Post Title';
  const displayExcerpt =
    excerpt?.trim() || 'A short, evocative excerpt that sets the tone for the piece.';
  const hasMusic = !!(value.music?.songUrl || value.music?.songTitle);

  return (
    <div className="rounded-md border border-orange-500/20 bg-gradient-to-b from-orange-500/[0.05] to-transparent overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-950/50">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 ml-2">
          Live preview
        </span>
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          title="Replay animation"
          className="ml-auto flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3" /> Replay
        </button>
      </div>

      {/* Stage */}
      <div className="relative bg-[#0d0d0c] p-4 h-[300px] overflow-hidden">
        {/* Gradient overlay */}
        {gradient && (
          <div className="absolute inset-0 pointer-events-none z-[1] opacity-30" style={gradient} />
        )}
        {/* Film grain */}
        {grain && (
          <div
            className="absolute inset-0 pointer-events-none z-[2] opacity-[0.07]"
            style={{ backgroundImage: GRAIN_DATA_URI }}
          />
        )}
        {/* Vignette */}
        {vignette && (
          <div
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ boxShadow: 'inset 0 0 60px 22px rgba(0,0,0,0.65)' }}
          />
        )}

        {/* The scaled mock post — re-keyed to replay the entry animation */}
        <motion.div
          key={replayKey}
          initial={contentAnim.initial}
          animate={contentAnim.animate}
          transition={contentAnim.transition}
          className={`relative z-10 mx-auto h-full flex flex-col ${textAlign}`}
          style={{ ...containerStyles, gap: miniGap, ...typography, width: widthPct }}
        >
          {/* Music chip */}
          {hasMusic && (
            <div className="flex items-center gap-1.5 border border-zinc-800/60 bg-zinc-950/70 rounded px-2 py-1 w-fit shrink-0">
              <Music className="w-3 h-3 text-green-500" />
              <span className="text-[9px] text-zinc-400 font-sans truncate max-w-[140px]">
                {value.music?.songTitle || 'Now Playing'}
              </span>
            </div>
          )}

          {/* Cover */}
          <div
            className="relative w-full aspect-[16/9] bg-zinc-900 border border-zinc-800/60 overflow-hidden shrink-0"
            style={coverStyles}
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  hover ? 'transition-transform duration-700 hover:scale-110' : ''
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800/60 via-zinc-900 to-zinc-950 flex items-center justify-center">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-zinc-600">
                  cover image
                </span>
              </div>
            )}
          </div>

          {/* Category */}
          {category && (
            <span
              className="font-mono text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded w-fit shrink-0"
              style={
                accent
                  ? { color: accent, backgroundColor: `${accent}1a` }
                  : { color: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)' }
              }
            >
              {category}
            </span>
          )}

          {/* Title (font family + accent reflected) */}
          <h3 className="font-serif text-base leading-tight text-zinc-100 shrink-0" style={headingStyle}>
            {displayTitle}
          </h3>

          {/* Body — uses .markdown-body so text size (--pts) and family (--pff) match the site */}
          <div className="markdown-body overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
            <p>{displayExcerpt}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
