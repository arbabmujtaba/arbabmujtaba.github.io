/**
 * GalleryField - manages an array of image URLs with add/remove/reorder.
 * Each entry shows a thumbnail preview.
 */

import { useState, useRef, useCallback } from 'react';
import { Plus, X, GripVertical, Upload } from 'lucide-react';

interface GalleryFieldProps {
  name: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  collection: string;
  required?: boolean;
  error?: string;
}

export default function GalleryField({
  name,
  label,
  value,
  onChange,
  collection,
  required,
  error,
}: GalleryFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('collection', collection);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        onChange([...value, data.url]);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    },
    [collection, onChange, value]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const addUrl = () => {
    if (newUrl.trim()) {
      onChange([...value, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...value];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index === value.length - 1) return;
    const updated = [...value];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">
        {label} ({value.length})
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>

      {/* Gallery Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div
              key={`${name}-${idx}`}
              className="relative group border border-zinc-700 rounded-md overflow-hidden aspect-square bg-zinc-900"
            >
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  className="p-1 text-zinc-300 hover:text-white"
                  title="Move up"
                >
                  <GripVertical size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="p-1 text-red-400 hover:text-red-300"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add URL */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="Add image URL..."
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <Upload size={14} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
