/**
 * Content State Management Library
 * 
 * Manages the publishing lifecycle for all content items across collections.
 * Tracks state transitions (draft -> review -> published -> archived),
 * maintains version history, and persists state in content-state.json.
 * 
 * @module contentState
 */

import fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';

const DEBUG = process.env.DEBUG === 'true';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Valid content states in the publishing workflow
 */
export type ContentState = 'draft' | 'review' | 'published' | 'archived';

/**
 * A version entry recording a state transition
 */
export interface VersionEntry {
  version: number;
  state: ContentState;
  timestamp: string;          // ISO date string
  commitHash?: string;        // Git commit hash when published
  notes?: string;             // Optional transition notes
}

/**
 * A single content item with full state metadata
 */
export interface ContentItem {
  id: string;                 // Generated: collection/slug
  collection: string;         // e.g. 'journal', 'portfolio'
  slug: string;               // URL-friendly slug
  title: string;              // Display title
  state: ContentState;        // Current workflow state
  versions: VersionEntry[];   // Publishing history
  unsavedChanges: boolean;    // Tracks if editor has uncommitted edits
  createdAt: string;          // ISO date
  updatedAt: string;          // ISO date
  publishedAt?: string;       // ISO date (only when published)
  lastReviewedAt?: string;    // ISO date (only when moved to review)
  archivedAt?: string;        // ISO date (only when archived)
  filePath: string;           // Relative path to markdown file
}

/**
 * The complete content registry tracking all items
 */
export interface ContentRegistry {
  items: ContentItem[];
  lastUpdated: string;
  version: 1;                 // Schema version for migrations
}

/**
 * Options for state transitions
 */
export interface TransitionOptions {
  notes?: string;             // Optional notes for version history
  commitHash?: string;        // Git commit hash (auto-detected if not provided)
}

/**
 * Error thrown when an invalid state transition is attempted
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly fromState: ContentState,
    public readonly toState: ContentState,
    public readonly collection: string,
    public readonly slug: string
  ) {
    super(`Invalid state transition: '${fromState}' -> '${toState}' for ${collection}/${slug}. Check valid transitions.`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Error thrown when a content item is not found
 */
