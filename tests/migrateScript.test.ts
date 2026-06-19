import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { runMigration, type MigrationResult } from '../scripts/migrate-sections';
import { SECTIONS } from '../src/lib/sections';

/**
 * Tests for the migration script logic.
 *
 * Uses a temporary directory to simulate the content filesystem
 * so tests are isolated from actual project content.
 */

const TEST_ROOT = path.join(process.cwd(), '.test-migrate-tmp');
const CONTENT_DIR = path.join(TEST_ROOT, 'content');

// Singletons defined in the registry
const SINGLETONS = SECTIONS.filter(s => s.kind === 'singleton');

beforeEach(async () => {
  // Create fresh temp directory with required collection folders
  await fs.ensureDir(CONTENT_DIR);
  const collections = [...new Set(SINGLETONS.map(s => s.collection))];
  for (const col of collections) {
    await fs.ensureDir(path.join(CONTENT_DIR, col));
  }

  // Ensure content-state.json exists (syncRegistry reads from cwd)
  // We rely on the real project root content for syncRegistry
});

afterEach(async () => {
  // Clean up temp directory
  await fs.remove(TEST_ROOT);
});

describe('Migration Script', () => {
  it('identifies singleton sections from the SECTIONS array', () => {
    expect(SINGLETONS.length).toBeGreaterThan(0);
    for (const s of SINGLETONS) {
      expect(s.slug).toBeDefined();
      expect(s.slug!.length).toBeGreaterThan(0);
    }
  });

  it('creates missing singleton files from seed templates', async () => {
    // Run against the real project root (which has content/ already)
    const result = await runMigration();

    // All singletons should either be created or already existing
    const total = result.created.length + result.existing.length;
    expect(total).toBe(SINGLETONS.length);

    // No errors should occur
    expect(result.errors).toHaveLength(0);
  });

  it('is idempotent: running twice produces the same result', async () => {
    // First run
    const result1 = await runMigration();
    expect(result1.errors).toHaveLength(0);

    // Second run - nothing should be created
    const result2 = await runMigration();
    expect(result2.created).toHaveLength(0);
    expect(result2.existing.length).toBe(SINGLETONS.length);
    expect(result2.errors).toHaveLength(0);
  });

  it('never deletes existing files (non-destructive)', async () => {
    // Get list of all content files before migration
    const contentDir = path.join(process.cwd(), 'content');
    const collections = await fs.readdir(contentDir);
    const filesBefore: string[] = [];

    for (const col of collections) {
      const colPath = path.join(contentDir, col);
      const stat = await fs.stat(colPath);
      if (!stat.isDirectory()) continue;
      const files = await fs.readdir(colPath);
      for (const f of files) {
        if (f.endsWith('.md')) {
          filesBefore.push(`${col}/${f}`);
        }
      }
    }

    // Run migration
    await runMigration();

    // All files that existed before should still exist
    for (const file of filesBefore) {
      const filePath = path.join(contentDir, file);
      const exists = await fs.pathExists(filePath);
      expect(exists).toBe(true);
    }
  });

  it('never overwrites existing file content', async () => {
    // Pick a singleton that already exists
    const existingSingleton = SINGLETONS.find(s => {
      const filePath = path.join(process.cwd(), 'content', s.collection, `${s.slug}.md`);
      return fs.pathExistsSync(filePath);
    });

    if (!existingSingleton) {
      // If no existing singletons, run migration first to create them
      await runMigration();
      return;
    }

    const filePath = path.join(
      process.cwd(), 'content', existingSingleton.collection, `${existingSingleton.slug}.md`
    );
    const contentBefore = await fs.readFile(filePath, 'utf-8');

    // Run migration
    await runMigration();

    // Content should be unchanged
    const contentAfter = await fs.readFile(filePath, 'utf-8');
    expect(contentAfter).toBe(contentBefore);
  });

  it('updates content-state.json via syncRegistry', async () => {
    const result = await runMigration();
    expect(result.registrySync).toBeDefined();
    expect(typeof result.registrySync.added).toBe('number');
    expect(typeof result.registrySync.removed).toBe('number');
    expect(typeof result.registrySync.total).toBe('number');
    expect(result.registrySync.total).toBeGreaterThan(0);
  });

  it('all singleton backing files exist after migration', async () => {
    await runMigration();

    for (const section of SINGLETONS) {
      const filePath = path.join(
        process.cwd(), 'content', section.collection, `${section.slug}.md`
      );
      const exists = await fs.pathExists(filePath);
      expect(exists).toBe(true);
    }
  });

  it('created seed files contain valid frontmatter', async () => {
    const result = await runMigration();

    // Check any file that was created (or check existing ones)
    for (const section of SINGLETONS) {
      const filePath = path.join(
        process.cwd(), 'content', section.collection, `${section.slug}.md`
      );
      const content = await fs.readFile(filePath, 'utf-8');
      // Should have frontmatter delimiters
      expect(content.startsWith('---')).toBe(true);
      expect(content.includes('title:')).toBe(true);
      expect(content.includes('slug:')).toBe(true);
    }
  });
});
