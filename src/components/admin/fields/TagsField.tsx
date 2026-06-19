/**
 * TagsField - comma-separated tag input displayed as pills with add/remove.
 */

import { useState } from 'react';
import { X } from 'lucide-react';

interface TagsFieldProps {
  name: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function TagsField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: TagsFieldProps) {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>

      <div
        className={`flex flex-wrap gap-1.5 bg-zinc-900 border rounded-md px-3 py-2 min-h-[38px] focus-within:ring-1 focus-within:ring-orange-500 focus-within:border-orange-500 transition-colors ${
          error ? 'border-red-500' : 'border-zinc-700'
        }`}
      >
        {value.map((tag, idx) => (
          <span
            key={`${name}-tag-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-200 border border-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-zinc-500 hover:text-red-400 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          id={name}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? (placeholder || 'Add tags...') : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
        />
      </div>

      <p className="text-xs text-zinc-600">
        Press Enter or comma to add a tag
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
