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
 * Resolve an image only when it belongs to the owner's own archive.
 *
 * The design system's first rule is that every image on the site is the
 * owner's. Anything outside `/uploads/` is also invisible to
 * `getLocalWebpSources`, so it would bypass the WebP srcset entirely.
 * Guarding here means a surface renders an owner photograph or no plate at
 * all, and it keeps that guarantee even if a remote URL is ever pasted back
 * into the front-matter. A photograph uploaded through the CMS appears with no
 * further change, because uploads land under `/uploads/` and are picked up by
 * the derivative pipeline.
 */
export function ownerArchiveImage(
  path: string | undefined | null
): string | undefined {
  const normalized = normalizeImagePath(path);
  if (!normalized) return undefined;

  const bare = normalized.split('?')[0].split('#')[0];
  const isOwnerArchive = bare.startsWith('/uploads/') || bare === '/portrait.jpg';

  return isOwnerArchive ? normalized : undefined;
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

export interface ResponsiveImageSources {
  srcSet: string;
  sizes: string;
}

/**
 * Return local WebP derivatives when the image is part of the published
 * archive. The original remains the fallback for older browsers and future
 * CMS uploads that do not yet have generated derivatives.
 */
export function getLocalWebpSources(
  path: string | undefined | null,
  sizes = '100vw'
): ResponsiveImageSources | undefined {
  const normalized = normalizeImagePath(path);
  if (!normalized) return undefined;

  const sourcePath = normalized.split('?')[0].split('#')[0];
  const isPortrait = sourcePath === '/portrait.jpg';
  const isUpload = sourcePath.startsWith('/uploads/');
  if (!isPortrait && !isUpload) return undefined;

  const relativePath = isPortrait
    ? 'portrait.jpg'
    : sourcePath.slice('/uploads/'.length);
  const extensionIndex = relativePath.lastIndexOf('.');
  if (extensionIndex === -1) return undefined;

  const basePath = relativePath.slice(0, extensionIndex);
  return {
    srcSet: `/uploads/optimized/${basePath}-480.webp 480w, /uploads/optimized/${basePath}-768.webp 768w, /uploads/optimized/${basePath}-1536.webp 1536w`,
    sizes,
  };
}

/**
 * Normalize an array of image paths, filtering out invalid ones.
 */
export function normalizeImagePaths(paths: (string | undefined | null)[]): string[] {
  return paths.map(normalizeImagePath).filter((p): p is string => p !== null);
}
