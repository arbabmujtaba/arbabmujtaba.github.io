import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Tag, ArrowUpRight, Music, ExternalLink, Camera, Maximize2 } from 'lucide-react';
import Markdown from 'react-markdown';
import SafeImage from './SafeImage';
import Lightbox, { type LightboxFrame } from './Lightbox';
import MotionPlate from './rushes/MotionPlate';
import { normalizeImagePath } from '../lib/image';
import type { PostCustomization } from '../types';
import {
  getAnimationVariants,
  getContentAnimationVariants,
  getContainerStyles,
  getCoverImageStyles,
  getContentWidthClass,
  getTextAlignClass,
  getSpacingStyle,
  getAccentColor,
  getGradientStyle,
  getTypographyStyle,
  getTypographyFontFamily,
  hasGrainEffect,
  hasVignetteEffect,
  detectMusicProvider,
  extractSpotifyTrackId,
  extractYouTubeId,
  isValidEmbedUrl,
  isValidAudioUrl,
} from '../lib/customization';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: string;
  date?: string;
  coverImage?: string;
  excerpt?: string;
  body: string;
  metadata?: {
    githubLink?: string;
    liveLink?: string;
    techStack?: string[];
    galleryImages?: string[];
    gear?: string[];
    captureMode?: string;
  };
  customization?: PostCustomization;
  /** Short clip or GIF rendered above the cover, with its own controls. */
  video?: string;
  videoPoster?: string;
  /**
   * `overlay` (default) is the right-hand quick-look drawer: fixed, with a
   * backdrop, a close button and a body scroll lock.
   * `page` renders the same content inline as the article body of a detail
   * route, so `/journal/<slug>` and the quick look can never drift apart.
   */
  variant?: 'overlay' | 'page';
}

