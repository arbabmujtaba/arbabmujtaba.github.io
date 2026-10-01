import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Laptop, Loader2, Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react';
import { previewPayloadFromForm, publicPath, type FormState, type PreviewView } from './model';
import { PREVIEW_FRAME_PATH, PREVIEW_MESSAGE, PREVIEW_READY } from './PreviewHost';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1280, icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 820, icon: Tablet },
  { id: 'mobile', label: 'Mobile', width: 390, icon: Smartphone },
] as const;

type DeviceId = (typeof DEVICES)[number]['id'];

/**
 * The entry as the site draws it.
 *
 * The frame is the site's own renderer (see PreviewHost) in a same-origin iframe, fed by
 * postMessage. Nothing here imitates the site; it only scales a real page down to fit
 * and tells it what to show.
 */
export function LivePreview({
  form,
  replay,
  onReplay,
  canPage,
  defaultDevice = 'desktop',
}: {
  form: FormState;
  replay: number;
  onReplay: () => void;
  /** Whether this collection has a full page (otherwise only the card is meaningful). */
  canPage: boolean;
  /** A narrow host (the reel wizard) reads better at phone width than at a 33% desktop. */
  defaultDevice?: DeviceId;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<DeviceId>(defaultDevice);
  const [view, setView] = useState<PreviewView>(canPage ? 'page' : 'card');
  const [ready, setReady] = useState(false);
  // Bumps on every (re)handshake, so a reloaded frame is sent the payload again.
  const [handshake, setHandshake] = useState(0);
  const [box, setBox] = useState({ width: 560, height: 640 });

  useEffect(() => {
    if (!canPage) setView('card');
  }, [canPage]);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === PREVIEW_READY) {
        setReady(true);
        setHandshake((n) => n + 1);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const payload = useMemo(() => previewPayloadFromForm(form, view, replay), [form, view, replay]);

  // Debounced so typing stays smooth; the site renders every keystroke otherwise.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, payload }, window.location.origin);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [payload, ready, handshake]);

  const deviceWidth = DEVICES.find((d) => d.id === device)!.width;
  const scale = Math.min(1, box.width / deviceWidth);
  const frameHeight = box.height / scale;
  const url = publicPath(form.collection, form.slug || 'untitled');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
        <span className="st-eyebrow mr-1 flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${ready ? 'bg-emerald-400' : 'st-pulse bg-amber-400'}`} />
          Live preview
        </span>

        <div className="st-seg" role="group" aria-label="Device">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={device === id} title={label} aria-label={label} onClick={() => setDevice(id)}>
              <Icon size={13} />
            </button>
          ))}
        </div>

        <div className="st-seg" role="group" aria-label="What to preview">
          <button type="button" aria-pressed={view === 'page'} disabled={!canPage} onClick={() => setView('page')}>
            Page
          </button>
          <button type="button" aria-pressed={view === 'card'} onClick={() => setView('card')}>
            In the list
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className="st-btn st-btn-sm st-btn-ghost" onClick={onReplay} title="Replay the entrance animation">
            <RotateCw size={12} /> Replay
          </button>
          {!form.isNew && (
            <a className="st-btn st-btn-sm st-btn-ghost" href={url} target="_blank" rel="noreferrer" title="Open the saved version on the site">
              <ExternalLink size={12} /> Site
            </a>
          )}
        </div>
      </div>

      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden bg-[var(--bg-deep)]">
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden bg-black shadow-2xl"
          style={{
            width: deviceWidth,
            height: frameHeight,
            transform: `scale(${scale})`,
            left: `${Math.max(0, (box.width - deviceWidth * scale) / 2)}px`,
          }}
        >
          <iframe
            ref={frame}
            title="Live preview of this entry on the site"
            src={PREVIEW_FRAME_PATH}
            className="block h-full w-full border-0"
          />
        </div>
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-deep)]/80 text-zinc-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">starting preview…</span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-zinc-600">
          <Laptop size={10} /> {deviceWidth}px · {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
