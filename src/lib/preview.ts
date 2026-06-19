/**
 * Preview Utilities
 *
 * Pure logic for resolving preview URLs, constructing publish payloads,
 * and handling revert behavior. Exported for testing.
 */

import type { SectionDef } from './sections';

// ============================================================
// Preview URL Resolution
// ============================================================

/**
 * Resolves the preview iframe URL for a given section and item slug.
 *
 * For singletons: uses the section's slug directly.
 * For collections: uses the provided item slug.
 *
 * If the section has a previewRoute defined, generates the server-rendered
 * preview URL at /preview/:collection/:slug. Falls back to the previewRoute
 * itself if no slug is available.
 */
export function resolvePreviewUrl(
  section: SectionDef,
  itemSlug?: string
): string {
  const slug = section.kind === 'singleton' ? section.slug : itemSlug;
  const collection = section.collection;

  if (!slug) {
    // If no slug, fall back to section previewRoute or home
    return section.previewRoute || '/';
  }

  return `/preview/${collection}/${slug}`;
}

/**
 * Gets the page preview route for a section (the public-facing page URL).
 * Used for "View on site" links.
 */
export function getPagePreviewRoute(section: SectionDef): string {
  return section.previewRoute || '/';
}

// ============================================================
// Publish Payload Construction
// ============================================================

export interface PublishPayload {
  collection: string;
  slug: string;
  title: string;
  body: string;
  data: Record<string, any>;
}

/**
 * Constructs the payload for POST /api/publish.
 * Combines frontmatter data with the body content and identifies
 * the collection and slug for the publishing pipeline.
 */
export function buildPublishPayload(
  collection: string,
  slug: string,
  data: Record<string, any>,
  body: string
): PublishPayload {
  return {
    collection,
    slug,
    title: data.title || slug,
    body,
    data,
  };
}

// ============================================================
// Revert Logic
// ============================================================

export interface RevertResult {
  data: Record<string, any>;
  body: string;
}

/**
 * Fetches the current saved state of a content item from the server.
 * Returns the parsed frontmatter data and body content.
 */
export async function fetchContentForRevert(
  collection: string,
  slug: string
): Promise<RevertResult> {
  const res = await fetch(`/api/content/${collection}/${slug}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch content: ${res.status}`);
  }
  const result = await res.json();
  return {
    data: result.data || {},
    body: result.body || '',
  };
}

/**
 * Initiates the publish pipeline via POST /api/publish.
 * Returns the jobId for SSE progress tracking.
 */
export async function startPublish(payload: PublishPayload): Promise<string> {
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Publish failed: ${res.status}`);
  }

  const result = await res.json();
  return result.jobId;
}
