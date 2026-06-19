/**
 * migrate-sections.ts
 *
 * Idempotent, non-destructive migration script.
 * Ensures every singleton section defined in sections.ts has a backing
 * content file. Creates missing files from seed templates, then syncs
 * content-state.json to reflect the filesystem.
 *
 * Usage: npx tsx scripts/migrate-sections.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { SECTIONS, type SectionDef } from '../src/lib/sections';
import { syncRegistry } from '../src/lib/contentState';

// ============================================================
// TYPES
// ============================================================

export interface MigrationResult {
  created: string[];
  existing: string[];
  errors: string[];
  registrySync: { added: number; removed: number; total: number };
}

// ============================================================
// SEED TEMPLATES
// ============================================================

/**
 * Generates seed frontmatter content for a singleton section.
 * Minimal valid frontmatter with title and slug.
 */
function buildSeedContent(section: SectionDef): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${section.title}`);
  lines.push(`slug: ${section.slug}`);

  // Add headline field for page hero singletons
  if (section.fields.some(f => f.name === 'headline')) {
    lines.push(`headline: "${section.title}"`);
  }

  // Add configType if the section has a filter with configType
  if (section.filter && 'configType' in section.filter) {
    lines.push(`configType: ${section.filter.configType}`);
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

// ============================================================
// CORE MIGRATION LOGIC (exported for testing)
// ============================================================

/**
 * Runs the full migration: ensures singleton backing files exist,
 * then syncs the content registry. Idempotent and non-destructive.
 *
 * @param rootDir - Project root directory (defaults to process.cwd())
 * @returns MigrationResult with details of what was created/skipped
 */
export async function runMigration(rootDir?: string): Promise<MigrationResult> {
  const projectRoot = rootDir ?? process.cwd();
  const contentDir = path.join(projectRoot, 'content');

  const created: string[] = [];
  const existing: string[] = [];
  const errors: string[] = [];

  // Process only singleton sections (they have a fixed slug)
  const singletons = SECTIONS.filter(s => s.kind === 'singleton');

  for (const section of singletons) {
    const filePath = path.join(contentDir, section.collection, `${section.slug}.md`);
    const relativePath = `content/${section.collection}/${section.slug}.md`;

    try {
      if (await fs.pathExists(filePath)) {
        existing.push(relativePath);
      } else {
        // Ensure collection directory exists
        await fs.ensureDir(path.join(contentDir, section.collection));
        // Write seed file (non-destructive: only creates, never overwrites)
        await fs.writeFile(filePath, buildSeedContent(section), 'utf-8');
        created.push(relativePath);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${relativePath}: ${message}`);
    }
  }

  // Sync content-state.json to include new files
  const registrySync = await syncRegistry();

  // Validate: check that every singleton can be resolved
  for (const section of singletons) {
    const filePath = path.join(contentDir, section.collection, `${section.slug}.md`);
    if (!(await fs.pathExists(filePath))) {
      errors.push(`Orphan section "${section.id}": backing file missing after migration`);
    }
  }

  return { created, existing, errors, registrySync };
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

async function main() {
  console.log('Section Migration Script');
  console.log('========================\n');

  const result = await runMigration();

  if (result.created.length > 0) {
    console.log(`Created ${result.created.length} file(s):`);
    for (const f of result.created) {
      console.log(`  + ${f}`);
    }
  } else {
    console.log('No new files created (all singletons already exist).');
  }

  if (result.existing.length > 0) {
    console.log(`\nExisting ${result.existing.length} file(s) (unchanged):`);
    for (const f of result.existing) {
      console.log(`  = ${f}`);
    }
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const e of result.errors) {
      console.log(`  ! ${e}`);
    }
    process.exit(1);
  }

  console.log(`\nRegistry sync: +${result.registrySync.added} added, -${result.registrySync.removed} removed, ${result.registrySync.total} total`);
  console.log('\nMigration complete.');
}

// Only run CLI when executed directly (not imported)
const isDirectRun = process.argv[1]?.endsWith('migrate-sections.ts') ||
  process.argv[1]?.includes('migrate-sections');

if (isDirectRun) {
  main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
