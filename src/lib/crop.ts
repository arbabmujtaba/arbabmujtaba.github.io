/**
 * Crop geometry.
 *
 * The site never edits the photograph. A post stores an aspect, a focal point
 * and a zoom, and the renderer reproduces them with `object-fit: cover`,
 * `object-position` and a CSS scale. These functions are that same arithmetic
 * written down once, so the admin can (a) draw the exact window the site will
 * show on top of the full photograph, (b) turn a drag back into a focal point,
 * and (c) bake the window into a real file when the author wants one.
 *
 * All rectangles are in source-image pixels.
 */

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface CropInput {
  width: number;
  height: number;
  /** Target width / height. */
  ratio: number;
  /** 0–100 */
  focalX: number;
  focalY: number;
  /** 1–3 */
  zoom: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The largest `ratio` window that fits the photograph — what `object-fit: cover` shows. */
function baseWindow(width: number, height: number, ratio: number) {
  const bw = Math.min(width, height * ratio);
  const bh = Math.min(height, width / ratio);
  return { bw, bh };
}

/** The part of the photograph the site shows for these settings. */
export function cropRect({ width, height, ratio, focalX, focalY, zoom }: CropInput): CropRect {
  const { bw, bh } = baseWindow(width, height, ratio);
  const fx = clamp(focalX, 0, 100) / 100;
  const fy = clamp(focalY, 0, 100) / 100;
  const z = clamp(zoom, 1, 3);

  const bx = (width - bw) * fx;
  const by = (height - bh) * fy;

  // CSS scales about the focal point of the *box*, so the visible slice of the
  // base window starts at fx·(1 − 1/z) and is 1/z of its size.
  return {
    sx: bx + bw * fx * (1 - 1 / z),
    sy: by + bh * fy * (1 - 1 / z),
    sw: bw / z,
    sh: bh / z,
  };
}

/**
 * Inverse of `cropRect` for a drag: which focal point puts the window's centre
 * at (cx, cy)? Returns 0–100 on each axis, 50 when the axis has no slack.
 */
export function focalFromCenter(
  { width, height, ratio, zoom }: Pick<CropInput, 'width' | 'height' | 'ratio' | 'zoom'>,
  cx: number,
  cy: number
): { focalX: number; focalY: number } {
  const { bw, bh } = baseWindow(width, height, ratio);
  const z = clamp(zoom, 1, 3);

  const solve = (center: number, full: number, base: number) => {
    const slack = full - base / z;
    if (slack <= 0.5) return 50;
    return clamp(((center - base / (2 * z)) / slack) * 100, 0, 100);
  };

  return { focalX: solve(cx, width, bw), focalY: solve(cy, height, bh) };
}
