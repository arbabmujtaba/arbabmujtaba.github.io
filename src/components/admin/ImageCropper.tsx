import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Loader2, Move, RotateCcw, Scissors } from 'lucide-react';
import { ASPECT_OPTIONS, aspectRatioOf } from '../../lib/customization';
import { cropRect, focalFromCenter } from '../../lib/crop';
import type { ImageAspect, PostCustomization } from '../../types';
import { uploadFile } from './api';
import type { Notify } from './MediaField';
import { Field, Segmented, Slider } from './ui';

type ImageSettings = NonNullable<PostCustomization['image']>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Maximum width of a baked crop; keeps the saved file web-sized. */
const BAKE_MAX_WIDTH = 2400;

/**
 * Crop, frame and align the cover.
 *
 * The photograph is never altered by default: the post stores an aspect, a focal
 * point and a zoom, and the site reproduces them. The rectangle drawn here is
 * computed by the very same arithmetic (`lib/crop.ts`), so what you frame is
 * exactly what visitors see. "Apply crop" can additionally bake the window into
 * a new file.
 */
export function ImageCropper({
  src,
  value,
  onChange,
  onBake,
  collection,
  notify,
}: {
  src: string;
  value: ImageSettings | undefined;
  onChange: (next: ImageSettings) => void;
  /** Called with the URL of the cropped file; the caller swaps the cover. */
  onBake: (url: string) => void;
  collection: string;
  notify: Notify;
}) {
  const image = value ?? {};
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [baking, setBaking] = useState(false);
  const grab = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  useEffect(() => setNatural(null), [src]);

  const patch = useCallback(
    (next: Partial<ImageSettings>) => {
      const merged: Record<string, unknown> = { ...image, ...next };
      for (const key of Object.keys(merged)) if (merged[key] === undefined) delete merged[key];
      onChange(merged as ImageSettings);
    },
    [image, onChange]
  );

  const fit = image.fit === 'contain' ? 'contain' : 'cover';
  const zoom = image.zoom ?? 1;
  const focalX = image.focalX ?? 50;
  const focalY = image.focalY ?? 50;
  const aspect: ImageAspect = image.aspect ?? '16/9';
  const ratio = natural ? aspectRatioOf(aspect) ?? natural.w / natural.h : 16 / 9;

  const rect = natural
    ? cropRect({ width: natural.w, height: natural.h, ratio, focalX, focalY, zoom: fit === 'contain' ? 1 : zoom })
    : null;

  const trims = !!rect && !!natural && (rect.sw < natural.w - 1 || rect.sh < natural.h - 1);

  const pointerToSource = (event: { clientX: number; clientY: number }) => {
    const box = imgRef.current?.getBoundingClientRect();
    if (!box || !natural) return null;
    return {
      x: clamp((event.clientX - box.left) / box.width, 0, 1) * natural.w,
      y: clamp((event.clientY - box.top) / box.height, 0, 1) * natural.h,
    };
  };

  const moveTo = (event: { clientX: number; clientY: number }) => {
    if (!natural) return;
    const point = pointerToSource(event);
    if (!point) return;
    const next = focalFromCenter(
      { width: natural.w, height: natural.h, ratio, zoom },
      point.x - grab.current.dx,
      point.y - grab.current.dy
    );
    patch({ focalX: Math.round(next.focalX), focalY: Math.round(next.focalY) });
  };

  const onStageDown = (event: React.PointerEvent) => {
    if (!natural || !rect || fit === 'contain') return;
    const point = pointerToSource(event);
    if (!point) return;
    const inside =
      point.x >= rect.sx && point.x <= rect.sx + rect.sw && point.y >= rect.sy && point.y <= rect.sy + rect.sh;
    // Grabbing the window keeps it where it is; clicking elsewhere recentres it there.
    grab.current = inside
      ? { dx: point.x - (rect.sx + rect.sw / 2), dy: point.y - (rect.sy + rect.sh / 2) }
      : { dx: 0, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    moveTo(event);
  };

  const onKey = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    patch({ focalX: clamp(focalX + move[0], 0, 100), focalY: clamp(focalY + move[1], 0, 100) });
  };

  const bake = async () => {
    if (!natural || !rect || !imgRef.current) return;
    setBaking(true);
    try {
      const outW = Math.min(BAKE_MAX_WIDTH, Math.round(rect.sw));
      const outH = Math.round(outW * (rect.sh / rect.sw));
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgRef.current, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, outW, outH);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92));
      if (!blob) throw new Error('Could not encode the cropped image.');
      const name = (src.split('/').pop() || 'cover').replace(/\.[a-z0-9]+$/i, '');
      const result = await uploadFile(new File([blob], `${name}-crop.webp`, { type: 'image/webp' }), collection);
      onBake(result.url);
      onChange({ ...image, zoom: undefined, focalX: undefined, focalY: undefined });
      notify('success', 'Crop applied — the cover is now the cropped file.');
    } catch (error) {
      notify(
        'error',
        error instanceof Error && !/tainted|insecure/i.test(error.message)
          ? error.message
          : 'This image cannot be cropped in the browser (it is hosted elsewhere). The framing above still applies on the site.'
      );
    } finally {
      setBaking(false);
    }
  };

  const reset = () => onChange({ ...image, focalX: undefined, focalY: undefined, zoom: undefined });
  const moved = image.focalX !== undefined || image.focalY !== undefined || image.zoom !== undefined;

  return (
    <div className="space-y-5">
      <Field label="Shape" hint="The frame the cover is shown in. “Original” keeps the photo’s own proportions.">
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_OPTIONS.map((option) => {
            const shapeRatio = option.ratio ?? (natural ? natural.w / natural.h : 1.5);
            const w = shapeRatio >= 1 ? 22 : 22 * shapeRatio;
            const h = shapeRatio >= 1 ? 22 / shapeRatio : 22;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={aspect === option.id}
                onClick={() => patch({ aspect: option.id })}
                className="group flex w-[3.6rem] flex-col items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-1 py-2 transition-colors hover:border-zinc-600 aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)]"
              >
                <span
                  className="block border border-zinc-500 group-aria-pressed:border-[var(--accent)]"
                  style={{ width: w, height: h }}
                />
                <span className="font-mono text-[9.5px] tracking-wide text-zinc-400 group-aria-pressed:text-zinc-100">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Crop"
        right={
          <button type="button" className="st-btn st-btn-sm st-btn-ghost" disabled={!moved} onClick={reset}>
            <RotateCcw size={11} /> Centre
          </button>
        }
        hint={
          fit === 'contain'
            ? 'The whole photo is shown, so there is nothing to crop.'
            : 'Drag the bright window — or click anywhere on the photo — to choose what stays in frame. Arrow keys nudge it.'
        }
      >
        <div className="st-well st-checker flex items-center justify-center overflow-hidden p-2">
          <div
            className="relative inline-block max-w-full touch-none select-none"
            onPointerDown={onStageDown}
            onPointerMove={(event) => dragging && moveTo(event)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            style={{ cursor: fit === 'contain' ? 'default' : dragging ? 'grabbing' : 'crosshair' }}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Cover to crop"
              draggable={false}
              crossOrigin="anonymous"
              className="block max-h-[19rem] max-w-full rounded-sm"
              onLoad={(event) =>
                setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })
              }
            />
            {natural && rect && fit !== 'contain' && (
              <div
                tabIndex={0}
                role="slider"
                aria-label="Crop window"
                aria-valuetext={`Centred at ${Math.round(focalX)}% across, ${Math.round(focalY)}% down`}
                aria-valuenow={Math.round(focalX)}
                onKeyDown={onKey}
                className="absolute outline-none"
                style={{
                  left: `${(rect.sx / natural.w) * 100}%`,
                  top: `${(rect.sy / natural.h) * 100}%`,
                  width: `${(rect.sw / natural.w) * 100}%`,
                  height: `${(rect.sh / natural.h) * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(8,8,7,0.62)',
                  border: '1.5px solid var(--accent)',
                  cursor: dragging ? 'grabbing' : 'grab',
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, transparent 33.2%, rgba(255,255,255,.28) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,.28) 66.6%, transparent 66.8%), linear-gradient(to bottom, transparent 33.2%, rgba(255,255,255,.28) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,.28) 66.6%, transparent 66.8%)',
                  }}
                />
                <Move size={14} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70 drop-shadow" />
              </div>
            )}
          </div>
        </div>
        {natural && rect && (
          <p className="mt-2 font-mono text-[10px] text-zinc-500">
            source {natural.w}×{natural.h}px · frame {Math.round(rect.sw)}×{Math.round(rect.sh)}px · focus {Math.round(focalX)}% / {Math.round(focalY)}%
          </p>
        )}
      </Field>

      <Slider
        label="Zoom"
        value={image.zoom}
        fallback={1}
        min={1}
        max={3}
        step={0.05}
        unit="×"
        onChange={(zoomValue) => patch({ zoom: zoomValue && zoomValue > 1 ? zoomValue : undefined })}
      />

      <div className="grid grid-cols-2 gap-5">
        <Field label="Fit">
          <Segmented
            block
            label="Fit"
            value={fit}
            onChange={(next) => patch({ fit: next === 'cover' ? undefined : next })}
            options={[
              { id: 'cover', label: 'Fill', title: 'Fill the frame, cropping the edges' },
              { id: 'contain', label: 'Whole', title: 'Show the whole photo, letterboxed' },
            ]}
          />
        </Field>
        <Field label="Photo width">
          <Segmented
            block
            label="Photo width"
            value={image.width ?? 'full'}
            onChange={(next) => patch({ width: next === 'full' ? undefined : next })}
            options={[
              { id: 'full', label: 'Full' },
              { id: 'large', label: 'L' },
              { id: 'medium', label: 'M' },
              { id: 'small', label: 'S' },
            ]}
          />
        </Field>
      </div>

      <Field
        label="Alignment"
        hint={(image.width ?? 'full') === 'full' ? 'Pick a narrower width to place the photo left, centre or right.' : undefined}
      >
        <Segmented
          block
          label="Photo alignment"
          value={image.align ?? 'center'}
          onChange={(next) => patch({ align: next === 'center' ? undefined : next })}
          options={[
            { id: 'left', label: 'Left' },
            { id: 'center', label: 'Centre' },
            { id: 'right', label: 'Right' },
          ]}
        />
      </Field>

      <div className="st-well flex items-center justify-between gap-4 p-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] text-zinc-200">Save the crop as a new file</p>
          <p className="mt-0.5 text-[0.6875rem] leading-snug text-zinc-500">
            Optional. Makes the photo itself match the frame — smaller to load, and the crop travels with the file.
          </p>
        </div>
        <button
          type="button"
          className="st-btn st-btn-sm flex-none"
          disabled={baking || !trims || fit === 'contain'}
          onClick={bake}
        >
          {baking ? <Loader2 size={12} className="animate-spin" /> : <Scissors size={12} />}
          Apply crop
        </button>
      </div>
      {!trims && fit !== 'contain' && natural && (
        <p className="st-hint flex items-center gap-1.5 !mt-[-0.75rem]">
          <Crop size={11} /> The frame already covers the whole photo — nothing to trim.
        </p>
      )}
    </div>
  );
}
