import React, { StrictMode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Keep console visibility in production debugging scenarios.
    console.error('[root] Uncaught render error', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
            Erreur
          </p>
          <h1 className="mt-2 text-lg font-semibold">Le site a rencontré un problème.</h1>
          <p className="mt-2 text-sm text-slate-600">
            Essaie de recharger la page. Si le problème persiste, il peut s’agir d’un cache navigateur.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
              onClick={() => window.location.reload()}
            >
              Recharger
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => {
                try {
                  window.sessionStorage.clear();
                  window.localStorage.clear();
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
            >
              Vider le cache session et recharger
            </button>
          </div>
        </div>
      </div>
    );
  }
}

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
  try {
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Fallback if sessionStorage is unavailable (privacy modes).
    if ((window as any).__didReloadAfterChunkErrorV1) return;
    (window as any).__didReloadAfterChunkErrorV1 = true;
  }
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
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
