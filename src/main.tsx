import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Report uncaught client errors back to the local server so they can be
// diagnosed during development. Does not block execution.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    try {
      fetch('/__client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: ev.message, filename: (ev.error && ev.error.stack) || ev.filename || null })
      }).catch(() => {});
    } catch {}
  });
  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const reason = (ev as any).reason;
      fetch('/__client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: String(reason && reason.message ? reason.message : reason), stack: reason && reason.stack ? reason.stack : null })
      }).catch(() => {});
    } catch {}
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
