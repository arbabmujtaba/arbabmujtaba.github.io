/**
 * DateField - date input (type='date') with formatted display.
 */

interface DateFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export default function DateField({
  name,
  label,
  value,
  onChange,
  required,
  error,
}: DateFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-zinc-900 border rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
          error ? 'border-red-500' : 'border-zinc-700'
        }`}
      />
      {value && (
        <p className="text-xs text-zinc-500">
          {new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
