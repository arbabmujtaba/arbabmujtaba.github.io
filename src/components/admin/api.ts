import type { CollectionId, ListItem, WorkflowState } from './model';

/** Thin, typed wrappers over the local Express API. Every call throws a readable Error. */

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || body?.message || fallback;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

async function json<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) throw new Error(await readError(res, fallback));
  return (await res.json()) as T;
}

/**
 * When the server runs with STUDIO_TOKEN set, mutating calls need the token.
 * Store it once in the browser: localStorage.setItem('studio_token', '…').
 */
const studioToken = (): Record<string, string> => {
  try {
    const token = window.localStorage.getItem('studio_token');
    return token ? { 'x-studio-token': token } : {};
  } catch {
    return {};
  }
};

const jsonHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', ...studioToken() });

export async function listContent(): Promise<ListItem[]> {
  const res = await fetch('/api/content');
  const items = await json<any[]>(res, 'Could not load content');
  return items.map((item) => ({
    ...item,
    state: (item.state || 'published') as WorkflowState,
    visible: item.visible !== false,
  }));
}

export interface Doc {
  collection: CollectionId;
  slug: string;
  data: Record<string, any>;
  body: string;
}

export async function getDoc(collection: string, slug: string): Promise<Doc> {
  const res = await fetch(`/api/content/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}`);
  return json<Doc>(res, 'Could not open this entry');
}

export async function createDoc(
  collection: string,
  slug: string,
  data: Record<string, any>,
  body: string
): Promise<{ slug: string }> {
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ collection, slug, data, body }),
  });
  return json(res, 'Could not create the entry');
}

export async function updateDoc(
  collection: string,
  slug: string,
  newSlug: string,
  data: Record<string, any>,
  body: string
): Promise<{ slug: string }> {
  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ collection, slug, newSlug, data, body }),
  });
  return json(res, 'Could not save the entry');
}

export async function deleteDoc(collection: string, slug: string): Promise<void> {
  const res = await fetch('/api/content', {
    method: 'DELETE',
    headers: jsonHeaders(),
    body: JSON.stringify({ collection, slug }),
  });
  await json(res, 'Could not delete the entry');
}

export async function setState(collection: string, slug: string, state: WorkflowState): Promise<void> {
  const res = await fetch(`/api/content/${encodeURIComponent(collection)}/${encodeURIComponent(slug)}/state`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ state }),
  });
  await json(res, 'Could not change the state');
}

export async function startPublish(args: {
  collection: string;
  slug: string;
  title: string;
  body: string;
  frontmatter: Record<string, any>;
}): Promise<{ jobId: string }> {
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(args),
  });
  return json(res, 'Publishing failed to start');
}

export interface UploadResult {
  url: string;
  converted?: { from: string; to: string };
}

/**
 * Upload one file. `collection` goes in the multipart body BEFORE the file:
 * multer reads it to choose the destination folder as the stream arrives.
 * Uses XHR rather than fetch so a 40 MB clip can report progress.
 */
export function uploadFile(
  file: File,
  collection: string,
  onProgress?: (fraction: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('collection', collection);
    form.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    for (const [name, value] of Object.entries(studioToken())) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new Error('Could not upload — is the local server running?'));
    xhr.onload = () => {
      let body: any = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Fall through to the status check.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.url) {
        onProgress?.(1);
        resolve({ url: body.url, converted: body.converted });
      } else {
        reject(new Error(body.error || `Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.send(form);
  });
}

export interface OptimizationStatus {
  queued?: number;
  active?: string | null;
  idle?: boolean;
  failures?: { label: string; error: string }[];
}

export async function getOptimization(): Promise<OptimizationStatus | null> {
  try {
    const res = await fetch('/api/uploads/optimization');
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export const isVideoUrl = (url: string | undefined): boolean => /\.(mp4|webm|mov)(\?|#|$)/i.test(url || '');
export const isGifUrl = (url: string | undefined): boolean => /\.gif(\?|#|$)/i.test(url || '');

/**
 * Grab one frame of a clip as a WebP file, for use as its poster.
 * The clip is same-origin (`/uploads/...`), so the canvas is never tainted.
 */
export function captureVideoFrame(src: string, atSeconds?: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    const fail = () => reject(new Error('Could not read a frame from this clip.'));
    video.onerror = fail;

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = atSeconds ?? Math.min(duration * 0.25, 3);
      video.currentTime = Math.max(0, Math.min(target, Math.max(0, duration - 0.05)));
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx || !canvas.width) return fail();
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return fail();
          resolve(new File([blob], 'poster.webp', { type: 'image/webp' }));
        },
        'image/webp',
        0.88
      );
    };
  });
}
