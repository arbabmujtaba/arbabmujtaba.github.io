import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { Clapperboard, Film, ImagePlus, Link2, Loader2, Replace, Trash2, UploadCloud } from 'lucide-react';
import { captureVideoFrame, getOptimization, isVideoUrl, uploadFile } from './api';
import { Field } from './ui';

export type Notify = (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.gif';
const CLIP_ACCEPT = 'video/mp4,video/webm,.mp4,.webm';

/** Shared upload state: progress, errors, and the server's WebP conversion queue. */
function useUpload(collection: string, notify: Notify) {
  const [progress, setProgress] = useState<number | null>(null);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    if (!queued) return;
    let stopped = false;
    const poll = async () => {
      const status = await getOptimization();
      if (stopped) return;
      if (!status || status.idle) {
        setQueued(false);
        return;
      }
      timer = window.setTimeout(poll, 1500);
    };
    let timer = window.setTimeout(poll, 1200);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [queued]);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setProgress(0);
      try {
        const result = await uploadFile(file, collection, setProgress);
        if (result.converted) {
          notify('info', `Converted ${result.converted.from} → ${result.converted.to} for a lighter page.`);
          setQueued(true);
        }
        return result.url;
      } catch (error) {
        notify('error', error instanceof Error ? error.message : 'Upload failed');
        return null;
      } finally {
        setProgress(null);
      }
    },
    [collection, notify]
  );

  return { upload, progress, queued, busy: progress !== null };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <div className="h-full bg-[var(--accent)] transition-[width] duration-150" style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  );
}

function Dropzone({
  accept,
  icon,
  title,
  subtitle,
  busy,
  progress,
  onFile,
  compact = false,
}: {
  accept: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  busy: boolean;
  progress: number | null;
  onFile: (file: File) => void;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`st-dropzone flex cursor-pointer flex-col items-center justify-center gap-2 text-center ${compact ? 'px-4 py-5' : 'px-6 py-9'}`}
      data-over={over}
      role="button"
      tabIndex={0}
      onClick={() => !busy && input.current?.click()}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && !busy && input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
      {busy ? (
        <>
          <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          <div className="w-40">{progress !== null && <ProgressBar value={progress} />}</div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {progress !== null && progress < 1 ? `uploading ${Math.round(progress * 100)}%` : 'processing…'}
          </span>
        </>
      ) : (
        <>
          <span className="text-zinc-500">{icon}</span>
          <span className="text-[0.8125rem] font-medium text-zinc-200">{title}</span>
          <span className="text-[0.6875rem] text-zinc-500">{subtitle}</span>
        </>
      )}
    </div>
  );
}

function UrlRow({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="flex items-center gap-2">
      <Link2 size={13} className="flex-none text-zinc-500" />
      <input
        className="st-input st-mono"
        value={draft}
        spellCheck={false}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => draft.trim() !== value && onChange(draft.trim())}
        onKeyDown={(event) => event.key === 'Enter' && onChange(draft.trim())}
      />
    </div>
  );
}

/** A still image (or GIF): drop, replace, remove, or paste a URL. */
export function MediaField({
  label,
  value,
  onChange,
  collection,
  notify,
  hint,
  placeholder = '/uploads/…',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  collection: string;
  notify: Notify;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  const { upload, progress, queued, busy } = useUpload(collection, notify);
  const replace = useRef<HTMLInputElement>(null);
  const [showUrl, setShowUrl] = useState(false);

  const take = async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|avif|gif)$/i.test(file.name)) {
      notify('error', 'That is not an image. Use JPG, PNG, WebP, AVIF or GIF.');
      return;
    }
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <Field label={label} hint={hint}>
      {value ? (
        <div className="st-well overflow-hidden">
          <div className="st-checker relative flex max-h-64 items-center justify-center overflow-hidden bg-black">
            {isVideoUrl(value) ? (
              <video src={value} className="max-h-64 w-full object-contain" muted loop playsInline autoPlay />
            ) : (
              <img src={value} alt="" className="max-h-64 w-full object-contain" />
            )}
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                <div className="w-32">{progress !== null && <ProgressBar value={progress} />}</div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 p-2">
            <input
              ref={replace}
              type="file"
              accept={IMAGE_ACCEPT}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void take(file);
                event.target.value = '';
              }}
            />
            <button type="button" className="st-btn st-btn-sm" disabled={busy} onClick={() => replace.current?.click()}>
              <Replace size={12} /> Replace
            </button>
            <button type="button" className="st-btn st-btn-sm st-btn-ghost" onClick={() => setShowUrl((v) => !v)}>
              <Link2 size={12} /> URL
            </button>
            <button type="button" className="st-btn st-btn-sm st-btn-ghost ml-auto" onClick={() => onChange('')}>
              <Trash2 size={12} /> Remove
            </button>
          </div>
          {showUrl && (
            <div className="border-t border-zinc-800 p-2">
              <UrlRow value={value} onChange={onChange} placeholder={placeholder} />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Dropzone
            accept={IMAGE_ACCEPT}
            icon={<ImagePlus size={22} />}
            title="Drop an image, or click to browse"
            subtitle="JPG · PNG · WebP · AVIF · GIF — up to 40 MB, converted to WebP for you"
            busy={busy}
            progress={progress}
            onFile={take}
          />
          <UrlRow value={value} onChange={onChange} placeholder={`…or paste a URL, e.g. ${placeholder}`} />
        </div>
      )}
      {queued && (
        <p className="st-hint flex items-center gap-1.5 !text-amber-400">
          <Loader2 size={11} className="animate-spin" /> Optimising in the background — the file keeps its name when it finishes.
        </p>
      )}
    </Field>
  );
}

