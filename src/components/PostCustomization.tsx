import { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Music, Sparkles, Palette, 
  Layout, Wand2, Play, Square, Zap
} from 'lucide-react';
import type { PostCustomization as PostCustomizationType } from '../types';

interface PostCustomizationProps {
  value: PostCustomizationType;
  onChange: (value: PostCustomizationType) => void;
}

function SectionHeader({ 
  title, 
  icon: Icon, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  icon: React.ComponentType<any>; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-zinc-900/50 transition-colors rounded-sm cursor-pointer"
    >
      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
      <Icon className="w-4 h-4 text-orange-500/70" />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">{title}</span>
    </button>
  );
}

export default function PostCustomization({ value, onChange }: PostCustomizationProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateMusic = (field: string, val: string) => {
    onChange({ ...value, music: { ...value.music, [field]: val } });
  };

  const updateAnimation = (field: string, val: any) => {
    onChange({ ...value, animation: { ...value.animation, [field]: val } });
  };

  const updateStyle = (field: string, val: any) => {
    onChange({ ...value, style: { ...value.style, [field]: val } });
  };

  const updateGradient = (field: string, val: any) => {
    const currentGradient = value.style?.gradient || {};
    onChange({ 
      ...value, 
      style: { ...value.style, gradient: { ...currentGradient, [field]: val } } 
    });
  };

  const updateLayout = (field: string, val: any) => {
    onChange({ ...value, layout: { ...value.layout, [field]: val } });
  };

  const updateEffects = (field: string, val: any) => {
    onChange({ ...value, effects: { ...value.effects, [field]: val } });
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 font-sans";
  const selectClass = "bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 px-3 py-2 rounded-sm focus:outline-none focus:border-orange-500/40 font-sans cursor-pointer";
  const labelClass = "block font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600 mb-1.5";

  return (
    <div className="border border-zinc-900 rounded-sm bg-zinc-950/50 overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-orange-500/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Post Customization</span>
        <span className="ml-auto font-sans text-[9px] text-zinc-600">Optional enhancements</span>
      </div>

      {/* Music / Audio Section */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader 
          title="Music / Audio" 
          icon={Music} 
          isOpen={!!openSections.music} 
          onToggle={() => toggleSection('music')} 
        />
        {openSections.music && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Song Title</label>
                <input
                  type="text"
                  value={value.music?.songTitle || ''}
                  onChange={(e) => updateMusic('songTitle', e.target.value)}
                  placeholder="Track name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Artist</label>
                <input
                  type="text"
                  value={value.music?.songArtist || ''}
                  onChange={(e) => updateMusic('songArtist', e.target.value)}
                  placeholder="Artist name"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Song URL (embed or direct link)</label>
              <input
                type="url"
                value={value.music?.songUrl || ''}
                onChange={(e) => updateMusic('songUrl', e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Album Art URL</label>
                <input
                  type="url"
                  value={value.music?.albumArt || ''}
                  onChange={(e) => updateMusic('albumArt', e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Provider</label>
                <select
                  value={value.music?.provider || ''}
                  onChange={(e) => updateMusic('provider', e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="">Select...</option>
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

      {/* Animations Section */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader 
          title="Animations" 
          icon={Sparkles} 
          isOpen={!!openSections.animation} 
          onToggle={() => toggleSection('animation')} 
        />
        {openSections.animation && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Animation Preset</label>
                <select
                  value={value.animation?.preset || 'none'}
                  onChange={(e) => updateAnimation('preset', e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="none">None</option>
                  <option value="fade-in">Fade In</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="parallax">Parallax</option>
                  <option value="typewriter">Typewriter</option>
                  <option value="cinematic">Cinematic</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Speed</label>
                <select
                  value={value.animation?.speed || 'normal'}
                  onChange={(e) => updateAnimation('speed', e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => updateAnimation('hoverEffects', !value.animation?.hoverEffects)}
                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                  value.animation?.hoverEffects ? 'bg-orange-600' : 'bg-zinc-800'
                }`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  value.animation?.hoverEffects ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">Hover Effects</span>
            </div>
            {/* Preview hint */}
            {value.animation?.preset && value.animation.preset !== 'none' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/40 rounded-sm">
                <Play className="w-3 h-3 text-orange-500/60" />
                <span className="font-sans text-[10px] text-zinc-500">
                  {value.animation.preset} at {value.animation.speed || 'normal'} speed
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Styling Section */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader 
          title="Visual Styling" 
          icon={Palette} 
          isOpen={!!openSections.style} 
          onToggle={() => toggleSection('style')} 
        />
        {openSections.style && (
          <div className="px-4 pb-4 space-y-3">
            {/* Border Radius */}
            <div>
              <label className={labelClass}>Border Radius ({value.style?.borderRadius || 0}px)</label>
              <input
                type="range"
                min="0"
                max="24"
                value={value.style?.borderRadius || 0}
                onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Shadow Preset */}
            <div>
              <label className={labelClass}>Shadow</label>
              <div className="flex gap-2 flex-wrap">
                {(['none', 'subtle', 'medium', 'dramatic', 'glow'] as const).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateStyle('shadow', preset)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
                      (value.style?.shadow || 'none') === preset
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Gradient */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => updateGradient('enabled', !value.style?.gradient?.enabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    value.style?.gradient?.enabled ? 'bg-orange-600' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    value.style?.gradient?.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className={labelClass + " mb-0"}>Gradient Background</span>
              </div>
              {value.style?.gradient?.enabled && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>From</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={value.style?.gradient?.from || '#0a0a09'}
                        onChange={(e) => updateGradient('from', e.target.value)}
                        className="w-7 h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={value.style?.gradient?.from || '#0a0a09'}
                        onChange={(e) => updateGradient('from', e.target.value)}
                        className={inputClass + " flex-1"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>To</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={value.style?.gradient?.to || '#1a1a18'}
                        onChange={(e) => updateGradient('to', e.target.value)}
                        className="w-7 h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={value.style?.gradient?.to || '#1a1a18'}
                        onChange={(e) => updateGradient('to', e.target.value)}
                        className={inputClass + " flex-1"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Angle ({value.style?.gradient?.angle || 180}deg)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={value.style?.gradient?.angle || 180}
                      onChange={(e) => updateGradient('angle', parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Accent Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value.style?.accentColor || '#ea580c'}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    className="w-7 h-7 rounded-sm border border-zinc-800 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={value.style?.accentColor || ''}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    placeholder="#ea580c"
                    className={inputClass + " flex-1"}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Opacity ({Math.round((value.style?.opacity ?? 1) * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((value.style?.opacity ?? 1) * 100)}
                  onChange={(e) => updateStyle('opacity', parseInt(e.target.value) / 100)}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout Section */}
      <div className="border-b border-zinc-900/50">
        <SectionHeader 
          title="Layout" 
          icon={Layout} 
          isOpen={!!openSections.layout} 
          onToggle={() => toggleSection('layout')} 
        />
        {openSections.layout && (
          <div className="px-4 pb-4 space-y-3">
            {/* Content Width */}
            <div>
              <label className={labelClass}>Content Width</label>
              <div className="flex gap-2">
                {(['narrow', 'default', 'wide', 'full'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateLayout('contentWidth', w)}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
                      (value.layout?.contentWidth || 'default') === w
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <label className={labelClass}>Text Alignment</label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map(align => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => updateLayout('textAlign', align)}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
                      (value.layout?.textAlign || 'left') === align
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className={labelClass}>Spacing</label>
              <div className="flex gap-2">
                {(['compact', 'default', 'relaxed', 'spacious'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateLayout('spacing', s)}
                    className={`flex-1 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
                      (value.layout?.spacing || 'default') === s
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Effects Section */}
      <div>
        <SectionHeader 
          title="Effects" 
          icon={Zap} 
          isOpen={!!openSections.effects} 
          onToggle={() => toggleSection('effects')} 
        />
        {openSections.effects && (
          <div className="px-4 pb-4 space-y-3">
            {/* Toggles Row */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateEffects('grain', !value.effects?.grain)}
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    value.effects?.grain ? 'bg-orange-600' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    value.effects?.grain ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">Film Grain</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateEffects('vignette', !value.effects?.vignette)}
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    value.effects?.vignette ? 'bg-orange-600' : 'bg-zinc-800'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    value.effects?.vignette ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">Vignette</span>
              </div>
            </div>

            {/* Blur */}
            <div>
              <label className={labelClass}>Background Blur ({value.effects?.blur || 0}px)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={value.effects?.blur || 0}
                onChange={(e) => updateEffects('blur', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Color Filter */}
            <div>
              <label className={labelClass}>Color Filter</label>
              <div className="flex gap-2 flex-wrap">
                {(['none', 'warm', 'cool', 'vintage', 'noir'] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => updateEffects('colorFilter', filter)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-colors cursor-pointer ${
                      (value.effects?.colorFilter || 'none') === filter
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Active effects summary */}
            {(value.effects?.grain || value.effects?.vignette || (value.effects?.blur && value.effects.blur > 0) || (value.effects?.colorFilter && value.effects.colorFilter !== 'none')) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/40 rounded-sm">
                <Square className="w-3 h-3 text-orange-500/60" />
                <span className="font-sans text-[10px] text-zinc-500">
                  Active: {[
                    value.effects?.grain && 'grain',
                    value.effects?.vignette && 'vignette',
                    value.effects?.blur && value.effects.blur > 0 && `blur(${value.effects.blur}px)`,
                    value.effects?.colorFilter && value.effects.colorFilter !== 'none' && value.effects.colorFilter
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
