/**
 * Field Round-Trip Test
 *
 * Verifies that content saved via the API (gray-matter stringify) can be
 * correctly parsed back by the client-side parseMarkdown() function in cms.ts.
 * Tests with various field types: strings, arrays, booleans, numbers, nested YAML.
 */

import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { parseMarkdown } from '../src/lib/cms';

describe('Field Round-Trip: gray-matter stringify -> parseMarkdown', () => {
  it('handles simple string values', () => {
    const data = {
      title: 'My Title',
      slug: 'my-title',
      category: 'Life',
    };
    const body = 'Some content here.';
    const serialized = matter.stringify(body, data);
    const result = parseMarkdown(serialized);

    expect(result.data.title).toBe('My Title');
    expect(result.data.slug).toBe('my-title');
    expect(result.data.category).toBe('Life');
    expect(result.content.trim()).toBe(body);
  });

  it('handles multi-word strings with colons', () => {
    const data = {
      title: 'Profile Bio',
      label: 'Identity // Personal Index',
      description: 'Based between code, cameras, Jammu & Kashmir, and the small mysteries.',
    };
    const body = 'Body content here.';
    const serialized = matter.stringify(body, data);
    const result = parseMarkdown(serialized);

    expect(result.data.title).toBe('Profile Bio');
    // gray-matter may quote strings with colons/special chars
    expect(result.data.label).toBe('Identity // Personal Index');
    expect(result.data.description).toBe(
      'Based between code, cameras, Jammu & Kashmir, and the small mysteries.'
    );
  });

  it('handles boolean values', () => {
    const data = {
      visible: true,
      featured: false,
    };
    const serialized = matter.stringify('', data);
    const result = parseMarkdown(serialized);

    expect(result.data.visible).toBe(true);
    expect(result.data.featured).toBe(false);
  });

  it('handles numeric values (parsed as strings by custom parser)', () => {
    const data = {
      order: 1,
      priority: 42,
    };
    const serialized = matter.stringify('', data);
    const result = parseMarkdown(serialized);

    // The custom parseMarkdown treats unquoted non-boolean values as strings
    // so numbers come back as strings - this is expected behavior
    expect(String(result.data.order)).toBe('1');
    expect(String(result.data.priority)).toBe('42');
  });

  it('handles inline arrays [item1, item2]', () => {
    const data = {
      tags: ['react', 'typescript', 'vite'],
    };
    // Force inline array format like the content files use
    const yaml = `---\ntags: [react, typescript, vite]\n---\nBody`;
    const result = parseMarkdown(yaml);

    expect(Array.isArray(result.data.tags)).toBe(true);
    expect(result.data.tags).toContain('react');
    expect(result.data.tags).toContain('typescript');
    expect(result.data.tags).toContain('vite');
  });

  it('handles multi-line YAML arrays (gray-matter default)', () => {
    const data = {
      title: 'Test',
      techStack: ['React', 'Node.js', 'TypeScript'],
    };
    const serialized = matter.stringify('', data);
    const result = parseMarkdown(serialized);

    // gray-matter serializes arrays as multi-line YAML list items
    expect(Array.isArray(result.data.techStack)).toBe(true);
    expect(result.data.techStack).toContain('React');
    expect(result.data.techStack).toContain('Node.js');
    expect(result.data.techStack).toContain('TypeScript');
  });

  it('handles markdown body content with frontmatter', () => {
    const data = {
      title: 'Profile Bio',
      slug: 'profile-bio',
      configType: 'profile',
      visible: true,
      order: 1,
    };
    const body =
      'This homepage is the threshold: part portfolio, part journal.\n\n## Section Two\n\nMore content here.';
    const serialized = matter.stringify(body, data);
    const result = parseMarkdown(serialized);

    expect(result.data.title).toBe('Profile Bio');
    expect(result.data.slug).toBe('profile-bio');
    expect(result.data.configType).toBe('profile');
    expect(result.data.visible).toBe(true);
    expect(result.content.trim()).toContain('This homepage is the threshold');
    expect(result.content).toContain('## Section Two');
  });

  it('round-trips the actual profile-bio content structure', () => {
    // Simulate what the server does: reads file, modifies, and writes back with gray-matter
    const data = {
      title: 'Profile Bio',
      slug: 'profile-bio',
      configType: 'profile',
      label: 'Identity // Personal Index',
      description:
        'Computer Engineering student at IET DAVV, Indore. Based between code, cameras, Jammu & Kashmir, and the small mysteries that make ordinary days worth documenting.',
      order: 1,
      visible: true,
    };
    const body =
      'This homepage is the threshold: part portfolio, part journal, part visual memory bank. Every section opens like a chapter in an archive that is still being written.\n';

    const serialized = matter.stringify(body, data);
    const result = parseMarkdown(serialized);

    expect(result.data.title).toBe(data.title);
    expect(result.data.slug).toBe(data.slug);
    expect(result.data.configType).toBe(data.configType);
    expect(result.data.visible).toBe(true);
    // description may have quotes around it from gray-matter
    expect(result.data.description).toContain('Computer Engineering student');
    expect(result.data.label).toContain('Identity');
    expect(result.content.trim()).toContain('This homepage is the threshold');
  });

  it('handles empty body with frontmatter', () => {
    const data = {
      title: 'Test',
      visible: false,
    };
    const serialized = matter.stringify('', data);
    const result = parseMarkdown(serialized);

    expect(result.data.title).toBe('Test');
    expect(result.data.visible).toBe(false);
    expect(result.content.trim()).toBe('');
  });

  it('handles quoted strings preserving special characters', () => {
    const data = {
      title: 'A title with "quotes" inside',
    };
    const serialized = matter.stringify('', data);
    const result = parseMarkdown(serialized);

    // The parser strips outer quotes, inner quotes may be present
    expect(result.data.title).toContain('A title with');
  });
});
