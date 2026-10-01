import type { CSSProperties, ReactNode } from 'react';
import type { MediaFx as MediaFxSettings } from '../lib/customization';
import { getGrainOverlayStyle, getVignetteOverlayStyle } from '../lib/customization';

interface MediaFxProps {
  fx: MediaFxSettings;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * The post's colour grade, film grain and vignette, around any photograph.
 *
 * The grade (a CSS `filter`) goes on an inner layer and the grain and vignette
 * go on top of it, so blur and colour never smear the grain, and none of it
 * touches the caption or controls that sit outside the frame. Everything is a
 * `<span>` so the wrapper stays valid inside a `<button>` or a markdown `<p>`.
 */
export default function MediaFx({ fx, children, className = '', style }: MediaFxProps) {
  return (
    <span className={`relative block ${className}`} style={style}>
      <span className="block h-full w-full" style={fx.filter ? { filter: fx.filter } : undefined}>
        {children}
      </span>
      {fx.vignette > 0 && (
        <span
          aria-hidden="true"
          data-fx="vignette"
          className="pointer-events-none absolute inset-0"
          style={getVignetteOverlayStyle(fx.vignette)}
        />
      )}
      {fx.grain > 0 && (
        <span
          aria-hidden="true"
          data-fx="grain"
          className="pointer-events-none absolute inset-0"
          style={getGrainOverlayStyle(fx.grain)}
        />
      )}
    </span>
  );
}

/** Both overlays on their own, for media that already has a positioned frame. */
export function MediaFxOverlays({ fx }: { fx: MediaFxSettings }) {
  if (fx.grain <= 0 && fx.vignette <= 0) return null;
  return (
    <>
      {fx.vignette > 0 && (
        <span
          aria-hidden="true"
          data-fx="vignette"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={getVignetteOverlayStyle(fx.vignette)}
        />
      )}
      {fx.grain > 0 && (
        <span
          aria-hidden="true"
          data-fx="grain"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={getGrainOverlayStyle(fx.grain)}
        />
      )}
    </>
  );
}
