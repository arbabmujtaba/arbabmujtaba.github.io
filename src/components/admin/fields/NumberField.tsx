/**
 * NumberField - numeric input with min/max/step support.
 */

interface NumberFieldProps {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  error?: string;
}

export default function NumberField({
  name,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required,
  error,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={`w-full bg-zinc-900 border rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
          error ? 'border-red-500' : 'border-zinc-700'
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
