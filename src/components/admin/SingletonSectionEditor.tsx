/**
 * SingletonSectionEditor
 *
 * Loads a singleton section's item via GET /api/content/:collection/:slug,
 * renders fields via FieldRenderer based on section.fields,
 * provides Save (PUT /api/content) and Revert (re-fetch) buttons.
 * Shows save status indicator (idle/saving/success/error).
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Save, RotateCcw, Loader2, Check, AlertCircle } from 'lucide-react';
import type { SectionDef } from '../../lib/sections';
import FieldRenderer from './fields/FieldRenderer';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface SingletonSectionEditorProps {
  section: SectionDef;
}

export default function SingletonSectionEditor({ section }: SingletonSectionEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [body, setBody] = useState('');
  const [originalBody, setOriginalBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const slug = section.slug!;
  const collection = section.collection;

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${collection}/${slug}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const result = await res.json();

      const frontmatter = result.data || {};
      const contentBody = result.body || '';

      setFormData({ ...frontmatter });
      setOriginalData({ ...frontmatter });
      setBody(contentBody);
      setOriginalBody(contentBody);
      setSaveStatus('idle');
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load content');
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }, [collection, slug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setSaveStatus('idle');
  }, []);

  const handleBodyChange = useCallback((value: string) => {
    setBody(value);
    setSaveStatus('idle');
  }, []);

  const hasChanges = () => {
    return (
      JSON.stringify(formData) !== JSON.stringify(originalData) ||
      body !== originalBody
    );
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          slug,
          data: formData,
          body,
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      setOriginalData({ ...formData });
      setOriginalBody(body);
      setSaveStatus('success');

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Save failed');
      setSaveStatus('error');
    }
  };

  const handleRevert = () => {
    setFormData({ ...originalData });
    setBody(originalBody);
    setSaveStatus('idle');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading content...</span>
        </div>
      </div>
    );
  }

  // Separate body field from frontmatter fields
  const frontmatterFields = section.fields.filter((f) => f.name !== 'body');
  const bodyField = section.fields.find((f) => f.name === 'body');

  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="p-6 md:p-8 max-w-3xl"
      >
        {/* Header with Save/Revert */}
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
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <StatusIndicator status={saveStatus} message={errorMessage} />

            <button
              type="button"
              onClick={handleRevert}
              disabled={!hasChanges()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={13} />
              Revert
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges() || saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {frontmatterFields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={(val) => handleFieldChange(field.name, val)}
              collection={collection}
            />
          ))}

          {/* Body field rendered separately (full width, at bottom) */}
          {bodyField && (
            <div className="pt-4 border-t border-zinc-800">
              <FieldRenderer
                field={bodyField}
                value={body}
                onChange={handleBodyChange}
                collection={collection}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatusIndicator({
  status,
  message,
}: {
  status: SaveStatus;
  message: string;
}) {
  if (status === 'idle') return null;

  return (
    <span
      className={`flex items-center gap-1 text-xs ${
        status === 'saving'
          ? 'text-zinc-400'
          : status === 'success'
            ? 'text-green-400'
            : 'text-red-400'
      }`}
    >
      {status === 'saving' && <Loader2 size={12} className="animate-spin" />}
      {status === 'success' && <Check size={12} />}
      {status === 'error' && <AlertCircle size={12} />}
      {status === 'saving' && 'Saving...'}
      {status === 'success' && 'Saved'}
      {status === 'error' && (message || 'Error')}
    </span>
  );
}