function MusicPlayer({ music }: { music: NonNullable<PostCustomization['music']> }) {
  const { songUrl, songTitle, songArtist, albumArt, provider } = music;
  if (!songUrl) return null;

  const detectedProvider = provider || detectMusicProvider(songUrl);

  // Spotify embed
  if (detectedProvider === 'spotify') {
    const trackId = extractSpotifyTrackId(songUrl);
    if (trackId && isValidEmbedUrl(songUrl)) {
      return (
        <div className="border border-zinc-800/60 bg-zinc-950/60 rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/40">
            <Music className="w-3.5 h-3.5 text-green-500" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Now Playing</span>
          </div>
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}?theme=0`}
            width="100%"
            height="80"
            allow="encrypted-media"
            className="border-0"
            title={songTitle || 'Spotify Player'}
          />
        </div>
      );
    }
  }

  // YouTube embed
  if (detectedProvider === 'youtube') {
    const videoId = extractYouTubeId(songUrl);
    if (videoId && isValidEmbedUrl(songUrl)) {
      return (
        <div className="border border-zinc-800/60 bg-zinc-950/60 rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/40">
            <Music className="w-3.5 h-3.5 text-red-500" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Now Playing</span>
            {songTitle && <span className="font-sans text-xs text-zinc-400 ml-auto">{songTitle}</span>}
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
            width="100%"
            height="80"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            className="border-0"
            title={songTitle || 'YouTube Player'}
          />
        </div>
      );
    }
  }

  // SoundCloud embed
  if (detectedProvider === 'soundcloud' && isValidEmbedUrl(songUrl)) {
    return (
      <div className="border border-zinc-800/60 bg-zinc-950/60 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/40">
          <Music className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Now Playing</span>
          {songTitle && <span className="font-sans text-xs text-zinc-400 ml-auto">{songTitle}</span>}
        </div>
        <iframe
          width="100%"
          height="80"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(songUrl)}&color=%23f97316&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
          className="border-0"
          title={songTitle || 'SoundCloud Player'}
        />
      </div>
    );
  }

  // Custom / HTML5 audio player - validate URL before rendering
  const audioUrlValid = isValidAudioUrl(songUrl);

  return (
    <div className="border border-zinc-800/60 bg-zinc-950/60 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {albumArt && (
          <div className="w-12 h-12 rounded-md overflow-hidden border border-zinc-800 shrink-0">
            <SafeImage src={albumArt} alt={songTitle || 'Album art'} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Music className="w-3 h-3 text-orange-500 shrink-0" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Now Playing</span>
          </div>
          {songTitle && <p className="font-sans text-sm text-zinc-200 truncate">{songTitle}</p>}
          {songArtist && <p className="font-sans text-xs text-zinc-500 truncate">{songArtist}</p>}
        </div>
        {audioUrlValid && (
          <a
            href={songUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-zinc-500 hover:text-orange-500 transition-colors shrink-0"
            title="Open link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {audioUrlValid ? (
        <audio controls className="w-full mt-3 h-8 opacity-80" preload="none">
          <source src={songUrl} />
        </audio>
      ) : (
        <p className="font-mono text-[10px] text-zinc-400 mt-3">Audio source unavailable (invalid URL)</p>
      )}
    </div>
  );
}

export default function ContentModal({
  isOpen,
  onClose,
  title,
  category,
  date,
  coverImage,
  excerpt,
  body,
  metadata,
  customization,
  video,
  videoPoster,
  variant = 'overlay'
}: ContentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isPage = variant === 'page';

  /**
   * Full-size viewing. Every photograph in an entry — the cover, the gallery,
   * anything embedded in the body — opens the original in the lightbox, because
   * the plate on the page is cropped to a 16/9 or 4/3 box and the frame itself
   * is the point.
   */
  const [lightbox, setLightbox] = useState<{ frames: LightboxFrame[]; index: number } | null>(null);

  useEffect(() => {
    // Only the drawer owns the page scroll. In `page` mode the document must
    // stay scrollable, since the article *is* the page.
    if (isPage) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        modalRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isPage]);

  if (!isOpen) return null;

  // Customization-derived values
  const animVariants = getAnimationVariants(customization);
  const contentAnim = getContentAnimationVariants(customization);
  const containerStyles = getContainerStyles(customization);
  const coverStyles = getCoverImageStyles(customization);
  const widthClass = getContentWidthClass(customization);
  const textAlignClass = getTextAlignClass(customization);
  const spacingStyle = getSpacingStyle(customization);
  const accentColor = getAccentColor(customization);
  const gradientStyle = getGradientStyle(customization);
  const showGrain = hasGrainEffect(customization);
  const showVignette = hasVignetteEffect(customization);
  const typographyStyle = getTypographyStyle(customization);
  const typographyFamily = getTypographyFontFamily(customization);
  const hoverEffects = !!customization?.animation?.hoverEffects;

  // Heading style with accent color
  const headingStyle: React.CSSProperties = {
    ...(accentColor ? { color: accentColor } : {}),
    ...(typographyFamily ? { fontFamily: typographyFamily } : {}),
  };
  const linkStyle: React.CSSProperties = accentColor ? { color: accentColor } : {};

  /**
   * The photographs of this entry, in reading order: cover first, then the
   * gallery. A body image that is not one of them opens on its own rather than
   * being forced into the set.
   */
  const entryFrames: LightboxFrame[] = [
    coverImage,
    ...(metadata?.galleryImages || []),
  ]
    .map((image) => normalizeImagePath(image))
    .filter((image, index, all): image is string => Boolean(image) && all.indexOf(image) === index)
    .map((image, index) => ({
      src: image,
      alt: index === 0 ? title : `${title} — frame ${index + 1}`,
      title,
      index: index === 0 ? 'cover' : `frame ${String(index + 1).padStart(2, '0')}`,
      caption: index === 0 ? excerpt : undefined,
      meta: [metadata?.gear?.length ? metadata.gear.join(' / ') : null, metadata?.captureMode || null]
        .filter(Boolean)
        .join('  ·  '),
    }));

  const openFrame = (image: string | undefined) => {
    const normalized = normalizeImagePath(image);
    if (!normalized) return;
    const index = entryFrames.findIndex((frame) => frame.src === normalized);
    setLightbox(
      index >= 0
        ? { frames: entryFrames, index }
        : { frames: [{ src: normalized, alt: title, title }], index: 0 }
    );
  };

  const lightboxOverlay = (
    <Lightbox
      frames={lightbox?.frames || []}
      openIndex={lightbox ? lightbox.index : null}
      onClose={() => setLightbox(null)}
      onNavigate={(index) => setLightbox((current) => (current ? { ...current, index } : current))}
    />
  );


  /** Customization-driven surface treatments, shared by both variants. */
  const decorations = (
    <>
      {/* Gradient overlay */}
      {gradientStyle && (
        <div
          className="absolute inset-0 pointer-events-none z-[1] opacity-20"
          style={gradientStyle}
        />
      )}

      {/* Grain overlay */}
      {showGrain && (
        <div
          className="absolute inset-0 pointer-events-none z-[2] opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Vignette overlay */}
      {showVignette && (
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{ boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.6)' }}
        />
      )}
    </>
  );

  /** Category + date strip. Sticky with a close action only in the drawer. */
  const header = (
    <div
      className={`z-30 px-6 md:px-12 py-6 border-b border-zinc-900/50 flex justify-between items-center ${
        isPage
          ? 'relative bg-canvas-raised'
          : 'sticky top-0 bg-canvas-raised/90 backdrop-blur-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded"
          style={accentColor ? { color: accentColor, backgroundColor: `${accentColor}15` } : {}}
        >
          {category}
        </span>
        {date && (
          <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-zinc-500" />
            {date}
          </span>
        )}
      </div>

      {!isPage && (
        <button
          onClick={onClose}
          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-all cursor-pointer outline-none"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const canvas = (
        <motion.div
          initial={contentAnim.initial}
          animate={contentAnim.animate}
          transition={contentAnim.transition}
          className={`p-6 md:p-12 lg:p-16 flex flex-col relative z-10 mx-auto w-full ${widthClass}`}
          style={{ ...spacingStyle, ...typographyStyle }}
        >
          {/* Music Player Widget */}
          {customization?.music?.songUrl && (
            <MusicPlayer music={customization.music} />
          )}

          {/* Motion plate. Placed above the cover because a clip is the more
              specific artefact: when an entry has both, the moving one leads. */}
          {video && (
            <MotionPlate
              src={video}
              poster={videoPoster || coverImage}
              title={title}
              aspect="aspect-[16/9]"
            />
          )}

          {/* Cover image banner */}
          {normalizeImagePath(coverImage) && (
            <button
              type="button"
              onClick={() => openFrame(coverImage)}
              aria-label={`${title} — open the full frame`}
              className="group relative block aspect-[16/9] w-full cursor-zoom-in overflow-hidden border border-zinc-900 bg-zinc-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              style={coverStyles}
            >
              <SafeImage 
                src={coverImage} 
                alt={title} 
                className={`w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700 ${hoverEffects ? 'hover:scale-105' : ''}`}
                referrerPolicy="no-referrer"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 border border-zinc-700/60 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Maximize2 className="h-3 w-3" />
                full frame
              </span>
            </button>
          )}

          {/* Core Title and description */}
          <div className={`space-y-6 ${textAlignClass}`}>
            <h1
              className="font-serif text-3xl md:text-5xl lg:text-6xl text-zinc-100 tracking-tight leading-[1.1]"
              style={headingStyle}
            >
              {title}
            </h1>
            
            {excerpt && (
              <p className="font-sans text-base md:text-lg text-zinc-400 font-light leading-relaxed border-l border-zinc-800 pl-6">
                {excerpt}
              </p>
            )}
          </div>

          {/* Captured With — gear used for this photo */}
          {metadata && ((metadata.gear && metadata.gear.length > 0) || metadata.captureMode) && (
            <div className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-sm">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-zinc-600" />
                Captured With
              </h4>
              {metadata.gear && metadata.gear.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {metadata.gear.map((g, idx) => (
                    <span key={idx} className="font-mono text-xs text-zinc-300 bg-zinc-900 border border-zinc-800/40 px-2.5 py-1 rounded">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {metadata.captureMode && (
                <p className="font-sans text-xs text-zinc-500">{metadata.captureMode}</p>
              )}
            </div>
          )}

          {/* Project Specific Links/Tags if available */}
          {metadata && (metadata.githubLink || metadata.liveLink || (metadata.techStack && metadata.techStack.length > 0)) && (
            <div className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              {metadata.techStack && metadata.techStack.length > 0 && (
                <div>
                  <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-zinc-600" />
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {metadata.techStack.map((tech, idx) => (
                      <span key={idx} className="font-mono text-xs text-zinc-300 bg-zinc-900 border border-zinc-800/40 px-2.5 py-1 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(metadata.githubLink || metadata.liveLink) && (
                <div>
                  <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    Project Resources
                  </h4>
                  <div className="flex flex-col gap-2">
                    {metadata.githubLink && (
                      <a 
                        href={metadata.githubLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans text-xs text-zinc-400 hover:text-orange-500 flex items-center gap-1.5 transition-colors group"
                        style={linkStyle}
                      >
                        GitHub Repository
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {metadata.liveLink && (
                      <a 
                        href={metadata.liveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans text-xs text-zinc-400 hover:text-orange-500 flex items-center gap-1.5 transition-colors group"
                        style={linkStyle}
                      >
                        Launch Direct Showcase
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Markdown Content Parser */}
          <div className={`markdown-body pt-4 border-t border-zinc-900 ${textAlignClass}`}>
            <Markdown
              components={{
                img: ({ src, alt, ...rest }) => (
                  <SafeImage
                    src={src}
                    alt={alt || ''}
                    onClick={() => openFrame(typeof src === 'string' ? src : undefined)}
                    className="max-w-full cursor-zoom-in rounded-sm border border-zinc-900 my-4"
                    {...rest}
                  />
                ),
              }}
            >
              {body}
            </Markdown>
          </div>

          {/* Photography Gallery Images if available */}
          {metadata && metadata.galleryImages && metadata.galleryImages.length > 0 && (
            <div className="space-y-8 pt-8 border-t border-zinc-900">
              <h3 className="font-serif text-2xl text-zinc-200" style={headingStyle}>Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {metadata.galleryImages
                  .map((img, idx) => ({ img, idx, normalized: normalizeImagePath(img) }))
                  .filter(({ normalized }) => normalized)
                  .map(({ img, idx, normalized }) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => openFrame(normalized!)}
                      aria-label={`Gallery slide ${idx + 1} — open the full frame`}
                      className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden border border-zinc-900 bg-zinc-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <SafeImage 
                        src={normalized!} 
                        alt={`Gallery slide ${idx + 1}`} 
                        className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 border border-zinc-700/60 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <Maximize2 className="h-3 w-3" />
                        full frame
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
  );

  // Inline article: no backdrop, no fixed positioning, no scroll lock. The
  // detail route owns the page chrome and the back navigation.
  if (isPage) {
    return (
      <article
        className="relative w-full overflow-hidden border border-zinc-800 bg-canvas-raised"
        style={containerStyles}
      >
        {decorations}
        {header}
        {canvas}
        {lightboxOverlay}
      </article>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Main drawer container */}
      <motion.div
        ref={modalRef}
        initial={animVariants.initial}
        animate={animVariants.animate}
        exit={animVariants.exit}
        transition={animVariants.transition}
        style={containerStyles}
        className="relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full bg-canvas-raised border-l border-zinc-900 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar"
      >
        {decorations}
        {header}
        {canvas}
      </motion.div>

      {/* Above the drawer: the frame is the whole screen, not a panel inside it. */}
      {lightboxOverlay}
    </div>
  );
}
