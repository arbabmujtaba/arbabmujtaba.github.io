import { useState } from 'react';
import { getLocalWebpSources, normalizeImagePath } from '../lib/image';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}

export default function ParallaxImage({
  src,
  alt,
  className = '',
  imageClassName = '',
  sizes = '100vw',
}: ParallaxImageProps) {
  const [failed, setFailed] = useState(false);

  const normalized = normalizeImagePath(src);
  const webpSources = getLocalWebpSources(normalized, sizes);

  // If no valid image source, render a subtle placeholder so layout doesn't collapse
  if (!normalized || failed) {
    return (
      <div className={`relative overflow-hidden bg-zinc-900 ${className}`} aria-hidden="true">
        <div className="w-full h-full bg-zinc-900/50" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <picture>
        {webpSources && (
          <source type="image/webp" srcSet={webpSources.srcSet} sizes={webpSources.sizes} />
        )}
        <img
          src={normalized}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      </picture>
    </div>
  );
}