export class ContentNotFoundError extends Error {
  constructor(public readonly collection: string, public readonly slug: string) {
    super(`Content item not found: ${collection}/${slug}`);
    this.name = 'ContentNotFoundError';
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const REGISTRY_FILENAME = 'content-state.json';
const CONTENT_DIR = path.join(process.cwd(), 'content');
const SUPPORTED_COLLECTIONS = ['journal', 'tech', 'photography', 'collection', 'portfolio'];

/**
 * Valid state transitions map
 * Key: current state, Value: array of allowed next states
 */
const VALID_TRANSITIONS: Record<ContentState, ContentState[]> = {
  draft: ['review'],                          // New content starts as draft
  review: ['published', 'draft'],             // Review can be approved or rejected
  published: ['archived'],                    // Published can be archived
  archived: ['draft'],                        // Archived can be unarchived (returns to draft)
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generates a unique content ID from collection and slug
 */
function generateId(collection: string, slug: string): string {
  return `${collection}/${slug}`;
}

/**
 * Gets the current git commit hash if available
 */
function getGitCommitHash(): string | undefined {
  try {
    const hash = execSync('git rev-parse HEAD 2>/dev/null', { encoding: 'utf-8' }).trim();
    return hash || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Gets the absolute path to the registry file
 */
function getRegistryPath(): string {
  return path.join(process.cwd(), REGISTRY_FILENAME);
}

/**
 * Performs an atomic write operation (write to temp file, then rename)
 */
async function atomicWrite(filepath: string, data: string): Promise<void> {
  const tempPath = `${filepath}.tmp-${Date.now()}`;
  await fs.writeFile(tempPath, data, 'utf-8');
  await fs.rename(tempPath, filepath);
}

// ============================================================
// STATE TRANSITION VALIDATION
// ============================================================

/**
 * Validates if a state transition is allowed
 * 
 * @param fromState - Current state
 * @param toState - Desired state
 * @returns true if transition is valid
 */
export function isValidTransition(fromState: ContentState, toState: ContentState): boolean {
  // Any new content starts as draft
  if (toState === 'draft' && fromState === toState) {
    return true;
  }
  return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

/**
 * Asserts a valid state transition, throws if invalid
 * 
 * @param fromState - Current state
 * @param toState - Desired state
 * @param collection - Collection name (for error message)
 * @param slug - Content slug (for error message)
 * @throws {InvalidTransitionError} If transition is not allowed
 */
export function assertValidTransition(
  fromState: ContentState,
  toState: ContentState,
  collection: string,
  slug: string
): void {
  if (!isValidTransition(fromState, toState)) {
    throw new InvalidTransitionError(fromState, toState, collection, slug);
  }
}

// ============================================================
// REGISTRY OPERATIONS
// ============================================================

/**
 * Loads the content registry from disk or creates an empty one
 * 
 * @returns The content registry
 */
export async function ensureRegistry(): Promise<ContentRegistry> {
  const registryPath = getRegistryPath();
  
  if (await fs.pathExists(registryPath)) {
    const raw = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(raw) as ContentRegistry;
    return registry;
  }
  
  // Create empty registry
  return {
    items: [],
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Persists the registry to disk atomically
 * 
 * @param registry - The registry to save
 */
async function saveRegistry(registry: ContentRegistry): Promise<void> {
  const registryPath = getRegistryPath();
  registry.lastUpdated = new Date().toISOString();
  const raw = JSON.stringify(registry, null, 2);
  await atomicWrite(registryPath, raw);
}

// ============================================================
// CONTENT SCANNING
// ============================================================

/**
 * Scans the content directory and builds ContentItem entries from markdown files
 * 
 * @returns Array of ContentItem objects from existing files
 */
export async function scanContentDir(): Promise<ContentItem[]> {
  const items: ContentItem[] = [];
  const now = new Date().toISOString();
  
  for (const collection of SUPPORTED_COLLECTIONS) {
    const colDir = path.join(CONTENT_DIR, collection);
    
    if (!(await fs.pathExists(colDir))) {
      continue;
    }
    
    const files = await fs.readdir(colDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = path.join(colDir, file);
      const slug = file.replace('.md', '');
      
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(raw);
        
        const item: ContentItem = {
          id: generateId(collection, slug),
          collection,
          slug: data.slug || slug,
          title: data.title || data.projectImage ? (data.title || 'Untitled Project') : (data.title || 'Untitled'),
          state: 'published',  // Existing files are assumed published
          versions: [
            {
              version: 1,
              state: 'published',
              timestamp: data.date ? new Date(data.date).toISOString() : now,
            },
          ],
          unsavedChanges: false,
          createdAt: data.date ? new Date(data.date).toISOString() : now,
          updatedAt: data.date ? new Date(data.date).toISOString() : now,
          publishedAt: data.date ? new Date(data.date).toISOString() : now,
          filePath: `content/${collection}/${file}`,
        };
        
        items.push(item);
      } catch (error) {
        console.error(`Error scanning ${filePath}:`, error);
      }
    }
  }
  
  return items;
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

/**
 * Retrieves a content item by collection and slug
 * 
 * @param collection - The collection name
 * @param slug - The content slug
 * @returns The ContentItem or null if not found
 */
export async function getItem(collection: string, slug: string): Promise<ContentItem | null> {
  const registry = await ensureRegistry();
  return registry.items.find(item => item.collection === collection && item.slug === slug) ?? null;
}

/**
 * Saves or updates a content item in the registry
 * 
 * @param item - The content item to save
 */
export async function saveItem(item: ContentItem): Promise<void> {
  const registry = await ensureRegistry();
  
  const existingIndex = registry.items.findIndex(
    i => i.collection === item.collection && i.slug === item.slug
  );
  
  if (existingIndex >= 0) {
    registry.items[existingIndex] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    registry.items.push({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  await saveRegistry(registry);
}

/**
 * Creates a new content item (initial draft state)
 * 
 * @param collection - The collection name
 * @param slug - The content slug
 * @param title - The content title
 * @param filePath - Relative path to the markdown file
 * @returns The newly created ContentItem
 */
export async function createItem(
  collection: string,
  slug: string,
  title: string,
  filePath: string
): Promise<ContentItem> {
  const now = new Date().toISOString();
  
  const item: ContentItem = {
    id: generateId(collection, slug),
    collection,
    slug,
    title,
    state: 'draft',
    versions: [
      {
        version: 1,
        state: 'draft',
        timestamp: now,
      },
    ],
    unsavedChanges: false,
    createdAt: now,
    updatedAt: now,
    filePath,
  };
  
  await saveItem(item);
  return item;
}

/**
 * Deletes a content item from the registry
 * 
 * @param collection - The collection name
 * @param slug - The content slug
 * @throws {ContentNotFoundError} If item not found
 */
export async function deleteItem(collection: string, slug: string): Promise<void> {
  const registry = await ensureRegistry();
  
  const index = registry.items.findIndex(
    item => item.collection === collection && item.slug === slug
  );
  
  if (index < 0) {
    throw new ContentNotFoundError(collection, slug);
  }
  
  registry.items.splice(index, 1);
  await saveRegistry(registry);
}

/**
 * Transitions a content item to a new state with validation
 * 
 * @param collection - The collection name
 * @param slug - The content slug
 * @param newState - The target state
 * @param opts - Optional transition options (notes, commitHash)
 * @returns The updated ContentItem
 * @throws {ContentNotFoundError} If item not found
 * @throws {InvalidTransitionError} If transition is not valid
 */
export async function transitionState(
  collection: string,
  slug: string,
  newState: ContentState,
  opts?: TransitionOptions
): Promise<ContentItem> {
  const registry = await ensureRegistry();
  
  const itemIndex = registry.items.findIndex(
    item => item.collection === collection && item.slug === slug
  );
  
  if (itemIndex < 0) {
    throw new ContentNotFoundError(collection, slug);
  }
  
  const item = registry.items[itemIndex];
  const fromState = item.state;
  
  // Validate the transition
  assertValidTransition(fromState, newState, collection, slug);
  
  const now = new Date().toISOString();
  const nextVersion = (item.versions[item.versions.length - 1]?.version ?? 0) + 1;
  
  // Create new version entry
  const versionEntry: VersionEntry = {
    version: nextVersion,
    state: newState,
    timestamp: now,
    commitHash: opts?.commitHash ?? (newState === 'published' ? getGitCommitHash() : undefined),
    notes: opts?.notes,
  };
  
  // Update item with new state and timestamps
  const updatedItem: ContentItem = {
    ...item,
    state: newState,
    versions: [...item.versions, versionEntry],
    updatedAt: now,
    publishedAt: newState === 'published' ? now : item.publishedAt,
    lastReviewedAt: newState === 'review' ? now : item.lastReviewedAt,
    archivedAt: newState === 'archived' ? now : item.archivedAt,
  };
  
  registry.items[itemIndex] = updatedItem;
  await saveRegistry(registry);
  
  return updatedItem;
}

/**
 * Marks content as having unsaved changes
 * 
 * @param collection - The collection name
 * @param slug - The content slug
 * @param hasChanges - Whether there are uncommitted edits
 */
export async function markUnsavedChanges(
  collection: string,
  slug: string,
  hasChanges: boolean
): Promise<void> {
  const registry = await ensureRegistry();
  
  const itemIndex = registry.items.findIndex(
    item => item.collection === collection && item.slug === slug
  );
  
  if (itemIndex < 0) {
    return; // Silently ignore if item doesn't exist in registry
  }
  
  registry.items[itemIndex].unsavedChanges = hasChanges;
  await saveRegistry(registry);
}

// ============================================================
// QUERY FUNCTIONS
// ============================================================

/**
 * Gets all content items filtered by state
 * 
 * @param state - The state to filter by
 * @returns Array of ContentItems in the specified state
 */
export async function getItemsByState(state: ContentState): Promise<ContentItem[]> {
  const registry = await ensureRegistry();
  return registry.items.filter(item => item.state === state);
}

/**
 * Gets all content items in a collection
 * 
 * @param collection - The collection name
 * @returns Array of ContentItems in the collection
 */
export async function getItemsByCollection(collection: string): Promise<ContentItem[]> {
  const registry = await ensureRegistry();
  return registry.items.filter(item => item.collection === collection);
}

/**
 * Gets recent content items, optionally filtered by state
 * 
 * @param limit - Maximum number of items to return (default: 10)
 * @param state - Optional state filter
 * @returns Array of recent ContentItems
 */
export async function getRecentItems(
  limit: number = 10,
  state?: ContentState
): Promise<ContentItem[]> {
  const registry = await ensureRegistry();
  
  let items = registry.items;
  
  if (state) {
    items = items.filter(item => item.state === state);
  }
  
  // Sort by updatedAt descending
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  return items.slice(0, limit);
}

/**
 * Gets all content items
 * 
 * @returns All ContentItems in the registry
 */
export async function getAllItems(): Promise<ContentItem[]> {
  const registry = await ensureRegistry();
  return registry.items;
}

/**
 * Gets statistics about content states
 * 
 * @returns Object with counts per state
 */
export async function getStateStats(): Promise<Record<ContentState, number>> {
  const registry = await ensureRegistry();
  
  const stats: Record<ContentState, number> = {
    draft: 0,
    review: 0,
    published: 0,
    archived: 0,
  };
  
  for (const item of registry.items) {
    stats[item.state]++;
  }
  
  return stats;
}

// ============================================================
// MIGRATION
// ============================================================

/**
 * Migrates existing content files into the registry
 * 
 * This function:
 * 1. Scans the content/ directory for markdown files
 * 2. Creates registry entries for new files (marked as draft)
 * 3. Updates existing entries to match current file state
 * 4. Preserves version history for existing items
 * 
 * @param force - If true, re-scans all files even if registry exists
 * @returns Object with migration statistics
 */
export async function migrate(force: boolean = false): Promise<{
  totalItems: number;
  newItems: number;
  updatedItems: number;
  collections: string[];
}> {
  const registryPath = getRegistryPath();
  const registryExists = await fs.pathExists(registryPath);
  
  // If registry doesn't exist or force migration, scan and rebuild
  if (!registryExists || force) {
    if (DEBUG) console.log('[contentState] Scanning content directory...');
    const scannedItems = await scanContentDir();
    
    const newRegistry: ContentRegistry = {
      items: scannedItems,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
    
    await saveRegistry(newRegistry);
    
    if (DEBUG) console.log(`[contentState] Migration complete. ${scannedItems.length} items registered.`);
    
    return {
      totalItems: scannedItems.length,
      newItems: scannedItems.length,
      updatedItems: 0,
      collections: SUPPORTED_COLLECTIONS.filter(col => 
        scannedItems.some(item => item.collection === col)
      ),
    };
  }
  
  // Incremental migration: add new files, update existing
  const registry = await ensureRegistry();
  const existingPaths = new Set(registry.items.map(item => item.filePath));
  
  const scannedItems = await scanContentDir();
  let newCount = 0;
  let updatedCount = 0;
  const newPaths = new Set<string>();
  
  for (const scannedItem of scannedItems) {
    newPaths.add(scannedItem.filePath);
    
    const existingIndex = registry.items.findIndex(
      item => item.filePath === scannedItem.filePath
    );
    
    if (existingIndex < 0) {
      // New file - add to registry as draft
      registry.items.push({
        ...scannedItem,
        state: 'draft',
        versions: [
          {
            version: 1,
            state: 'draft',
            timestamp: new Date().toISOString(),
          },
        ],
        publishedAt: undefined,
      });
      newCount++;
    } else {
      // Update title and metadata if changed
      const existing = registry.items[existingIndex];
      if (existing.title !== scannedItem.title) {
        registry.items[existingIndex].title = scannedItem.title;
        updatedCount++;
      }
    }
  }
  
  // Remove entries for deleted files
  const deletedItems = registry.items.filter(item => !newPaths.has(item.filePath));
  for (const deleted of deletedItems) {
    const idx = registry.items.findIndex(item => item.id === deleted.id);
    if (idx >= 0) {
      registry.items.splice(idx, 1);
    }
  }
  
  await saveRegistry(registry);
  
  const updatedCollections = [...new Set(scannedItems.map(item => item.collection))];
  
  if (DEBUG) console.log(`[contentState] Migration complete. ${newCount} new, ${updatedCount} updated, ${deletedItems.length} removed.`);
  
  return {
    totalItems: registry.items.length,
    newItems: newCount,
    updatedItems: updatedCount,
    collections: updatedCollections,
  };
}

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Syncs the registry with the actual filesystem
 * Ensures all content files have registry entries
 * 
 * @returns Object with sync results
 */
export async function syncRegistry(): Promise<{
  added: number;
  removed: number;
  total: number;
}> {
  const registry = await ensureRegistry();
  const existingPaths = new Set(registry.items.map(i => i.filePath));
  const now = new Date().toISOString();
  
  let added = 0;
  let removed = 0;
  
  // Add missing files
  for (const collection of SUPPORTED_COLLECTIONS) {
    const colDir = path.join(CONTENT_DIR, collection);
    
    if (!(await fs.pathExists(colDir))) continue;
    
    const files = await fs.readdir(colDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = `content/${collection}/${file}`;
      
      if (!existingPaths.has(filePath)) {
        const slug = file.replace('.md', '');
        
        try {
          const raw = await fs.readFile(path.join(colDir, file), 'utf-8');
          const { data } = matter(raw);
          
          const item: ContentItem = {
            id: generateId(collection, slug),
            collection,
            slug: data.slug || slug,
            title: data.title || 'Untitled',
            state: 'draft',
            versions: [
              {
                version: 1,
                state: 'draft',
                timestamp: now,
              },
            ],
            unsavedChanges: false,
            createdAt: now,
            updatedAt: now,
            filePath,
          };
          
          registry.items.push(item);
          added++;
        } catch (error) {
          console.error(`Error reading ${filePath}:`, error);
        }
      }
    }
  }
  
  // Remove entries for deleted files
  const existingFiles = new Set<string>();
  for (const collection of SUPPORTED_COLLECTIONS) {
    const colDir = path.join(CONTENT_DIR, collection);
    if (await fs.pathExists(colDir)) {
      const files = await fs.readdir(colDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          existingFiles.add(`content/${collection}/${file}`);
        }
      }
    }
  }
  
  const toRemove = registry.items.filter(item => !existingFiles.has(item.filePath));
  for (const item of toRemove) {
    const idx = registry.items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      registry.items.splice(idx, 1);
      removed++;
    }
  }
  
  await saveRegistry(registry);
  
  return {
    added,
    removed,
    total: registry.items.length,
  };
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initializes the content state system
 * Should be called once at server startup
 * 
 * @param options - Initialization options
 * @returns The initialized registry
 */
export async function initialize(options: {
  autoMigrate?: boolean;
  forceMigrate?: boolean;
} = {}): Promise<ContentRegistry> {
  const { autoMigrate = true, forceMigrate = false } = options;
  
  const registryPath = getRegistryPath();
  const registryExists = await fs.pathExists(registryPath);
  
  if (!registryExists && autoMigrate) {
    if (DEBUG) console.log('[contentState] No registry found. Running initial migration...');
    await migrate(false);
  } else if (forceMigrate && registryExists) {
    if (DEBUG) console.log('[contentState] Force migration requested. Re-scanning content directory...');
    await migrate(true);
  }
  
  return ensureRegistry();
}

// ============================================================
// EXPORTS
// ============================================================

// Default export provides all functionality as a namespace-like object
const contentState = {
  // Types (for runtime access)
  ContentState: undefined as unknown as ContentState,
  ContentItem: undefined as unknown as ContentItem,
  VersionEntry: undefined as unknown as VersionEntry,
  ContentRegistry: undefined as unknown as ContentRegistry,
  TransitionOptions: undefined as unknown as TransitionOptions,
  
  // Error classes
  InvalidTransitionError,
  ContentNotFoundError,
  
  // State validation
  isValidTransition,
  assertValidTransition,
  
  // Registry operations
  ensureRegistry,
  
  // CRUD
  getItem,
  saveItem,
  createItem,
  deleteItem,
  transitionState,
  markUnsavedChanges,
  
  // Queries
  getItemsByState,
  getItemsByCollection,
  getRecentItems,
  getAllItems,
  getStateStats,
  
  // Migration & sync
  migrate,
  syncRegistry,
  initialize,
};

export default contentState;