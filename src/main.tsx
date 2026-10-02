import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * The admin's live preview is this same app, loaded in an iframe on a path the
 * public router does not know. `import.meta.env.DEV` keeps the branch (and the
 * preview chunk) out of the production build, where /admin does not exist.
 */
const PreviewHost = import.meta.env.DEV
  ? lazy(() => import('./components/admin/PreviewHost'))
  : null;

const isPreviewFrame =
  import.meta.env.DEV && window.location.pathname.replace(/\/$/, '') === '/admin/preview-frame';

/**
 * A deploy replaces every hashed chunk. A visitor whose tab predates it still
 * holds the old index, so the next lazy page they open asks for a file that no
 * longer exists and the navigation dies silently — this was the "works locally,
 * breaks on the live site" class of failure. Reload once onto the new build;
 * the sessionStorage stamp stops a genuinely missing chunk from looping.
 */
window.addEventListener('vite:preloadError', (event) => {
  const stamp = 'archive.chunk-reload';
  const last = Number(sessionStorage.getItem(stamp) || 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(stamp, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPreviewFrame && PreviewHost ? (
      <Suspense fallback={null}>
        <PreviewHost />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
