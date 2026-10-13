import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Lightbulb, Search, X } from 'lucide-react';
import { GUIDE, TIPS, searchGuide, type GuideView, type TipTopic } from './guideContent';

/**
 * The studio's help layer, three ways in:
 *
 *   - hover cards: any element with `data-tip="…"` explains itself after a
 *     short rest of the pointer (or at once on keyboard focus)
 *   - the tip bar: one suggestion at a time for the workspace or editor tab
 *     on screen, under the content
 *   - the guide: every feature, searchable — `?` anywhere, or the sidebar
 *
 * Hover cards and the tip bar share one switch, kept in this browser. The
 * guide is always available. Copy lives in ./guideContent.ts.
 */

const STORAGE_KEY = 'studio.tips';
const HOVER_DELAY = 450;

interface TipsState {
  /** Hover cards and the tip bar. */
  tips: boolean;
  setTips: (on: boolean) => void;
  openGuide: () => void;
  guide: boolean;
  closeGuide: () => void;
}

const TipsContext = createContext<TipsState>({
  tips: false,
  setTips: () => undefined,
  openGuide: () => undefined,
  guide: false,
  closeGuide: () => undefined,
});

export const useTips = () => useContext(TipsContext);

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** State only; put <TipsLayer> inside the `.studio` root so the overlays get its tokens. */
export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [tips, setTipsState] = useState(readStored);
  const [guide, setGuide] = useState(false);

  const setTips = useCallback((on: boolean) => {
    setTipsState(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode: the switch just won't stick */
    }
  }, []);
  const openGuide = useCallback(() => setGuide(true), []);
  const closeGuide = useCallback(() => setGuide(false), []);

  // `?` opens the guide from anywhere that is not a text field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '?' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      setGuide((open) => !open);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ tips, setTips, openGuide, guide, closeGuide }), [tips, setTips, openGuide, guide, closeGuide]);

  return <TipsContext.Provider value={value}>{children}</TipsContext.Provider>;
}

