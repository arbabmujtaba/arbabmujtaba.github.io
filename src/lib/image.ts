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
