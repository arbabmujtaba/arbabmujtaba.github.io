import { useState } from 'react';
import { normalizeImagePath, getOptimizedImagePath } from '../lib/image';

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
  // Optional width prop can be passed via props to request an optimized variant
  const width = (props as any).width as number | undefined;
  const normalized = normalizeImagePath(src);
  const optimized = width && normalized ? getOptimizedImagePath(normalized, width) : null;
  const [failed, setFailed] = useState(false);

  if (!normalized || failed) {
    if (fallback) return <>{fallback}</>;
    // Return empty div with same styling hook so layout doesn't collapse
    return <div className={className} style={style} aria-hidden="true" />;
  }

  return (
    <img
      src={optimized || normalized!}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
      loading="lazy"
      {...props}
    />
  );
}
