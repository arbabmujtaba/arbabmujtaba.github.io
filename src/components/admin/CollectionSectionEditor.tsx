/**
 * CollectionSectionEditor
 *
 * Manages a collection of items for a section:
 * - Fetches items from GET /api/sections/:id/items
 * - Displays items as cards (title, status badge, thumbnail, order)
 * - Inline expand-to-edit via FieldRenderer
 * - Preview pane shows when an item is expanded for editing
 * - Add New (auto-applies section filter values as defaults)
 * - Delete with confirmation dialog
 * - Reorder via up/down arrows (swaps order field values)
 * - Publish button triggers the publishing pipeline
 * - Revert re-fetches from server
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  X,
  Save,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Rocket,
  RotateCcw,
} from 'lucide-react';
import type { SectionDef } from '../../lib/sections';
import { resolvePreviewUrl, buildPublishPayload, startPublish, fetchContentForRevert } from '../../lib/preview';
import FieldRenderer from './fields/FieldRenderer';
import StatusBadge from '../StatusBadge';
import PreviewPane from './PreviewPane';
import PublishingModal from '../PublishingModal';

// ============================================================
// Types
// ============================================================

interface CollectionItem {
  slug: string;
  data: Record<string, any>;
  body: string;
  filePath?: string;
}

interface CollectionSectionEditorProps {
  section: SectionDef;
}

// ============================================================
// Pure logic helpers (exported for testing)
// ============================================================

export function buildNewItemDefaults(
  filter: Record<string, string | string[]> | undefined,
  fields: { name: string; type: string; required: boolean }[]
): Record<string, any> {
  const defaults: Record<string, any> = {};

  // Apply filter values as defaults
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      defaults[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  // Set date to today if field exists
  const hasDateField = fields.some((f) => f.name === 'date');
  if (hasDateField) {
    defaults.date = new Date().toISOString().split('T')[0];
  }

  // Set order to 0 if field exists (will be adjusted by caller)
  const hasOrderField = fields.some((f) => f.name === 'order');
  if (hasOrderField) {
    defaults.order = 0;
  }

  // Set visible to true if field exists
  const hasVisibleField = fields.some((f) => f.name === 'visible');
  if (hasVisibleField) {
    defaults.visible = true;
  }

  return defaults;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function swapOrder(
  items: CollectionItem[],
  index: number,
  direction: 'up' | 'down'
): { itemA: CollectionItem; itemB: CollectionItem } | null {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }

  const itemA = items[index];
  const itemB = items[targetIndex];

  const orderA = itemA.data.order ?? index;
  const orderB = itemB.data.order ?? targetIndex;

  return {
    itemA: { ...itemA, data: { ...itemA.data, order: orderB } },
    itemB: { ...itemB, data: { ...itemB.data, order: orderA } },
  };
}

export function removeItem(items: CollectionItem[], slug: string): CollectionItem[] {
  return items.filter((item) => item.slug !== slug);
}

// ============================================================
// Component
// ============================================================

export default function CollectionSectionEditor({ section }: CollectionSectionEditorProps) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastSaved, setLastSaved] = useState(0);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishJobId, setPublishJobId] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);

  // Fetch items for this section
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/sections/${section.id}/items`);
      if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
      const data: CollectionItem[] = await res.json();

      // Sort by order field if present, otherwise by title
      const sorted = [...data].sort((a, b) => {
        if (typeof a.data.order === 'number' && typeof b.data.order === 'number') {
          return a.data.order - b.data.order;
        }
        return (a.data.title || '').localeCompare(b.data.title || '');
      });

      setItems(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [section.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Expand a card for inline editing
  const handleExpand = (item: CollectionItem) => {
    if (expandedSlug === item.slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(item.slug);
    setEditData({ ...item.data });
    setEditBody(item.body || '');
  };

  // Field change handler for expanded item
  const handleFieldChange = (fieldName: string, value: any) => {
    setEditData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleBodyChange = (value: string) => {
    setEditBody(value);
  };

  // Save expanded item
  const handleSave = async () => {
    if (!expandedSlug) return;
    setSaving(true);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: section.collection,
          slug: expandedSlug,
          data: editData,
          body: editBody,
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.slug === expandedSlug
            ? { ...item, data: { ...editData }, body: editBody }
            : item
        )
      );
      setLastSaved(Date.now());
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Revert expanded item from server
  const handleRevert = async () => {
    if (!expandedSlug) return;
    setReverting(true);
    try {
      const result = await fetchContentForRevert(section.collection, expandedSlug);
      setEditData({ ...result.data });
      setEditBody(result.body);
      // Also update the item in local state
      setItems((prev) =>
        prev.map((item) =>
          item.slug === expandedSlug
            ? { ...item, data: { ...result.data }, body: result.body }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message || 'Revert failed');
    } finally {
      setReverting(false);
    }
  };

  // Publish expanded item
  const handlePublish = async () => {
    if (!expandedSlug) return;
    try {
      const payload = buildPublishPayload(section.collection, expandedSlug, editData, editBody);
      const jobId = await startPublish(payload);
      setPublishJobId(jobId);
      setPublishModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Publish failed');
    }
  };

  // Add new item
  const handleAddNew = async () => {
    setCreating(true);
    setError('');

    const defaults = buildNewItemDefaults(section.filter, section.fields);

    // Calculate next order value
    const maxOrder = items.reduce(
      (max, item) => Math.max(max, typeof item.data.order === 'number' ? item.data.order : 0),
      0
    );
    if (defaults.order !== undefined) {
      defaults.order = maxOrder + 1;
    }

    defaults.title = 'New Item';

    const slug = generateSlug(`new-item-${Date.now()}`);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: section.collection,
          slug,
          data: defaults,
          body: '',
        }),
      });

      if (!res.ok) throw new Error(`Create failed: ${res.status}`);

      await fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  // Delete item
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/content/${section.collection}/${deleteTarget}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setItems((prev) => removeItem(prev, deleteTarget));
      if (expandedSlug === deleteTarget) {
        setExpandedSlug(null);
      }
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Reorder item
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const result = swapOrder(items, index, direction);
    if (!result) return;

    const { itemA, itemB } = result;

    // Optimistically update local state
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.slug === itemA.slug) return itemA;
        if (item.slug === itemB.slug) return itemB;
        return item;
      });
      return updated.sort((a, b) => {
        if (typeof a.data.order === 'number' && typeof b.data.order === 'number') {
          return a.data.order - b.data.order;
        }
        return (a.data.title || '').localeCompare(b.data.title || '');
      });
    });

    // Save both items
    try {
      await Promise.all([
        fetch('/api/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: section.collection,
            slug: itemA.slug,
            data: itemA.data,
            body: itemA.body,
          }),
        }),
        fetch('/api/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection: section.collection,
            slug: itemB.slug,
            data: itemB.data,
            body: itemB.body,
          }),
        }),
      ]);
    } catch (err: any) {
      setError(err.message || 'Reorder failed');
      // Refresh to get server state
      await fetchItems();
    }
  };

  // Get thumbnail URL for an item
  const getThumbnail = (item: CollectionItem): string | null => {
    return item.data.coverImage || item.data.image || item.data.projectImage || null;
  };

  // Separate body field from frontmatter fields for editing
  const frontmatterFields = section.fields.filter((f) => f.name !== 'body');
  const bodyField = section.fields.find((f) => f.name === 'body');

  // Resolve preview URL for expanded item
  const expandedPreviewUrl = expandedSlug
    ? resolvePreviewUrl(section, expandedSlug)
    : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading items...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* List/Editor Panel */}
        <div className="flex-1 lg:w-[60%] lg:flex-none overflow-y-auto">
          <div className="p-6 md:p-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase text-zinc-600">
                    {section.page}
                  </span>
                  <span className="text-zinc-700">/</span>
                  <span className="text-xs font-mono text-zinc-500">
                    {section.id}
                  </span>
                </div>
                <h1 className="font-serif text-2xl text-zinc-100">
                  {section.title}
                </h1>
                {section.description && (
                  <p className="text-sm text-zinc-500 mt-1">
                    {section.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                disabled={creating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Add New
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mb-4 p-3 border border-red-500/30 rounded-lg bg-red-500/5 text-red-400 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Items Count */}
            <div className="text-xs text-zinc-600 mb-3">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.slug}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30"
                  >
                    {/* Card Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                      onClick={() => handleExpand(item)}
                    >
                      {/* Thumbnail */}
                      {getThumbnail(item) ? (
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                          <img
                            src={getThumbnail(item)!}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded flex-shrink-0 bg-zinc-800 flex items-center justify-center">
                          <ImageIcon size={14} className="text-zinc-600" />
                        </div>
                      )}

                      {/* Title + Meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-200 truncate">
                            {item.data.title || item.slug}
                          </span>
                          <StatusBadge state={item.data.state} />
                        </div>
                        {item.data.category && (
                          <span className="text-xs text-zinc-600">
                            {item.data.category}
                          </span>
                        )}
                      </div>

                      {/* Order badge */}
                      {typeof item.data.order === 'number' && (
                        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                          #{item.data.order}
                        </span>
                      )}

                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleReorder(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Expand indicator */}
                      <Edit3
                        size={13}
                        className={`text-zinc-600 transition-colors ${
                          expandedSlug === item.slug ? 'text-orange-500' : ''
                        }`}
                      />
                    </div>

                    {/* Expanded Edit Form */}
                    <AnimatePresence>
                      {expandedSlug === item.slug && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
                            <div className="space-y-4">
                              {frontmatterFields.map((field) => (
                                <FieldRenderer
                                  key={field.name}
                                  field={field}
                                  value={editData[field.name]}
                                  onChange={(val) => handleFieldChange(field.name, val)}
                                  collection={section.collection}
                                />
                              ))}

                              {bodyField && (
                                <div className="pt-3 border-t border-zinc-800/50">
                                  <FieldRenderer
                                    field={bodyField}
                                    value={editBody}
                                    onChange={handleBodyChange}
                                    collection={section.collection}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item.slug)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-colors"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleRevert}
                                  disabled={reverting}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {reverting ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <RotateCcw size={12} />
                                  )}
                                  Revert
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedSlug(null)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                  <X size={12} />
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSave}
                                  disabled={saving}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {saving ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Save size={12} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handlePublish}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md transition-colors"
                                >
                                  <Rocket size={12} />
                                  Publish
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {items.length === 0 && !error && (
                <div className="text-center py-12 text-zinc-600">
                  <p className="text-sm">No items in this section yet.</p>
                  <p className="text-xs mt-1">Click "Add New" to create the first one.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Pane (shows when an item is expanded) */}
        {expandedSlug && expandedPreviewUrl && (
          <div className="h-64 lg:h-auto lg:flex-1 border-t lg:border-t-0">
            <PreviewPane previewUrl={expandedPreviewUrl} lastSaved={lastSaved} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif text-zinc-100 mb-2">
                Delete this item?
              </h3>
              <p className="text-sm text-zinc-400 mb-6">
                This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publishing Modal */}
      <PublishingModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        jobId={publishJobId}
      />
    </>
  );
}
