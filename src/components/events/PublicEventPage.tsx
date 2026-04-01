import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, limit, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/firebase';
import type { AdminEvent, Language } from '@/types';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
};

function fmtDateTime(ts: Timestamp | null | undefined, lang: Language): string {
  if (!ts) return '';
  try {
    const d = ts.toDate();
    return d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function PublicEventPage({ lang, t }: Props) {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<AdminEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = String(slug ?? '').trim();
      if (!s) {
        setEvent(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'events'), where('slug', '==', s), limit(1));
        const snap = await getDocs(q);
        const docSnap = snap.docs[0];
        const row = docSnap ? ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as AdminEvent) : null;
        if (!cancelled) setEvent(row);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = useMemo(() => {
    if (lang === 'es') return 'Evento';
    if (lang === 'en') return 'Event';
    return 'Événement';
  }, [lang]);

  if (loading) {
    return <p className="text-sm text-slate-500">{lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…'}</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {lang === 'es'
            ? 'No encontramos este evento.'
            : lang === 'en'
              ? 'We could not find this event.'
              : 'Impossible de trouver cet événement.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">{event.title}</h2>
      <p className="mt-2 text-sm text-stone-600">
        {fmtDateTime(event.startsAt, lang)}
        {event.address ? ` · ${event.address}` : ''}
      </p>

      {event.introText?.trim() ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-stone-700">{event.introText}</p>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          {lang === 'es'
            ? 'Para confirmar o rechazar, inicia sesión.'
            : lang === 'en'
              ? 'To RSVP (present/decline), please sign in.'
              : 'Pour confirmer ou refuser, connectez-vous.'}
        </p>
        <p className="mt-1 text-xs text-blue-800">
          {lang === 'es'
            ? 'La inscripción (o rechazo) también crea/actualiza tu perfil en el directorio.'
            : lang === 'en'
              ? 'RSVP also creates/updates your directory profile.'
              : 'La réponse crée/met à jour votre profil annuaire.'}
        </p>
        <button
          type="button"
          onClick={() => {
            // V1: la page RSVP détaillée + auth viendra ensuite. Pour l'instant, on s'appuie sur le bouton login du header.
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {lang === 'es' ? 'Iniciar sesión' : lang === 'en' ? 'Sign in' : 'Se connecter'}
        </button>
      </div>
    </div>
  );
}

