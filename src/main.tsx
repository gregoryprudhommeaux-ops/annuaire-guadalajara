import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function maybeReloadOnChunkError(reason: unknown) {
  const msg = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason ?? '');
  const isChunkFail =
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError');

  if (!isChunkFail) return;

  // Avoid infinite reload loops if the asset truly cannot be fetched.
  const key = 'did_reload_after_chunk_error_v1';
  if (sessionStorage.getItem(key) === '1') return;
  sessionStorage.setItem(key, '1');
  window.location.reload();
}

// Vite-specific preload error event.
window.addEventListener('vite:preloadError' as any, (e: any) => {
  maybeReloadOnChunkError(e?.detail ?? e);
});

// Generic: failed dynamic import usually triggers unhandledrejection.
window.addEventListener('unhandledrejection', (e) => {
  maybeReloadOnChunkError((e as PromiseRejectionEvent).reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
