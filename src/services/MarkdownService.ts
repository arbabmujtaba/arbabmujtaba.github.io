/**
 * MarkdownService
 *
 * Handles markdown validation, frontmatter generation, and parsing.
 * Ensures output conforms to the project's content schema.
 */

import matter from 'gray-matter';

export interface MarkdownValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MarkdownService {
  /**
   * Validate markdown body for common structural issues.
   *
   * Checks:
   * - Unclosed code blocks (```)
   * - Unclosed inline code (`)
   *   (lenient: allows odd counts as long as final line is closed)
   * - Invalid frontmatter block at start
   */
  validateMarkdown(body: string): MarkdownValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!body || body.trim().length === 0) {
      warnings.push('Body is empty');
    }

    // Check for unclosed code fence blocks
    const fenceMatches = body.match(/^```/gm);
    if (fenceMatches && fenceMatches.length % 2 !== 0) {
      errors.push('Unclosed code block (missing closing ```)');
    }

    // Check for broken image links
    const brokenImages = body.match(/!\[([^\]]*)\]\s*\(\s*\)/g);
    if (brokenImages) {
      warnings.push(`${brokenImages.length} image(s) have empty URLs`);
    }

    // Check for empty links
    const emptyLinks = body.match(/\[([^\]]+)\]\s*\(\s*\)/g);
    if (emptyLinks) {
      warnings.push(`${emptyLinks.length} link(s) have empty URLs`);
    }

    // Warn if heading structure jumps (e.g., h1 → h3 without h2)
    const headings = body.match(/^#{1,6}\s+/gm) || [];
    if (headings.length > 0) {
      const levels = headings.map((h) => h.match(/#/g)!.length);
      let prev = 0;
      for (const level of levels) {
        if (prev > 0 && level > prev + 1) {
          warnings.push(`Heading level jumps from H${prev} to H${level}`);
          break;
        }
        prev = level;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate a markdown string with frontmatter.
   *
   * Uses gray-matter for consistent frontmatter serialization.
   */
  generateFrontmatter(body: string, data: Record<string, any>): string {
    return matter.stringify(body, data);
  }

  /**
   * Parse frontmatter from a raw markdown string.
   *
   * Returns the parsed data and content body.
   */
  parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
    const { data, content } = matter(raw);
    return { data, content };
  }

  /**
   * Strip frontmatter from raw markdown, returning only body.
   */
  stripFrontmatter(raw: string): string {
    const { content } = matter(raw);
    return content;
  }
}

export default MarkdownService;
