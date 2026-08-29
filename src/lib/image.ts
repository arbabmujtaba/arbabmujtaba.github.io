/**
 * Image path utilities
 * Normalizes image paths for both local uploads and external URLs.
 * Prevents broken image icons by validating paths before rendering.
 */

/**
 * Normalize an image path for safe rendering.
 * Returns null for empty/invalid paths so callers can skip rendering.
 * Passes through external URLs and absolute paths.
 */
export function normalizeImagePath(
  path: string | undefined | null
): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (trimmed === '' || trimmed === "''" || trimmed === '""') return null;

  // External URL — pass through as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Ensure absolute path (prepend leading slash if missing)
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }

  return trimmed;
}

/**
 * Return a path to an optimized variant if it exists (convention-based).
 * Example: '/uploads/photography/x.jpg' with width 800 -> '/_optimized/800/uploads/photography/x.webp'
 */
export function getOptimizedImagePath(path: string | undefined | null, width: number): string | null {
  const p = normalizeImagePath(path);
  if (!p) return null;
  // strip leading slash for file path composition
  const stripped = p.replace(/^\//, '');
  // If the normalized path starts with the uploads directory, drop that
  // prefix because optimized outputs live at `/_optimized/{width}/{collection}/...`.
  const relative = stripped.replace(/^uploads\//, '');
  const webpPath = `/_optimized/${width}/${relative}`.replace(/\.[^.]+$/, '.webp');
  return webpPath;
}

/**
 * Generate a WebP `srcset` string for a set of widths.
 * Example output: "/_optimized/480/uploads/x.webp 480w, /_optimized/800/uploads/x.webp 800w"
 */
export function getOptimizedSrcSet(path: string | undefined | null, widths: number[] = [480, 800, 1200, 2048]): string | null {
  const p = normalizeImagePath(path);
  if (!p) return null;
  const stripped = p.replace(/^\//, '');
  const relative = stripped.replace(/^uploads\//, '');
  const parts: string[] = [];
  for (const w of widths) {
    const webpPath = `/_optimized/${w}/${relative}`.replace(/\.[^.]+$/, '.webp');
    parts.push(`${webpPath} ${w}w`);
  }
  return parts.join(', ');
}

/**
 * Check whether a path is a valid image reference.
 */
export function isValidImagePath(path: string | undefined | null): boolean {
  return normalizeImagePath(path) !== null;
}

/**
 * Extract file extension from a path/URL (lowercased).
 */
export function getImageExtension(path: string): string {
  if (!path) return '';
  try {
    // Strip query strings and hashes
    const clean = path.split('?')[0].split('#')[0];
    const ext = clean.split('.').pop()?.toLowerCase() || '';
    return ext;
  } catch {
    return '';
  }
}

/**
 * Check whether a path has a recognized image extension.
 */
export function isImagePath(path: string): boolean {
  const ext = getImageExtension(path);
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp'].includes(ext);
}

/**
 * Normalize an array of image paths, filtering out invalid ones.
 */
export function normalizeImagePaths(paths: (string | undefined | null)[]): string[] {
  return paths.map(normalizeImagePath).filter((p): p is string => p !== null);
}
