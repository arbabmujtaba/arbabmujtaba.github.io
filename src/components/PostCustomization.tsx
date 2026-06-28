import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Music, Sparkles, Palette,
  Layout, Wand2, Zap, Type, RotateCcw,
} from 'lucide-react';
import type { PostCustomization as PostCustomizationType } from '../types';
import CustomizationPreview from './CustomizationPreview';

interface PostCustomizationProps {
  value: PostCustomizationType;
  onChange: (value: PostCustomizationType) => void;
  /** Optional real content so the live preview mirrors the actual post. */
  preview?: { title?: string; excerpt?: string; coverImage?: string; category?: string };
}

// -------------------------------------------------------------------------
// Reusable building blocks
// -------------------------------------------------------------------------

function SectionHeader({
  title, description, icon: Icon, isOpen, changed, onToggle,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isOpen: boolean;
  changed: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-zinc-900/50 transition-colors cursor-pointer"
    >
      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
      <Icon className="w-4 h-4 text-orange-500/70 shrink-0" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-300">{title}</span>
      {changed > 0 && (
        <span className="font-mono text-[8px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-1.5 py-0.5 leading-none">
          {changed}
        </span>
      )}
      {!isOpen && <span className="ml-auto font-sans text-[10px] text-zinc-600 font-light truncate hidden sm:block max-w-[55%]">{description}</span>}
    </button>
  );
}

