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
