/**
 * ValidationService
 *
 * Validates metadata, slugs, collections, and image paths
 * before they are written to the filesystem or committed.
 */

/**
 * Every collection the publishing pipeline may commit. It used to list only the
 * four document collections, so publishing a home reel, a timeline chapter, a
 * secret, a gear item or a favourite always failed at "Validate Metadata".
 */
const ALLOWED_COLLECTIONS = [
  'journal',
  'tech',
  'photography',
  'portfolio',
  'gear',
  'timeline',
  'favorites',
  'home',
  'secrets',
];

/** Collections whose entries are dated documents; the rest are undated fragments. */
const DATED_COLLECTIONS = new Set(['journal', 'tech', 'photography']);

const RESERVED_SLUGS = [
  'admin',
  'api',
  'preview',
  'content',
  'assets',
  'dist',
  'node_modules',
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ValidationService {
  /**
   * Validate content metadata.
   */
  validateMetadata(data: Record<string, any>, collection: string): ValidationResult {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (data.title && data.title.trim().length > 200) {
      errors.push('Title exceeds 200 characters');
    }

    if (!collection || !ALLOWED_COLLECTIONS.includes(collection)) {
      errors.push(`Invalid collection. Must be one of: ${ALLOWED_COLLECTIONS.join(', ')}`);
    }

    // Portfolio projects, reels, chapters and secrets carry no date; requiring one
    // made them impossible to publish. A date that IS present must still parse.
    if (DATED_COLLECTIONS.has(collection) && !data.date) {
      errors.push('Date is required (YYYY-MM-DD)');
    } else if (data.date && !this.isValidISODate(data.date)) {
      errors.push('Date must be a valid date string (YYYY-MM-DD)');
    }

    if (data.category && typeof data.category !== 'string') {
      errors.push('Category must be a string');
    }

    if (data.excerpt && typeof data.excerpt !== 'string') {
      errors.push('Excerpt must be a string');
    }

    if (data.excerpt && data.excerpt.length > 2000) {
      errors.push('Excerpt exceeds 2000 characters');
    }

    if (data.coverImage && typeof data.coverImage === 'string') {
      if (!this.isValidImagePath(data.coverImage)) {
        errors.push(`Invalid coverImage path: ${data.coverImage}`);
      }
    }

    if (data.galleryImages && Array.isArray(data.galleryImages)) {
      for (const img of data.galleryImages) {
        if (typeof img === 'string' && !this.isValidImagePath(img)) {
          errors.push(`Invalid gallery image path: ${img}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a URL-friendly slug.
   */
  validateSlug(slug: string): ValidationResult {
    const errors: string[] = [];

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      errors.push('Slug is required');
      return { valid: false, errors };
    }

    const clean = slug.trim().toLowerCase();

    if (clean.length > 100) {
      errors.push('Slug exceeds 100 characters');
    }

    if (!SLUG_PATTERN.test(clean)) {
      errors.push('Slug must be lowercase alphanumeric with hyphens only (no spaces or special characters)');
    }

    if (clean.startsWith('-') || clean.endsWith('-')) {
      errors.push('Slug must not start or end with a hyphen');
    }

    if (RESERVED_SLUGS.includes(clean)) {
      errors.push(`'${clean}' is a reserved slug and cannot be used`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate a collection name.
   */
  validateCollection(collection: string): ValidationResult {
    const errors: string[] = [];

    if (!collection || typeof collection !== 'string' || collection.trim().length === 0) {
      errors.push('Collection is required');
      return { valid: false, errors };
    }

    if (!ALLOWED_COLLECTIONS.includes(collection)) {
      errors.push(`Collection must be one of: ${ALLOWED_COLLECTIONS.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate an image upload path.
   */
  isValidImagePath(path: string): boolean {
    if (!path || typeof path !== 'string') return false;
    // Allow relative paths like /uploads/journal/image.jpg or external URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        new URL(path);
        return true;
      } catch {
        return false;
      }
    }
    // Relative paths must start with /uploads/
    if (!path.startsWith('/uploads/') && !path.startsWith('/assets/')) {
      return false;
    }
    const ext = path.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'mp4', 'webm', 'mov'].includes(ext || '');
  }

  /**
   * Check if a string is a valid date (YYYY-MM-DD).
   */
  private isValidISODate(dateStr: unknown): boolean {
    // gray-matter turns an unquoted `date: 2026-10-06` into a Date.
    if (dateStr instanceof Date) return !isNaN(dateStr.getTime());
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
}
