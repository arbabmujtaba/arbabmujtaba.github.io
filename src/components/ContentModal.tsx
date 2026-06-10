import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Tag, ArrowUpRight } from 'lucide-react';
import Markdown from 'react-markdown';

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
  };
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
  metadata
}: ContentModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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

      {/* Main Drawer container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="relative w-full max-w-4xl h-full bg-[#0d0d0c] border-l border-zinc-900 flex flex-col z-20 shadow-2xl overflow-y-auto custom-scrollbar"
      >
        {/* Header action panel */}
        <div className="sticky top-0 z-30 bg-[#0d0d0c]/90 backdrop-blur-md px-6 md:px-12 py-6 border-b border-zinc-900/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded">
              {category}
            </span>
            {date && (
              <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-zinc-600" />
                {date}
              </span>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-all cursor-pointer outline-none"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content canvas */}
        <div className="p-6 md:p-12 lg:p-16 space-y-12">
          {/* Cover image banner */}
          {coverImage && (
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-zinc-900 bg-zinc-950">
              <img 
                src={coverImage} 
                alt={title} 
                className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Core Title and description */}
          <div className="space-y-6">
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-zinc-100 tracking-tight leading-[1.1]">
              {title}
            </h1>
            
            {excerpt && (
              <p className="font-sans text-base md:text-lg text-zinc-400 font-light leading-relaxed border-l border-zinc-800 pl-6">
                {excerpt}
              </p>
            )}
          </div>

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
          <div className="markdown-body pt-4 border-t border-zinc-900">
            <Markdown>{body}</Markdown>
          </div>

          {/* Photography Gallery Images if available */}
          {metadata && metadata.galleryImages && metadata.galleryImages.length > 0 && (
            <div className="space-y-8 pt-8 border-t border-zinc-900">
              <h3 className="font-serif text-2xl text-zinc-200">Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {metadata.galleryImages.map((img, idx) => (
                  <div key={idx} className="aspect-[4/3] overflow-hidden border border-zinc-900 bg-zinc-950">
                    <img 
                      src={img} 
                      alt={`Gallery slide ${idx + 1}`} 
                      className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
