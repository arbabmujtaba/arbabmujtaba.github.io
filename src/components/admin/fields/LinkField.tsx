/**
 * LinkField - URL input with external link icon and optional open button.
 */

import { ExternalLink } from 'lucide-react';

interface LinkFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function LinkField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
}: LinkFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          id={name}
          name={name}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://...'}
          className={`flex-1 bg-zinc-900 border rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            error ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-orange-400 transition-colors"
            title="Open link"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
