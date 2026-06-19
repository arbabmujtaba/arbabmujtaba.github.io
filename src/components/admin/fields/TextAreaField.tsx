/**
 * TextAreaField - multi-line textarea with auto-resize and character count.
 */

import { useRef, useEffect } from 'react';

interface TextAreaFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function TextAreaField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: TextAreaFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(80, el.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="text-orange-500 ml-0.5">*</span>}
        </label>
        <span className="text-xs text-zinc-600">{value.length} chars</span>
      </div>
      <textarea
        ref={textareaRef}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full bg-zinc-900 border rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none ${
          error ? 'border-red-500' : 'border-zinc-700'
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