/**
 * A short clip and the still shown before it plays.
 * The poster can be a frame grabbed from the clip itself, so the common case is one click.
 */
export function ClipField({
  video,
  poster,
  onVideo,
  onPoster,
  collection,
  notify,
}: {
  video: string;
  poster: string;
  onVideo: (url: string) => void;
  onPoster: (url: string) => void;
  collection: string;
  notify: Notify;
  }) {
  const clip = useUpload(collection, notify);
  const still = useUpload(collection, notify);
  const player = useRef<HTMLVideoElement>(null);
  const [grabbing, setGrabbing] = useState(false);

  const takeClip = async (file: File) => {
    if (!/\.(mp4|webm|gif)$/i.test(file.name) && !/^video\//.test(file.type)) {
      notify('error', 'Clips must be MP4, WebM or GIF.');
      return;
    }
    const url = await clip.upload(file);
    if (!url) return;
    onVideo(url);
    if (!poster && !/\.gif$/i.test(url)) {
      try {
        const frame = await captureVideoFrame(url);
        const posterUrl = await still.upload(frame);
        if (posterUrl) {
          onPoster(posterUrl);
          notify('success', 'Poster frame taken from the clip.');
        }
      } catch {
        // The clip may still be streaming in; the author can grab a frame by hand.
      }
    }
  };

  const grab = async () => {
    if (!video) return;
    setGrabbing(true);
    try {
      const at = player.current?.currentTime;
      const frame = await captureVideoFrame(video, at && at > 0 ? at : undefined);
      const url = await still.upload(frame);
      if (url) {
        onPoster(url);
        notify('success', 'Poster set to the current frame.');
      }
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not take a frame.');
    } finally {
      setGrabbing(false);
    }
  };

  const posterInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <Field label="Clip" hint="MP4 or WebM, up to 40 MB. It plays muted, loops, and only while it is on screen.">
        {video ? (
          <div className="st-well overflow-hidden">
            <div className="relative bg-black">
              {/\.gif(\?|$)/i.test(video) ? (
                <img src={video} alt="" className="max-h-72 w-full object-contain" />
              ) : (
                <video
                  ref={player}
                  src={video}
                  poster={poster || undefined}
                  className="max-h-72 w-full object-contain"
                  controls
                  muted
                  loop
                  playsInline
                />
              )}
              {clip.busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                  <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                  <div className="w-32">{clip.progress !== null && <ProgressBar value={clip.progress} />}</div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 p-2">
              <label className="st-btn st-btn-sm cursor-pointer">
                <Replace size={12} /> Replace
                <input
                  type="file"
                  accept={`${CLIP_ACCEPT},.gif,image/gif`}
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void takeClip(file);
                    event.target.value = '';
                  }}
                />
              </label>
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-500">{video}</span>
              <button
                type="button"
                className="st-btn st-btn-sm st-btn-ghost"
                onClick={() => {
                  onVideo('');
                  onPoster('');
                }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Dropzone
              accept={`${CLIP_ACCEPT},.gif,image/gif`}
              icon={<Film size={22} />}
              title="Drop a clip, or click to browse"
              subtitle="MP4 · WebM · GIF — up to 40 MB"
              busy={clip.busy}
              progress={clip.progress}
              onFile={takeClip}
            />
            <UrlRow value={video} onChange={onVideo} placeholder="…or paste a URL, e.g. /uploads/home/clip.mp4" />
          </div>
        )}
      </Field>

      {video && (
        <Field
          label="Poster"
          hint="The still shown before the clip plays, and the thumbnail everywhere it is listed. Scrub the clip above, then take the frame."
        >
          <div className="flex items-start gap-3">
            <div className="st-thumb !h-20 !w-32 flex-none">
              {poster ? (
                <img src={poster} alt="Poster" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-zinc-600">
                  <Clapperboard size={18} />
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="st-btn st-btn-sm"
                disabled={grabbing || still.busy || /\.gif(\?|$)/i.test(video)}
                onClick={grab}
              >
                {grabbing || still.busy ? <Loader2 size={12} className="animate-spin" /> : <Clapperboard size={12} />}
                Use current frame
              </button>
              <button type="button" className="st-btn st-btn-sm" disabled={still.busy} onClick={() => posterInput.current?.click()}>
                <UploadCloud size={12} /> Upload still
              </button>
              {poster && (
                <button type="button" className="st-btn st-btn-sm st-btn-ghost" onClick={() => onPoster('')}>
                  <Trash2 size={12} /> Clear
                </button>
              )}
              <input
                ref={posterInput}
                type="file"
                accept={IMAGE_ACCEPT}
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  const url = await still.upload(file);
                  if (url) onPoster(url);
                }}
              />
            </div>
          </div>
        </Field>
      )}
    </div>
  );
}
