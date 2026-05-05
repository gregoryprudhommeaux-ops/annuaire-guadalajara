import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type ResolveOk = {
  ok: true;
  linkId: string;
  sessionId: string;
  expiresAtMs: number;
};

type ResolveErr = {
  ok: false;
  status: 'not_found' | 'expired' | 'revoked' | 'error';
  message?: string;
};

function inferFirebaseProjectId(): string {
  const projectId = (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID || undefined;
  const inferredProjectId =
    projectId ||
    (typeof window !== 'undefined' && (window as any).__FIREBASE_DEFAULTS__?.config?.projectId) ||
    undefined;
  return inferredProjectId || 'gen-lang-client-0229891518';
}

function buildResolveUrl(token: string): string {
  const pid = inferFirebaseProjectId();
  return `https://us-central1-${pid}.cloudfunctions.net/viewerMagicLinkResolve?token=${encodeURIComponent(
    token
  )}`;
}

export default function ViewerMagicLinkPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [err, setErr] = useState<ResolveErr | null>(null);

  const cleanToken = useMemo(() => String(token ?? '').trim(), [token]);

  useEffect(() => {
    if (!cleanToken) {
      setErr({ ok: false, status: 'not_found', message: 'Lien invalide.' });
      setStatus('error');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setErr(null);

    (async () => {
      try {
        const res = await fetch(buildResolveUrl(cleanToken), {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        const json = (await res.json().catch(() => null)) as ResolveOk | ResolveErr | null;
        if (cancelled) return;
        if (!json || (json as any).ok !== true) {
          const e: ResolveErr =
            json && typeof json === 'object'
              ? (json as ResolveErr)
              : { ok: false, status: 'error', message: 'Accès non disponible.' };
          setErr(e);
          setStatus('error');
          try {
            window.localStorage.removeItem('fn_viewer_access:v1');
          } catch {
            // ignore
          }
          return;
        }

        const ok = json as ResolveOk;
        if (!ok.linkId || !ok.sessionId || !ok.expiresAtMs) {
          setErr({ ok: false, status: 'error', message: 'Réponse invalide.' });
          setStatus('error');
          return;
        }

        try {
          window.localStorage.setItem(
            'fn_viewer_access:v1',
            JSON.stringify({
              token: cleanToken,
              linkId: ok.linkId,
              sessionId: ok.sessionId,
              expiresAtMs: ok.expiresAtMs,
            })
          );
        } catch {
          // ignore
        }

        setStatus('ok');
        navigate('/dashboard', { replace: true });
      } catch (e) {
        if (cancelled) return;
        setErr({
          ok: false,
          status: 'error',
          message: e instanceof Error ? e.message : 'Erreur réseau.',
        });
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cleanToken, navigate]);

  const title = status === 'loading' ? 'Activation…' : 'Accès démo';
  const msg =
    status === 'loading'
      ? 'Vérification du lien en cours…'
      : err?.status === 'expired' || err?.status === 'revoked'
        ? 'Cet accès temporaire a expiré ou a été révoqué.'
        : err?.message || 'Accès non disponible.';

  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-base font-extrabold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">{msg}</p>
      {status === 'error' ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <a
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            href="mailto:contact@franconetwork.app?subject=Demande%20d%27extension%20acc%C3%A8s%20d%C3%A9mo"
          >
            Contacter l’admin
          </a>
          <button
            type="button"
            className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            onClick={() => navigate('/', { replace: true })}
          >
            Revenir à l’accueil
          </button>
        </div>
      ) : null}
    </div>
  );
}

