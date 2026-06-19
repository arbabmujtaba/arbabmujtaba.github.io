/**
 * ImageField - image URL input with preview and drag-drop upload.
 * POSTs to /api/upload with multipart form data.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  collection: string;
  required?: boolean;
  error?: string;
}

export default function ImageField({
  name,
  label,
  value,
  onChange,
  collection,
  required,
  error,
}: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
        onChange(data.url);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    },
    [collection, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>

      {/* URL Input */}
      <div className="flex gap-2">
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or drop a file below"
          className={`flex-1 bg-zinc-900 border rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            error ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear image"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-orange-500 bg-orange-500/5'
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        {uploading ? (
          <p className="text-sm text-zinc-400">Uploading...</p>
        ) : value ? (
          <div className="flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              className="max-h-32 rounded object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            {dragOver ? (
              <Upload size={20} className="text-orange-500" />
            ) : (
              <ImageIcon size={20} className="text-zinc-600" />
            )}
            <p className="text-xs text-zinc-500">
              Drop an image here or click to upload
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
