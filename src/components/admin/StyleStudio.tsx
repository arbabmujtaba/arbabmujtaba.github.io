import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Check,
  ChevronDown,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  COLOR_FILTER_MAP,
  detectMusicProvider,
  getMediaFx,
  getSpacingPx,
  isValidAudioUrl,
  isValidEmbedUrl,
} from '../../lib/customization';
import { FONT_GROUPS, FONT_OPTIONS, ensureFontLoaded, getFontOption } from '../../lib/fonts';
import type { AnimationPreset, ColorFilterPreset, PostCustomization } from '../../types';
import MediaFx from '../MediaFx';
import { MediaField, type Notify } from './MediaField';
import { ColorField, Field, Segmented, Slider, Toggle } from './ui';

type Group = keyof PostCustomization;

/** Merge `patch` into one group; undefined removes a key, and an empty group disappears. */
function patchGroup<G extends Group>(
  value: PostCustomization,
  group: G,
  patch: Partial<NonNullable<PostCustomization[G]>>
): PostCustomization {
  const merged: Record<string, unknown> = { ...(value[group] as object | undefined), ...patch };
  for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
  const next: PostCustomization = { ...value };
  if (Object.keys(merged).length) (next as Record<string, unknown>)[group] = merged;
  else delete next[group];
  return next;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

interface LookPreset {
  id: string;
  label: string;
  blurb: string;
  heading?: string;
  swatch: [string, string];
  apply: Pick<PostCustomization, 'typography' | 'animation' | 'style' | 'layout' | 'effects'>;
}

const LOOKS: LookPreset[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    blurb: 'Magazine serif on warm paper.',
    heading: 'playfair-display',
    swatch: ['#f4f0e6', '#2a2620'],
    apply: {
      typography: { fontFamily: 'lora', headingFontFamily: 'playfair-display', fontSizePx: 19, titleSizePx: 68, lineHeight: 1.8 },
      animation: { preset: 'slide-up', speed: 'normal', trigger: 'scroll' },
      style: { surface: 'bone', accentColor: '#b4472b' },
      layout: { contentWidth: 'default', textAlign: 'left', spacing: 'relaxed' },
    },
  },
  {
    id: 'noir',
    label: 'Noir film',
    blurb: 'Black & white, grain, slow fades.',
    heading: 'bebas-neue',
    swatch: ['#0b0b0a', '#e9e6df'],
    apply: {
      typography: { fontFamily: 'inter', headingFontFamily: 'bebas-neue', titleSizePx: 96, letterSpacing: 0.02 },
      animation: { preset: 'cinematic', speed: 'slow', trigger: 'load' },
      style: { surface: 'ink', accentColor: '#e9e6df' },
      layout: { contentWidth: 'wide', textAlign: 'left', spacing: 'spacious' },
      effects: { colorFilter: 'noir', grain: true, grainAmount: 55, vignette: true, vignetteAmount: 45 },
    },
  },
  {
    id: 'warm-film',
    label: 'Warm film',
    blurb: 'Faded, golden, a little grain.',
    heading: 'fraunces',
    swatch: ['#e7c79a', '#5a3a1e'],
    apply: {
      typography: { fontFamily: 'source-serif-4', headingFontFamily: 'fraunces', fontSizePx: 18, titleSizePx: 64 },
      animation: { preset: 'fade-in', speed: 'slow', trigger: 'scroll' },
      style: { surface: 'ink', accentColor: '#e0a458' },
      layout: { contentWidth: 'default', spacing: 'relaxed' },
      effects: { colorFilter: 'vintage', grain: true, grainAmount: 35, vignette: true, vignetteAmount: 30 },
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    blurb: 'Monospace, typed title, green.',
    heading: 'jetbrains-mono',
    swatch: ['#0a100a', '#7fd77f'],
    apply: {
      typography: { fontFamily: 'ibm-plex-mono', headingFontFamily: 'jetbrains-mono', fontSizePx: 15, titleSizePx: 52, lineHeight: 1.75 },
      animation: { preset: 'typewriter', speed: 'normal', trigger: 'load' },
      style: { surface: 'ink', accentColor: '#7fd77f', backgroundColor: '#070b07' },
      layout: { contentWidth: 'default', textAlign: 'left', spacing: 'default' },
    },
  },
  {
    id: 'handwritten',
    label: 'Handwritten',
    blurb: 'A diary page, loose and personal.',
    heading: 'caveat',
    swatch: ['#efe6d2', '#3b2f1c'],
    apply: {
      typography: { fontFamily: 'lora', headingFontFamily: 'caveat', fontSizePx: 18, titleSizePx: 84, lineHeight: 1.85 },
      animation: { preset: 'blur-in', speed: 'normal', trigger: 'scroll' },
      style: { surface: 'bone', accentColor: '#a1522a' },
      layout: { contentWidth: 'narrow', textAlign: 'left', spacing: 'relaxed' },
      effects: { colorFilter: 'faded' },
    },
  },
  {
    id: 'poster',
    label: 'Bold poster',
    blurb: 'Huge type, vivid colour, zoom.',
    heading: 'syne',
    swatch: ['#1a1030', '#ff5db1'],
    apply: {
      typography: { fontFamily: 'space-grotesk', headingFontFamily: 'syne', fontSizePx: 18, titleSizePx: 116, fontWeight: 400 },
      animation: { preset: 'zoom', speed: 'fast', trigger: 'load' },
      style: { surface: 'ink', accentColor: '#ff5db1' },
      layout: { contentWidth: 'wide', textAlign: 'left', spacing: 'default' },
      effects: { colorFilter: 'vivid' },
    },
  },
];

const ANIMATIONS: { id: AnimationPreset; label: string; blurb: string }[] = [
  { id: 'none', label: 'None', blurb: 'Appears instantly' },
  { id: 'fade-in', label: 'Fade in', blurb: 'A soft dissolve' },
  { id: 'slide-up', label: 'Slide up', blurb: 'Rises into place' },
  { id: 'parallax', label: 'Parallax', blurb: 'Layers drift apart' },
  { id: 'typewriter', label: 'Typewriter', blurb: 'Title types itself' },
  { id: 'cinematic', label: 'Cinematic', blurb: 'Slow, wide reveal' },
  { id: 'zoom', label: 'Zoom in', blurb: 'Pulls into focus' },
  { id: 'blur-in', label: 'Blur in', blurb: 'Sharpens into view' },
];

const FILTERS: { id: ColorFilterPreset; label: string }[] = [
  { id: 'none', label: 'Original' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'noir', label: 'Noir' },
  { id: 'faded', label: 'Faded' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'vivid', label: 'Vivid' },
];

// ---------------------------------------------------------------------------
// Font picker — every option is drawn in its own typeface
// ---------------------------------------------------------------------------

function FontPicker({
  value,
  onChange,
  defaultLabel,
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  defaultLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = getFontOption(value);

  useEffect(() => {
    if (!open) return;
    FONT_OPTIONS.forEach((font) => ensureFontLoaded(font.id));
    const close = (event: MouseEvent) => !root.current?.contains(event.target as Node) && setOpen(false);
    const esc = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  useEffect(() => ensureFontLoaded(value), [value]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="st-input flex items-center justify-between text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ fontFamily: current?.stack, fontSize: '0.9375rem' }}
      >
        <span className="truncate">{current ? current.label : defaultLabel}</span>
        <ChevronDown size={14} className={`flex-none text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="st-card st-scroll absolute left-0 right-0 z-30 mt-1.5 max-h-[22rem] overflow-y-auto p-1.5 shadow-2xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-[0.8125rem] text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            {defaultLabel}
            {!value && <Check size={13} className="text-[var(--accent)]" />}
          </button>
          {FONT_GROUPS.map((group) => (
            <div key={group}>
              <p className="st-eyebrow px-3 pb-1 pt-3">{group}</p>
              {FONT_OPTIONS.filter((font) => font.group === group).map((font) => (
                <button
                  key={font.id}
                  type="button"
                  role="option"
                  aria-selected={value === font.id}
                  className="flex w-full items-center justify-between rounded px-3 py-1.5 text-left text-[1.0625rem] text-zinc-100 hover:bg-zinc-800"
                  style={{ fontFamily: font.stack }}
                  onClick={() => {
                    onChange(font.id);
                    setOpen(false);
                  }}
                >
                  {font.label}
                  {value === font.id && <Check size={13} className="text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export type TabId = 'type' | 'motion' | 'layout' | 'colour' | 'effects' | 'music';
const TABS: { id: TabId; label: string }[] = [
  { id: 'type', label: 'Type' },
  { id: 'motion', label: 'Motion' },
  { id: 'layout', label: 'Layout' },
  { id: 'colour', label: 'Colour' },
  { id: 'effects', label: 'Effects' },
  { id: 'music', label: 'Music' },
];

const SIZE_STEPS: { label: string; px: number }[] = [
  { label: 'S', px: 15 },
  { label: 'M', px: 17 },
  { label: 'L', px: 19 },
  { label: 'XL', px: 22 },
];

/** Count of settings per tab, so the author can see where changes live. */
function countSet(value: PostCustomization, tab: TabId): number {
  const group = { type: 'typography', motion: 'animation', layout: 'layout', colour: 'style', effects: 'effects', music: 'music' }[
    tab
  ] as Group;
  return Object.keys((value[group] as object | undefined) ?? {}).length;
}

export function StyleStudio({
  value,
  onChange,
  cover,
  onReplay,
  collection,
  notify,
  only,
}: {
  value: PostCustomization;
  onChange: (next: PostCustomization) => void;
  cover: string;
  onReplay: () => void;
  collection: string;
  notify: Notify;
  /** Limit the studio to some tabs (and hide the looks) — a reel only takes effects. */
  only?: TabId[];
}) {
  const tabs = only ? TABS.filter((item) => only.includes(item.id)) : TABS;
  const [tab, setTab] = useState<TabId>(tabs[0]?.id ?? 'type');
  const t = value.typography ?? {};
  const a = value.animation ?? {};
  const l = value.layout ?? {};
  const s = value.style ?? {};
  const e = value.effects ?? {};
  const m = value.music ?? {};

  const typo = (patch: NonNullable<PostCustomization['typography']>) => onChange(patchGroup(value, 'typography', patch));
  const anim = (patch: NonNullable<PostCustomization['animation']>) => onChange(patchGroup(value, 'animation', patch));
  const lay = (patch: NonNullable<PostCustomization['layout']>) => onChange(patchGroup(value, 'layout', patch));
  const sty = (patch: NonNullable<PostCustomization['style']>) => onChange(patchGroup(value, 'style', patch));
  const fx = (patch: NonNullable<PostCustomization['effects']>) => onChange(patchGroup(value, 'effects', patch));
  const mus = (patch: NonNullable<PostCustomization['music']>) => onChange(patchGroup(value, 'music', patch));

  const applyLook = (look: LookPreset | null) => {
    const keep: PostCustomization = {};
    if (value.image) keep.image = value.image;
    if (value.music) keep.music = value.music;
    if (!look) return onChange(keep);
    [look.apply.typography?.fontFamily, look.apply.typography?.headingFontFamily].forEach(ensureFontLoaded);
    onChange({ ...keep, ...structuredClone(look.apply) });
    onReplay();
  };

  const mediaFx = useMemo(() => getMediaFx(value), [value]);
  const gradient = s.gradient ?? {};
  const dirty = Object.keys(value).filter((key) => key !== 'image').length > 0;

  const songUrlProblem =
    m.songUrl && !(isValidEmbedUrl(m.songUrl) || isValidAudioUrl(m.songUrl))
      ? 'Use an https link from Spotify, SoundCloud or YouTube, or an uploaded audio file.'
      : undefined;

  return (
    <div>
      {!only && (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="st-label !mb-0 flex items-center gap-1.5">
              <Sparkles size={12} /> Start from a look
            </span>
            <button type="button" className="st-btn st-btn-sm st-btn-ghost" disabled={!dirty} onClick={() => applyLook(null)}>
              <RotateCcw size={11} /> Site default
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LOOKS.map((look) => {
              const face = getFontOption(look.heading)?.stack;
              return (
                <button
                  key={look.id}
                  type="button"
                  className="group overflow-hidden rounded-md border border-zinc-800 text-left transition-colors hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  onClick={() => applyLook(look)}
                  onMouseEnter={() => ensureFontLoaded(look.heading)}
                >
                  <span
                    className="flex h-12 items-end px-2.5 pb-1 text-[1.5rem] leading-none"
                    style={{ background: look.swatch[0], color: look.swatch[1], fontFamily: face }}
                  >
                    Aa
                  </span>
                  <span className="block px-2.5 py-1.5">
                    <span className="block text-[0.75rem] font-medium text-zinc-200">{look.label}</span>
                    <span className="block text-[0.625rem] leading-tight text-zinc-500">{look.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tabs.length > 1 && (
      <div className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-zinc-800 px-1" role="tablist">
        {tabs.map((item) => {
          const count = countSet(value, item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className="st-tab"
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--accent-soft)] px-1.5 text-[9px] text-[var(--accent)]">{count}</span>
              )}
            </button>
          );
        })}
      </div>
      )}

      {tab === 'type' && (
        <div className="space-y-5">
          <Field label="Body font">
            <FontPicker value={t.fontFamily} onChange={(id) => typo({ fontFamily: id })} defaultLabel="Site default — Host Grotesk" />
          </Field>
          <Field label="Title font" hint="Leave on “same as body” for one voice, or pair a display face with a calm body face.">
            <FontPicker
              value={t.headingFontFamily}
              onChange={(id) => typo({ headingFontFamily: id })}
              defaultLabel="Same as body"
            />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="st-label !mb-0">Quick body size</span>
              <Segmented
                value={SIZE_STEPS.find((step) => step.px === t.fontSizePx)?.label}
                onChange={(label) => typo({ fontSizePx: SIZE_STEPS.find((step) => step.label === label)?.px, fontSize: undefined })}
                options={SIZE_STEPS.map((step) => ({ id: step.label, label: step.label, title: `${step.px}px` }))}
                label="Quick body size"
              />
            </div>
          </div>
          <Slider
            label="Body text size"
            value={t.fontSizePx}
            fallback={17}
            min={12}
            max={30}
            step={1}
            unit="px"
            onChange={(px) => typo({ fontSizePx: px, fontSize: undefined })}
          />
          <Slider
            label="Title size (desktop)"
            value={t.titleSizePx}
            fallback={64}
            min={28}
            max={140}
            step={2}
            unit="px"
            hint="Shrinks smoothly on small screens."
            onChange={(px) => typo({ titleSizePx: px })}
          />
          <Slider label="Line height" value={t.lineHeight} fallback={1.7} min={1.1} max={2.4} step={0.05} unit="×" onChange={(v) => typo({ lineHeight: v })} />
          <Slider label="Letter spacing" value={t.letterSpacing} fallback={0} min={-0.04} max={0.2} step={0.005} decimals={3} unit="em" onChange={(v) => typo({ letterSpacing: v })} />
          <Field label="Weight">
            <Segmented
              block
              label="Font weight"
              value={t.fontWeight !== undefined ? String(t.fontWeight) : undefined}
              onChange={(weight) => typo({ fontWeight: +weight })}
              options={[
                { id: '300', label: 'Light' },
                { id: '400', label: 'Regular' },
                { id: '500', label: 'Medium' },
                { id: '600', label: 'Semi' },
                { id: '700', label: 'Bold' },
              ]}
            />
          </Field>
        </div>
      )}

      {tab === 'motion' && (
        <div className="space-y-5">
          <Field
            label="Entrance"
            right={
              <button type="button" className="st-btn st-btn-sm" onClick={onReplay}>
                <Play size={11} /> Replay
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {ANIMATIONS.map((item) => {
                const active = (a.preset ?? 'fade-in') === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      anim({ preset: item.id });
                      onReplay();
                    }}
                    className="rounded-md border border-zinc-800 px-3 py-2.5 text-left transition-colors hover:border-zinc-600 aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)]"
                  >
                    <span className="block text-[0.8125rem] font-medium text-zinc-100">{item.label}</span>
                    <span className="block text-[0.6875rem] text-zinc-500">{item.blurb}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Speed">
            <Segmented
              block
              label="Animation speed"
              value={a.speed ?? 'normal'}
              onChange={(speed) => {
                anim({ speed });
                onReplay();
              }}
              options={[
                { id: 'slow', label: 'Slow' },
                { id: 'normal', label: 'Normal' },
                { id: 'fast', label: 'Fast' },
              ]}
            />
          </Field>
          <Field label="When it plays" hint="“As you scroll” reveals each block when the reader reaches it.">
            <Segmented
              block
              label="Animation trigger"
              value={a.trigger ?? 'load'}
              onChange={(trigger) => {
                anim({ trigger });
                onReplay();
              }}
              options={[
                { id: 'load', label: 'On open' },
                { id: 'scroll', label: 'As you scroll' },
              ]}
            />
          </Field>
          <Toggle
            checked={a.hoverEffects ?? false}
            onChange={(on) => anim({ hoverEffects: on || undefined })}
            label="Hover effects"
            hint="Photographs ease in slightly when the pointer rests on them."
          />
        </div>
      )}

      {tab === 'layout' && (
        <div className="space-y-5">
          <Field label="Column width">
            <Segmented
              block
              label="Content width"
              value={l.contentWidth ?? 'default'}
              onChange={(contentWidth) => lay({ contentWidth })}
              options={[
                { id: 'narrow', label: 'Narrow' },
                { id: 'default', label: 'Default' },
                { id: 'wide', label: 'Wide' },
                { id: 'full', label: 'Full' },
              ]}
            />
          </Field>
          <Field label="Column position" hint="Where the column sits when it is narrower than the page.">
            <Segmented
              block
              label="Block alignment"
              value={l.blockAlign ?? 'center'}
              onChange={(blockAlign) => lay({ blockAlign: blockAlign === 'center' ? undefined : blockAlign })}
              options={[
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Centre' },
                { id: 'right', label: 'Right' },
              ]}
            />
          </Field>
          <Field label="Text alignment">
            <Segmented
              block
              label="Text alignment"
              value={l.textAlign ?? 'left'}
              onChange={(textAlign) => lay({ textAlign })}
              options={[
                { id: 'left', label: <AlignLeft size={14} className="mx-auto" />, title: 'Left' },
                { id: 'center', label: <AlignCenter size={14} className="mx-auto" />, title: 'Centre' },
                { id: 'right', label: <AlignRight size={14} className="mx-auto" />, title: 'Right' },
                { id: 'justify', label: <AlignJustify size={14} className="mx-auto" />, title: 'Justify' },
              ]}
            />
          </Field>
          <Field label="Spacing between blocks">
            <Segmented
              block
              label="Spacing"
              value={l.gapPx === undefined ? (l.spacing ?? 'default') : undefined}
              onChange={(spacing) => lay({ spacing, gapPx: undefined })}
              options={[
                { id: 'compact', label: 'Tight' },
                { id: 'default', label: 'Default' },
                { id: 'relaxed', label: 'Airy' },
                { id: 'spacious', label: 'Roomy' },
              ]}
            />
          </Field>
          <Slider
            label="Exact spacing"
            value={l.gapPx}
            fallback={getSpacingPx(value)}
            min={0}
            max={160}
            step={4}
            unit="px"
            onChange={(gapPx) => lay({ gapPx })}
          />
        </div>
      )}

      {tab === 'colour' && (
        <div className="space-y-5">
          <Field label="Surface" hint="Auto picks light or dark from the background colour you choose.">
            <Segmented
              block
              label="Surface"
              value={s.surface ?? 'auto'}
              onChange={(surface) => sty({ surface: surface === 'auto' ? undefined : surface })}
              options={[
                { id: 'auto', label: 'Auto' },
                { id: 'ink', label: 'Dark' },
                { id: 'bone', label: 'Paper' },
              ]}
            />
          </Field>
          <ColorField label="Accent" value={s.accentColor} onChange={(accentColor) => sty({ accentColor })} hint="Links, quotes, the title and small details." />
          <ColorField label="Page background" value={s.backgroundColor} onChange={(backgroundColor) => sty({ backgroundColor })} />
          <ColorField label="Text colour" value={s.textColor} onChange={(textColor) => sty({ textColor })} />

          <div className="st-well space-y-4 p-4">
            <Toggle
              checked={!!gradient.enabled}
              onChange={(enabled) => sty({ gradient: { ...gradient, enabled: enabled || undefined } })}
              label="Colour wash"
              hint="A soft gradient behind the article."
            />
            {gradient.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <ColorField label="From" value={gradient.from} onChange={(from) => sty({ gradient: { ...gradient, from } })} swatches={[]} />
                  <ColorField label="To" value={gradient.to} onChange={(to) => sty({ gradient: { ...gradient, to } })} swatches={[]} />
                </div>
                <Slider label="Angle" value={gradient.angle} fallback={135} min={0} max={360} step={5} unit="°" onChange={(angle) => sty({ gradient: { ...gradient, angle } })} />
                <Slider label="Strength" value={gradient.intensity} fallback={20} min={0} max={100} step={1} unit="%" onChange={(intensity) => sty({ gradient: { ...gradient, intensity } })} />
              </>
            )}
          </div>

          <Slider label="Corner radius" value={s.borderRadius} fallback={0} min={0} max={48} step={2} unit="px" onChange={(borderRadius) => sty({ borderRadius })} />
          <Field label="Shadow">
            <Segmented
              block
              label="Shadow"
              value={s.shadow ?? 'none'}
              onChange={(shadow) => sty({ shadow: shadow === 'none' ? undefined : shadow })}
              options={[
                { id: 'none', label: 'None' },
                { id: 'subtle', label: 'Soft' },
                { id: 'medium', label: 'Medium' },
                { id: 'dramatic', label: 'Deep' },
                { id: 'glow', label: 'Glow' },
              ]}
            />
          </Field>
          <Slider
            label="Article opacity"
            value={s.opacity === undefined ? undefined : Math.round(s.opacity * 100)}
            fallback={100}
            min={20}
            max={100}
            step={5}
            unit="%"
            onChange={(pct) => sty({ opacity: pct === undefined || pct >= 100 ? undefined : pct / 100 })}
          />
        </div>
      )}

      {tab === 'effects' && (
        <div className="space-y-5">
          <Field label="Colour grade" hint="Applied to every photograph and clip in the post. Thumbnails show your own cover.">
            <div className="grid grid-cols-4 gap-2">
              {FILTERS.map((item) => {
                const active = (e.colorFilter ?? 'none') === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => fx({ colorFilter: item.id === 'none' ? undefined : item.id })}
                    className="group overflow-hidden rounded-md border border-zinc-800 text-left transition-colors hover:border-zinc-500 aria-pressed:border-[var(--accent)]"
                  >
                    <span className="block aspect-[4/3] overflow-hidden bg-zinc-900">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{ filter: COLOR_FILTER_MAP[item.id] || undefined }}
                        />
                      ) : (
                        <span
                          className="block h-full w-full"
                          style={{
                            background: 'linear-gradient(135deg,#e2612f,#f0b429 40%,#3aa6a0 70%,#5b8def)',
                            filter: COLOR_FILTER_MAP[item.id] || undefined,
                          }}
                        />
                      )}
                    </span>
                    <span className="block px-2 py-1.5 text-center text-[0.6875rem] text-zinc-300 group-aria-pressed:text-[var(--accent)]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="space-y-4">
            <Slider label="Brightness" value={e.brightness} fallback={100} min={50} max={150} step={1} unit="%" onChange={(brightness) => fx({ brightness: brightness === 100 ? undefined : brightness })} />
            <Slider label="Contrast" value={e.contrast} fallback={100} min={50} max={150} step={1} unit="%" onChange={(contrast) => fx({ contrast: contrast === 100 ? undefined : contrast })} />
            <Slider label="Saturation" value={e.saturation} fallback={100} min={0} max={200} step={1} unit="%" onChange={(saturation) => fx({ saturation: saturation === 100 ? undefined : saturation })} />
            <Slider label="Blur" value={e.blur} fallback={0} min={0} max={12} step={0.5} unit="px" onChange={(blur) => fx({ blur: blur === 0 ? undefined : blur })} />
          </div>

          <div className="st-well space-y-4 p-4">
            <Toggle checked={!!e.grain} onChange={(grain) => fx({ grain: grain || undefined })} label="Film grain" hint="Fine, moving-picture texture over photographs and clips." />
            {e.grain && <Slider label="Grain amount" value={e.grainAmount} fallback={40} min={5} max={100} step={1} unit="%" onChange={(grainAmount) => fx({ grainAmount })} />}
            <Toggle checked={!!e.vignette} onChange={(vignette) => fx({ vignette: vignette || undefined })} label="Vignette" hint="Darkens the corners to hold the eye." />
            {e.vignette && <Slider label="Vignette amount" value={e.vignetteAmount} fallback={50} min={5} max={100} step={1} unit="%" onChange={(vignetteAmount) => fx({ vignetteAmount })} />}
          </div>

          {cover && (
            <Field label="Result on your cover">
              <div className="overflow-hidden rounded-md border border-zinc-800">
                <MediaFx fx={mediaFx} className="aspect-[16/9] bg-zinc-900">
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                </MediaFx>
              </div>
            </Field>
          )}
        </div>
      )}

      {tab === 'music' && (
        <div className="space-y-5">
          <p className="text-[0.75rem] leading-relaxed text-zinc-500">
            Adds a “Now playing” card to the entry — a Spotify, SoundCloud or YouTube link, or an audio file you uploaded.
          </p>
          <Field label="Link" hint={songUrlProblem ?? (m.songUrl ? `Detected: ${detectMusicProvider(m.songUrl)}` : undefined)}>
            <input
              className={`st-input st-mono ${songUrlProblem ? '!border-amber-500' : ''}`}
              value={m.songUrl ?? ''}
              placeholder="https://open.spotify.com/track/…"
              spellCheck={false}
              onChange={(event) => {
                const url = event.target.value.trim();
                mus({ songUrl: url || undefined, provider: url ? detectMusicProvider(url) : undefined });
              }}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Song title">
              <input className="st-input" value={m.songTitle ?? ''} onChange={(event) => mus({ songTitle: event.target.value || undefined })} />
            </Field>
            <Field label="Artist">
              <input className="st-input" value={m.songArtist ?? ''} onChange={(event) => mus({ songArtist: event.target.value || undefined })} />
            </Field>
          </div>
          <MediaField
            label="Album art"
            value={m.albumArt ?? ''}
            onChange={(albumArt) => mus({ albumArt: albumArt || undefined })}
            collection={collection}
            notify={notify}
          />
        </div>
      )}
    </div>
  );
}
