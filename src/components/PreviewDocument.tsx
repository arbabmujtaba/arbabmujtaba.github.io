/**
 * PreviewDocument — Render content for /preview/:collection/:slug
 *
 * Mirrors production styling using the site's Tailwind classes.
 * Used both server-side (SSR via react-dom/server) for the preview endpoint
 * and client-side inside an iframe srcdoc.
 */

import React from 'react';
import Markdown from 'react-markdown';
import SafeImage from './SafeImage';
import { normalizeImagePath } from '../lib/image';

interface PreviewDocumentProps {
  frontmatter: Record<string, any>;
  body: string;
  collection: string;
}

export function PreviewDocument({ frontmatter, body, collection }: PreviewDocumentProps) {
  const title = frontmatter.title || 'Untitled';
  const date = frontmatter.date || '';
  const category = frontmatter.category || '';
  const coverImage = frontmatter.coverImage || frontmatter.featuredImage || frontmatter.projectImage || '';
  const excerpt = frontmatter.excerpt || frontmatter.description || '';
  const techStack = Array.isArray(frontmatter.techStack) ? frontmatter.techStack : [];
  const githubLink = frontmatter.githubLink || '';
  const liveLink = frontmatter.liveLink || '';
  const galleryImages = Array.isArray(frontmatter.galleryImages) ? frontmatter.galleryImages : [];

  return (
    <div className="min-h-screen bg-[#0d0d0c] text-zinc-100">
      <div className="p-6 md:p-12 lg:p-16 space-y-12 max-w-4xl mx-auto">
        {/* Cover image banner */}
        {normalizeImagePath(coverImage) && (
          <div className="relative aspect-[16/9] w-full overflow-hidden border border-zinc-900 bg-zinc-950">
            <img
              src={normalizeImagePath(coverImage)!}
              alt={title}
              className="w-full h-full object-cover grayscale-[15%]"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Category + Date badge */}
        <div className="flex items-center gap-4">
          {category && (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded">
              {category}
            </span>
          )}
          {date && (
            <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              {date}
            </span>
          )}
        </div>

        {/* Title and description */}
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

        {/* Project metadata */}
        {(githubLink || liveLink || techStack.length > 0) && (
          <div className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            {techStack.length > 0 && (
              <div>
                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech: string, idx: number) => (
                    <span key={idx} className="font-mono text-xs text-zinc-300 bg-zinc-900 border border-zinc-800/40 px-2.5 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(githubLink || liveLink) && (
              <div>
                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Project Resources
                </h4>
                <div className="flex flex-col gap-2">
                  {githubLink && (
                    <span className="font-sans text-xs text-zinc-400">
                      {githubLink}
                    </span>
                  )}
                  {liveLink && (
                    <span className="font-sans text-xs text-zinc-400">
                      {liveLink}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Markdown content */}
        <div className="markdown-body pt-4 border-t border-zinc-900">
          <Markdown
            components={{
              img: ({ src, alt, ...rest }) => (
                <SafeImage
                  src={src}
                  alt={alt || ''}
                  className="max-w-full rounded-sm border border-zinc-900 my-4"
                  {...rest}
                />
              ),
            }}
          >
            {body}
          </Markdown>
        </div>

        {/* Gallery */}
        {galleryImages.filter(normalizeImagePath).length > 0 && (
          <div className="space-y-8 pt-8 border-t border-zinc-900">
            <h3 className="font-serif text-2xl text-zinc-200">Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {galleryImages.map((img: string, idx: number) => {
                const normalized = normalizeImagePath(img);
                return normalized ? (
                  <div key={idx} className="aspect-[4/3] overflow-hidden border border-zinc-900 bg-zinc-950">
                    <img
                      src={normalized}
                      alt={`Gallery slide ${idx + 1}`}
                      className="w-full h-full object-cover grayscale-[10%]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewDocument;
