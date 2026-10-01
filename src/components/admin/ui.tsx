import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Plus, RotateCcw, X } from 'lucide-react';
import { isValidCSSColor } from '../../lib/customization';
import { standingOf, type ListItem, type Standing } from './model';

/** Small, dependency-free form controls shared by every part of the studio. */

export function Field({
  label,
  hint,
  htmlFor,
  right,
  children,
  className = '',
}: {
  label?: string;
  hint?: ReactNode;
  htmlFor?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {(label || right) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? (
            <label htmlFor={htmlFor} className="st-label !mb-0">
              {label}
            </label>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      {children}
      {hint && <p className="st-hint">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  block = false,
  label,
}: {
  value: T | undefined;
  options: { id: T; label?: ReactNode; title?: string }[];
  onChange: (value: T) => void;
  block?: boolean;
  label?: string;
}) {
  return (
    <div className={`st-seg ${block ? 'st-seg-block' : ''}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.title}
          aria-label={option.title}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label ?? option.id}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[0.8125rem] text-zinc-200">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.6875rem] leading-snug text-zinc-500">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="st-toggle mt-0.5"
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

/** A slider with an exact numeric box beside it, and a reset to the default. */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  fallback,
  hint,
  decimals,
}: {
  label: string;
  /** `undefined` means "not set" — the renderer's own default applies. */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** What the slider shows (and starts from) while the value is unset. */
  fallback: number;
  hint?: ReactNode;
  decimals?: number;
}) {
  const shown = value ?? fallback;
  const places = decimals ?? (step < 1 ? (String(step).split('.')[1]?.length ?? 1) : 0);
  const fill = ((shown - min) / (max - min)) * 100;
  const id = useId();
  const [draft, setDraft] = useState(String(+shown.toFixed(places)));
  // While the box has focus the author's keystrokes win; a clamped commit must not rewrite them mid-typing.
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setDraft(String(+shown.toFixed(places)));
  }, [shown, places]);

  const commit = (raw: string) => {
    setDraft(raw);
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    onChange(Math.min(max, Math.max(min, +parsed.toFixed(places))));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label htmlFor={id} className="st-label !mb-0">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            className="st-num"
            value={draft}
            min={min}
            max={max}
            step={step}
            aria-label={`${label}, exact value`}
            onFocus={() => {
              typing.current = true;
            }}
            onChange={(event) => commit(event.target.value)}
            onBlur={() => {
              typing.current = false;
              setDraft(String(+shown.toFixed(places)));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          {unit && <span className="w-5 font-mono text-[10px] text-zinc-500">{unit}</span>}
          <button
            type="button"
            className="st-btn st-btn-ghost st-btn-icon !h-6 !min-h-6 !w-6"
            title="Reset to default"
            aria-label={`Reset ${label}`}
            disabled={value === undefined}
            onClick={() => onChange(undefined)}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="st-range"
        min={min}
        max={max}
        step={step}
        value={shown}
        style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(event) => onChange(+parseFloat(event.target.value).toFixed(places))}
      />
      {hint && <p className="st-hint !mt-0">{hint}</p>}
    </div>
  );
}

const SWATCHES = ['#e2612f', '#f0b429', '#7fa654', '#3aa6a0', '#5b8def', '#9b6ef3', '#e5509a', '#f4f2ed', '#1a1a18'];

/** A colour picker that accepts any valid CSS colour, with quick swatches. */
export function ColorField({
  label,
  value,
  onChange,
  swatches = SWATCHES,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  swatches?: string[];
  hint?: string;
}) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const valid = !draft || isValidCSSColor(draft);
  const hex = /^#[0-9a-f]{6}$/i.test(value ?? '') ? (value as string) : '#e2612f';

  const commit = (next: string) => {
    setDraft(next);
    if (!next) onChange(undefined);
    else if (isValidCSSColor(next)) onChange(next);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <label
          className="relative h-[2.15rem] w-[2.15rem] flex-none cursor-pointer overflow-hidden rounded-md border border-zinc-700"
          style={{ background: value || 'transparent' }}
          title="Pick a colour"
        >
          {!value && (
            <span className="st-checker absolute inset-0" aria-hidden="true" />
          )}
          <input
            type="color"
            value={hex}
            onChange={(event) => commit(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} colour picker`}
          />
        </label>
        <input
          className={`st-input st-mono ${valid ? '' : '!border-red-500'}`}
          value={draft}
          placeholder="default"
          spellCheck={false}
          onChange={(event) => commit(event.target.value.trim())}
          aria-invalid={!valid}
          aria-label={`${label} value`}
        />
        {value && (
          <button type="button" className="st-btn st-btn-ghost st-btn-icon" onClick={() => commit('')} title="Clear" aria-label={`Clear ${label}`}>
            <X size={13} />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => commit(swatch)}
            title={swatch}
            aria-label={`Use ${swatch}`}
            className="h-5 w-5 rounded-full border border-zinc-700 transition-transform hover:scale-110"
            style={{ background: swatch, outline: value === swatch ? '2px solid var(--accent)' : undefined, outlineOffset: 2 }}
          />
        ))}
      </div>
    </Field>
  );
}

/** A list of short strings — tags, gear, tech stack, specs. */
export function TagInput({
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    for (const part of parts) if (!next.includes(part)) next.push(part);
    onChange(next);
    setDraft('');
  };

  const unused = suggestions.filter((suggestion) => !values.includes(suggestion));

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="st-input"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add(draft);
            } else if (event.key === 'Backspace' && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
        />
        <button type="button" className="st-btn st-btn-icon" onClick={() => add(draft)} aria-label="Add">
          <Plus size={14} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span key={value} className="st-chip">
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="text-zinc-500 transition-colors hover:text-red-400"
                onClick={() => onChange(values.filter((v) => v !== value))}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {unused.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="st-eyebrow mr-1">quick add</span>
          {unused.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="st-chip cursor-pointer !bg-transparent transition-colors hover:!border-[var(--accent)] hover:!text-[var(--accent)]"
              onClick={() => onChange([...values, suggestion])}
            >
              <Plus size={10} />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TONE: Record<Standing, { label: string; title: string }> = {
  live: { label: 'Live', title: 'On the site' },
  hidden: { label: 'Hidden', title: 'Published, but switched off — the site does not show it' },
  draft: { label: 'Draft', title: 'Saved here, not published to the site yet' },
  review: { label: 'In review', title: 'Waiting to be published' },
  archived: { label: 'Archived', title: 'Taken out of circulation' },
};

export function StandingBadge({ item }: { item: Pick<ListItem, 'state' | 'visible'> }) {
  const standing = standingOf(item);
  return (
    <span className="st-badge" data-tone={standing} title={TONE[standing].title}>
      {TONE[standing].label}
    </span>
  );
}

/** A labelled group inside a tab, optionally collapsible. */
export function Group({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  action,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-zinc-800 py-5 first:pt-0 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          className={`min-w-0 text-left ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => collapsible && setOpen((v) => !v)}
          aria-expanded={collapsible ? open : undefined}
        >
          <h3 className="st-title text-[0.9375rem]">{title}</h3>
          {description && <p className="mt-1 text-[0.6875rem] leading-snug text-zinc-500">{description}</p>}
        </button>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>
      {open && <div className="mt-4 space-y-5">{children}</div>}
    </section>
  );
}

/** A modal confirmation, so nothing destructive hides behind window.confirm. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={ref}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="st-card st-rise relative w-full max-w-md p-6 shadow-2xl outline-none"
      >
        <h3 className="st-title text-xl">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="st-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`st-btn ${danger ? 'st-btn-danger' : 'st-btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SavedTick({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-400">
      <Check size={12} /> saved
    </span>
  );
}
