import { useEffect, useState } from 'react';
import { getLocalWebpSources, normalizeImagePath } from '../lib/image';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  alt: string;
  fallback?: React.ReactNode;
}

/**
 * SafeImage — renders an img tag only when src is valid.
 * Hides broken images via onError instead of showing the browser's broken-icon.
 * Supports external URLs and local /uploads/ paths.
 */
export default function SafeImage({
  src,
  alt,
  fallback,
  className = '',
  style,
  ...props
}: SafeImageProps) {
  const normalized = normalizeImagePath(src);
  const webpSources = getLocalWebpSources(normalized);

  /**
   * Three stages, because a `<source>` and an `<img>` fail differently.
   *
   * When the WebP derivative is missing the browser has already committed to the
   * `<source>` and the whole `<picture>` errors — it does not fall back to the
   * `<img>` on its own. Treating that as "image is broken" is what made a
   * freshly uploaded frame show nothing in the admin: the derivatives are
   * generated in the background, so for the first second there is an original on
   * disk and no derivative, and the preview gave up permanently.
   *
   * So a failure at the `webp` stage drops the sources and retries the original,
   * and only a second failure — the original itself missing — hides the plate.
   */
  const [stage, setStage] = useState<'webp' | 'original' | 'failed'>('webp');

  // A new src is a new image: start again from the derivatives.
  useEffect(() => {
    setStage('webp');
  }, [normalized]);

  if (!normalized || stage === 'failed') {
    if (fallback) return <>{fallback}</>;
    // Return empty div with same styling hook so layout doesn't collapse
    return <div className={className} style={style} aria-hidden="true" />;
  }

  const useWebpSources = Boolean(webpSources) && stage === 'webp';

  return (
    // Keyed on the stage so dropping the <source> builds a fresh element and the
    // browser re-resolves the image rather than keeping its failed result.
    <picture key={useWebpSources ? 'webp' : 'original'}>
      {useWebpSources && webpSources && (
        <source type="image/webp" srcSet={webpSources.srcSet} sizes={webpSources.sizes} />
      )}
      <img
        src={normalized}
        alt={alt}
        className={className}
        style={style}
        onError={() => setStage(useWebpSources ? 'original' : 'failed')}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
}
