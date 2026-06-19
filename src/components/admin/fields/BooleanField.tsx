/**
 * BooleanField - toggle switch with label.
 */

interface BooleanFieldProps {
  name: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
}

export default function BooleanField({
  name,
  label,
  value,
  onChange,
  error,
}: BooleanFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
        <button
          type="button"
          id={name}
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
            value ? 'bg-orange-500' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              value ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
