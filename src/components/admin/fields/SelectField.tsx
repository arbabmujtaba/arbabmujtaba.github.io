/**
 * SelectField - dropdown from options array.
 */

import { ChevronDown } from 'lucide-react';

interface SelectFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

export default function SelectField({
  name,
  label,
  value,
  onChange,
  options,
  required,
  error,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-zinc-900 border rounded-md px-3 py-2 pr-8 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
            error ? 'border-red-500' : 'border-zinc-700'
          }`}
        >
          <option value="">Select {label}...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