/** The hover card and the guide drawer. */
export function TipsLayer({ onGo }: { onGo: (view: GuideView) => void }) {
  const { tips, guide, closeGuide } = useTips();
  return (
    <>
      {tips && <HoverCard />}
      {guide && (
        <GuideDrawer
          onClose={closeGuide}
          onGo={(view) => {
            closeGuide();
            onGo(view);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Hover cards
// ---------------------------------------------------------------------------

interface CardPosition {
  text: string;
  top: number;
  left: number;
  above: boolean;
}

/** One floating card for the whole studio, fed by `data-tip` attributes. */
function HoverCard() {
  const [card, setCard] = useState<CardPosition | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const owner = useRef<HTMLElement | null>(null);
  const id = 'studio-hover-tip';

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(timer.current);
      owner.current?.removeAttribute('aria-describedby');
      owner.current = null;
      setCard(null);
    };

    const show = (el: HTMLElement) => {
      const text = el.dataset.tip;
      if (!text) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 16);
      const above = rect.bottom + 120 > window.innerHeight;
      const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
      owner.current = el;
      el.setAttribute('aria-describedby', id);
      setCard({ text, left, above, top: above ? rect.top - 8 : rect.bottom + 8 });
    };

    const tipFrom = (target: EventTarget | null) =>
      target instanceof Element ? (target.closest('.studio [data-tip]') as HTMLElement | null) : null;

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const el = tipFrom(event.target);
      if (el === owner.current) return;
      clear();
      if (!el) return;
      timer.current = window.setTimeout(() => show(el), HOVER_DELAY);
    };
    const onFocus = (event: FocusEvent) => {
      const el = tipFrom(event.target);
      clear();
      if (el && el.matches(':focus-visible')) show(el);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && clear();

    document.addEventListener('pointerover', onOver);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', clear);
    document.addEventListener('pointerdown', clear);
    document.addEventListener('scroll', clear, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', clear);
    return () => {
      clear();
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', clear);
      document.removeEventListener('pointerdown', clear);
      document.removeEventListener('scroll', clear, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', clear);
    };
  }, []);

  if (!card) return null;
  return (
    <div
      id={id}
      role="tooltip"
      className="st-hovertip"
      data-above={card.above || undefined}
      style={{ top: card.top, left: card.left }}
    >
      {card.text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tip bar
// ---------------------------------------------------------------------------

/** One suggestion at a time for what is on screen, with the general tips mixed in. */
export function TipBar({ topic }: { topic: TipTopic }) {
  const { tips, setTips, openGuide } = useTips();
  const list = useMemo(() => [...TIPS[topic], ...(topic === 'general' ? [] : TIPS.general)], [topic]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // A fresh place starts on its own first tip.
  useEffect(() => setIndex(0), [topic]);

  useEffect(() => {
    if (!tips || paused || list.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 14000);
    return () => window.clearInterval(id);
  }, [tips, paused, list.length]);

  if (!tips || list.length === 0) return null;
  const step = (delta: number) => setIndex((i) => (i + delta + list.length) % list.length);

  return (
    <div
      className="st-tipbar"
      role="note"
      aria-label="Tip"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Lightbulb size={13} className="flex-none text-[var(--gilt)]" aria-hidden />
      <p className="min-w-0 flex-1 text-[0.75rem] leading-snug text-zinc-300" aria-live="polite">
        {list[index % list.length]}
      </p>
      <span className="hidden font-mono text-[10px] text-zinc-600 sm:inline">
        {(index % list.length) + 1}/{list.length}
      </span>
      <button type="button" className="st-btn st-btn-sm st-btn-icon st-btn-ghost" onClick={() => step(-1)} aria-label="Previous tip">
        <ChevronLeft size={13} />
      </button>
      <button type="button" className="st-btn st-btn-sm st-btn-icon st-btn-ghost" onClick={() => step(1)} aria-label="Next tip">
        <ChevronRight size={13} />
      </button>
      <button type="button" className="st-btn st-btn-sm st-btn-ghost" onClick={openGuide}>
        <BookOpen size={12} /> All features
      </button>
      <button type="button" className="st-btn st-btn-sm st-btn-icon st-btn-ghost" onClick={() => setTips(false)} aria-label="Turn tips off" data-tip="Turn tips and hover cards off. Switch them back on from the sidebar.">
        <X size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The guide
// ---------------------------------------------------------------------------

function GuideDrawer({ onClose, onGo }: { onClose: () => void; onGo: (view: GuideView) => void }) {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => searchGuide(query), [query]);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
      // Keep Tab inside the panel while it is open.
      if (event.key === 'Tab' && panel.current) {
        const focusable = panel.current.querySelectorAll<HTMLElement>('button, input, [href]');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close the guide" tabIndex={-1} onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-guide-title"
        className="st-rise relative flex h-full w-full max-w-[30rem] flex-col border-l border-zinc-800 bg-[var(--bg-raised)] shadow-2xl"
      >
        <header className="flex-none border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <BookOpen size={16} className="text-[var(--accent)]" aria-hidden />
            <h2 id="studio-guide-title" className="st-title flex-1 text-lg">
              Everything the hub can do
            </h2>
            <button type="button" className="st-btn st-btn-icon st-btn-ghost" onClick={onClose} aria-label="Close the guide">
              <X size={15} />
            </button>
          </div>
          <div className="relative mt-4">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              ref={input}
              className="st-input !pl-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search — “priority”, “hero”, “crop”, “publish”…"
              aria-label="Search the guide"
            />
          </div>
          <p className="st-hint">
            Press <kbd className="font-mono">?</kbd> anywhere to open this, <kbd className="font-mono">Esc</kbd> to close.
          </p>
        </header>

        <div className="st-scroll min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
          {sections.length === 0 && <p className="text-sm text-zinc-500">Nothing matches “{query}”.</p>}
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`guide-${section.id}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 id={`guide-${section.id}`} className="st-eyebrow !text-[0.6875rem] !text-zinc-300">
                  {section.title}
                </h3>
                {section.view && (
                  <button type="button" className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--accent)] hover:underline" onClick={() => onGo(section.view!)}>
                    Go there <ArrowRight size={11} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[0.75rem] leading-relaxed text-zinc-500">{section.summary}</p>
              <dl className="mt-3 divide-y divide-zinc-800 rounded-md border border-zinc-800">
                {section.features.map((feature) => (
                  <div key={feature.title} className="px-3.5 py-2.5">
                    <dt className="text-[0.8125rem] font-medium text-zinc-100">{feature.title}</dt>
                    <dd className="mt-0.5 text-[0.75rem] leading-relaxed text-zinc-400">{feature.body}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