function Field({
  label, hint, isDefault, defaultLabel, onReset, children,
}: {
  label: string;
  hint?: string;
  isDefault: boolean;
  defaultLabel?: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">{label}</label>
        <div className="flex items-center gap-2 shrink-0">
          {defaultLabel && (
            <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-600" title={`Default: ${defaultLabel}`}>
              default: {defaultLabel}
            </span>
          )}
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              title="Reset to default"
              className="flex items-center gap-0.5 text-[8px] font-mono uppercase tracking-wider text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" /> reset
            </button>
          )}
        </div>
      </div>
      {hint && <p className="font-sans text-[10px] text-zinc-500 font-light mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

function Segmented({
  options, value, onChange, format, full,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  format?: (v: string) => string;
  full?: boolean;
}) {
  return (
    <div className={`flex gap-1.5 ${full ? '' : 'flex-wrap'}`}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`${full ? 'flex-1' : ''} px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
            value === opt
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
              : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
          }`}
        >
          {format ? format(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${on ? 'bg-orange-600' : 'bg-zinc-800'}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">{label}</span>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PostCustomization({ value, onChange, preview }: PostCustomizationProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ typography: true, animation: true });

  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateTypography = (field: string, val: any) => onChange({ ...value, typography: { ...value.typography, [field]: val } });
  const updateMusic = (field: string, val: string) => onChange({ ...value, music: { ...value.music, [field]: val } });
  const updateAnimation = (field: string, val: any) => onChange({ ...value, animation: { ...value.animation, [field]: val } });
  const updateStyle = (field: string, val: any) => onChange({ ...value, style: { ...value.style, [field]: val } });
  const updateGradient = (field: string, val: any) =>
    onChange({ ...value, style: { ...value.style, gradient: { ...value.style?.gradient, [field]: val } } });
  const updateLayout = (field: string, val: any) => onChange({ ...value, layout: { ...value.layout, [field]: val } });
  const updateEffects = (field: string, val: any) => onChange({ ...value, effects: { ...value.effects, [field]: val } });

  // Enabling the gradient also seeds sensible default colours so it renders immediately.
  const toggleGradient = () => {
    const enabled = !value.style?.gradient?.enabled;
    onChange({
      ...value,
      style: {
        ...value.style,
        gradient: {
          from: value.style?.gradient?.from ?? '#0a0a09',
          to: value.style?.gradient?.to ?? '#1a1a18',
          angle: value.style?.gradient?.angle ?? 180,
          enabled,
        },
      },
    });
  };

  // Count of non-default settings per group (drives the badge in each header).
  const t = value.typography || {};
  const a = value.animation || {};
  const l = value.layout || {};
  const s = value.style || {};
  const e = value.effects || {};
  const m = value.music || {};

  const typographyChanged = [t.fontSize && t.fontSize !== 'default', t.fontFamily && t.fontFamily !== 'sans'].filter(Boolean).length;
  const animationChanged = [a.preset && a.preset !== 'none', a.speed && a.speed !== 'normal', a.hoverEffects].filter(Boolean).length;
  const layoutChanged = [l.contentWidth && l.contentWidth !== 'default', l.textAlign && l.textAlign !== 'left', l.spacing && l.spacing !== 'default'].filter(Boolean).length;
  const styleChanged = [!!s.borderRadius, s.shadow && s.shadow !== 'none', s.gradient?.enabled, !!s.accentColor, s.opacity !== undefined && s.opacity < 1].filter(Boolean).length;
  const effectsChanged = [e.grain, e.vignette, !!e.blur, e.colorFilter && e.colorFilter !== 'none'].filter(Boolean).length;
  const mediaChanged = [m.songTitle, m.songArtist, m.songUrl, m.albumArt].filter(Boolean).length;

  const totalChanged = typographyChanged + animationChanged + layoutChanged + styleChanged + effectsChanged + mediaChanged;

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 font-sans";
  const selectClass = "w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 font-sans cursor-pointer";

  return (
    <div className="border border-zinc-900 rounded-sm bg-zinc-950/50">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-orange-500/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Post Customization</span>
        {totalChanged > 0 ? (
          <button
            type="button"
            onClick={() => onChange({})}
            className="ml-auto flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
            title="Reset every customization to its default"
          >
            <RotateCcw className="w-3 h-3" /> Reset all
          </button>
        ) : (
          <span className="ml-auto font-sans text-[9px] text-zinc-600">Optional · live preview below</span>
        )}
      </div>

      {/* Live preview — stays visible while adjusting options */}
      <div className="p-3 border-b border-zinc-900 bg-[#0a0a09] sticky top-0 z-20">
        <CustomizationPreview
          value={value}
          title={preview?.title}
          excerpt={preview?.excerpt}
          coverImage={preview?.coverImage}
          category={preview?.category}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* TYPOGRAPHY */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader title="Typography" description="Text size & typeface" icon={Type} changed={typographyChanged} isOpen={!!openSections.typography} onToggle={() => toggleSection('typography')} />
        {openSections.typography && (
          <div className="px-4 pb-4 space-y-4">
            <Field
              label="Text Size"
              hint="Scales the body text of your post. Watch the preview text grow or shrink."
              defaultLabel="Default"
              isDefault={!t.fontSize || t.fontSize === 'default'}
              onReset={() => updateTypography('fontSize', 'default')}
            >
              <Segmented
                full
                options={['small', 'default', 'large', 'x-large']}
                value={t.fontSize || 'default'}
                onChange={(v) => updateTypography('fontSize', v)}
                format={(v) => (v === 'x-large' ? 'XL' : cap(v))}
              />
            </Field>

            <Field
              label="Font Family"
              hint="Sets the typeface for the post title and body."
              defaultLabel="Sans"
              isDefault={!t.fontFamily || t.fontFamily === 'sans'}
              onReset={() => updateTypography('fontFamily', 'sans')}
            >
              <Segmented
                full
                options={['serif', 'sans', 'mono']}
                value={t.fontFamily || 'sans'}
                onChange={(v) => updateTypography('fontFamily', v)}
                format={cap}
              />
            </Field>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* ANIMATION */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader title="Animation" description="Entrance motion" icon={Sparkles} changed={animationChanged} isOpen={!!openSections.animation} onToggle={() => toggleSection('animation')} />
        {openSections.animation && (
          <div className="px-4 pb-4 space-y-4">
            <Field
              label="Preset"
              hint="How the post animates as it opens. Changing this replays it in the preview."
              defaultLabel="None"
              isDefault={!a.preset || a.preset === 'none'}
              onReset={() => updateAnimation('preset', 'none')}
            >
              <select value={a.preset || 'none'} onChange={(ev) => updateAnimation('preset', ev.target.value)} className={selectClass}>
                <option value="none">None</option>
                <option value="fade-in">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="parallax">Parallax</option>
                <option value="typewriter">Typewriter</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </Field>

            <Field
              label="Speed"
              hint="How fast the entrance animation plays."
              defaultLabel="Normal"
              isDefault={!a.speed || a.speed === 'normal'}
              onReset={() => updateAnimation('speed', 'normal')}
            >
              <Segmented full options={['slow', 'normal', 'fast']} value={a.speed || 'normal'} onChange={(v) => updateAnimation('speed', v)} format={cap} />
            </Field>

            <Field
              label="Hover Effects"
              hint="Subtle zoom on the cover image when a visitor hovers it."
              defaultLabel="Off"
              isDefault={!a.hoverEffects}
              onReset={() => updateAnimation('hoverEffects', false)}
            >
              <Toggle on={!!a.hoverEffects} onToggle={() => updateAnimation('hoverEffects', !a.hoverEffects)} label={a.hoverEffects ? 'Enabled' : 'Disabled'} />
            </Field>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* LAYOUT */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader title="Layout" description="Width, alignment & spacing" icon={Layout} changed={layoutChanged} isOpen={!!openSections.layout} onToggle={() => toggleSection('layout')} />
        {openSections.layout && (
          <div className="px-4 pb-4 space-y-4">
            <Field label="Content Width" hint="How wide the article column is." defaultLabel="Default" isDefault={!l.contentWidth || l.contentWidth === 'default'} onReset={() => updateLayout('contentWidth', 'default')}>
              <Segmented full options={['narrow', 'default', 'wide', 'full']} value={l.contentWidth || 'default'} onChange={(v) => updateLayout('contentWidth', v)} format={cap} />
            </Field>

            <Field label="Text Alignment" hint="Aligns the post heading and text." defaultLabel="Left" isDefault={!l.textAlign || l.textAlign === 'left'} onReset={() => updateLayout('textAlign', 'left')}>
              <Segmented full options={['left', 'center', 'right']} value={l.textAlign || 'left'} onChange={(v) => updateLayout('textAlign', v)} format={cap} />
            </Field>

            <Field label="Spacing" hint="Vertical breathing room between blocks." defaultLabel="Default" isDefault={!l.spacing || l.spacing === 'default'} onReset={() => updateLayout('spacing', 'default')}>
              <Segmented full options={['compact', 'default', 'relaxed', 'spacious']} value={l.spacing || 'default'} onChange={(v) => updateLayout('spacing', v)} format={cap} />
            </Field>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* APPEARANCE */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader title="Appearance" description="Radius, shadow, colour" icon={Palette} changed={styleChanged} isOpen={!!openSections.appearance} onToggle={() => toggleSection('appearance')} />
        {openSections.appearance && (
          <div className="px-4 pb-4 space-y-4">
            <Field label={`Border Radius — ${s.borderRadius || 0}px`} hint="Rounds the corners of the cover image." defaultLabel="0px" isDefault={!s.borderRadius} onReset={() => updateStyle('borderRadius', 0)}>
              <input type="range" min="0" max="24" value={s.borderRadius || 0} onChange={(ev) => updateStyle('borderRadius', parseInt(ev.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
            </Field>

            <Field label="Shadow" hint="Depth shadow around the post card." defaultLabel="None" isDefault={!s.shadow || s.shadow === 'none'} onReset={() => updateStyle('shadow', 'none')}>
              <Segmented options={['none', 'subtle', 'medium', 'dramatic', 'glow']} value={s.shadow || 'none'} onChange={(v) => updateStyle('shadow', v)} format={cap} />
            </Field>

            <Field label="Gradient Background" hint="A colored gradient wash behind the content." defaultLabel="Off" isDefault={!s.gradient?.enabled} onReset={() => updateGradient('enabled', false)}>
              <Toggle on={!!s.gradient?.enabled} onToggle={toggleGradient} label={s.gradient?.enabled ? 'Enabled' : 'Disabled'} />
              {s.gradient?.enabled && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-wider text-zinc-600 mb-1">From</label>
                    <input type="color" value={s.gradient?.from || '#0a0a09'} onChange={(ev) => updateGradient('from', ev.target.value)} className="w-full h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent" />
                  </div>
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-wider text-zinc-600 mb-1">To</label>
                    <input type="color" value={s.gradient?.to || '#1a1a18'} onChange={(ev) => updateGradient('to', ev.target.value)} className="w-full h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent" />
                  </div>
                  <div>
                    <label className="block font-mono text-[8px] uppercase tracking-wider text-zinc-600 mb-1">{s.gradient?.angle ?? 180}&deg;</label>
                    <input type="range" min="0" max="360" value={s.gradient?.angle ?? 180} onChange={(ev) => updateGradient('angle', parseInt(ev.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2.5" />
                  </div>
                </div>
              )}
            </Field>

            <Field label="Accent Color" hint="Tints headings, links and the category badge." defaultLabel="Theme" isDefault={!s.accentColor} onReset={() => updateStyle('accentColor', '')}>
              <div className="flex gap-2 items-center">
                <input type="color" value={s.accentColor || '#ea580c'} onChange={(ev) => updateStyle('accentColor', ev.target.value)} className="w-7 h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent shrink-0" />
                <input type="text" value={s.accentColor || ''} onChange={(ev) => updateStyle('accentColor', ev.target.value)} placeholder="#ea580c (theme default)" className={inputClass} />
              </div>
            </Field>

            <Field label={`Opacity — ${Math.round((s.opacity ?? 1) * 100)}%`} hint="Overall opacity of the post container." defaultLabel="100%" isDefault={s.opacity === undefined || s.opacity >= 1} onReset={() => updateStyle('opacity', 1)}>
              <input type="range" min="0" max="100" value={Math.round((s.opacity ?? 1) * 100)} onChange={(ev) => updateStyle('opacity', parseInt(ev.target.value) / 100)} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
            </Field>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* EFFECTS */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader title="Effects" description="Grain, vignette, blur, colour grade" icon={Zap} changed={effectsChanged} isOpen={!!openSections.effects} onToggle={() => toggleSection('effects')} />
        {openSections.effects && (
          <div className="px-4 pb-4 space-y-4">
            <Field label="Film Grain" hint="A subtle film-grain texture over the whole post." defaultLabel="Off" isDefault={!e.grain} onReset={() => updateEffects('grain', false)}>
              <Toggle on={!!e.grain} onToggle={() => updateEffects('grain', !e.grain)} label={e.grain ? 'Enabled' : 'Disabled'} />
            </Field>

            <Field label="Vignette" hint="Darkens the edges for a cinematic feel." defaultLabel="Off" isDefault={!e.vignette} onReset={() => updateEffects('vignette', false)}>
              <Toggle on={!!e.vignette} onToggle={() => updateEffects('vignette', !e.vignette)} label={e.vignette ? 'Enabled' : 'Disabled'} />
            </Field>

            <Field label={`Background Blur — ${e.blur || 0}px`} hint="Blurs the cover image." defaultLabel="0px" isDefault={!e.blur} onReset={() => updateEffects('blur', 0)}>
              <input type="range" min="0" max="10" value={e.blur || 0} onChange={(ev) => updateEffects('blur', parseInt(ev.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
            </Field>

            <Field label="Color Filter" hint="Applies a colour grade to the cover image." defaultLabel="None" isDefault={!e.colorFilter || e.colorFilter === 'none'} onReset={() => updateEffects('colorFilter', 'none')}>
              <Segmented options={['none', 'warm', 'cool', 'vintage', 'noir']} value={e.colorFilter || 'none'} onChange={(v) => updateEffects('colorFilter', v)} format={cap} />
            </Field>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MEDIA */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <SectionHeader title="Media" description="Attach a music track" icon={Music} changed={mediaChanged} isOpen={!!openSections.media} onToggle={() => toggleSection('media')} />
        {openSections.media && (
          <div className="px-4 pb-4 space-y-3">
            <p className="font-sans text-[10px] text-zinc-500 font-light leading-snug">
              Attach a track (Spotify, YouTube, SoundCloud or a direct link) — it appears as a player at the top of the published post.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Song Title</label>
                <input type="text" value={m.songTitle || ''} onChange={(ev) => updateMusic('songTitle', ev.target.value)} placeholder="Track name" className={inputClass} />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Artist</label>
                <input type="text" value={m.songArtist || ''} onChange={(ev) => updateMusic('songArtist', ev.target.value)} placeholder="Artist name" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Song URL (embed or direct link)</label>
              <input type="url" value={m.songUrl || ''} onChange={(ev) => updateMusic('songUrl', ev.target.value)} placeholder="https://open.spotify.com/track/..." className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Album Art URL</label>
                <input type="url" value={m.albumArt || ''} onChange={(ev) => updateMusic('albumArt', ev.target.value)} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 mb-1.5">Provider</label>
                <select value={m.provider || ''} onChange={(ev) => updateMusic('provider', ev.target.value)} className={selectClass}>
                  <option value="">Auto-detect</option>
                  <option value="spotify">Spotify</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="youtube">YouTube</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
