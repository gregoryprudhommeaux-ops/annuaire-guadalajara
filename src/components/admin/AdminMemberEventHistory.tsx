import React, { useEffect, useMemo, useState } from 'react';
import { Timestamp, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import type { AdminEvent, AdminEventParticipation, EventParticipationStatus, Language } from '@/types';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  uid: string;
  email?: string | null;
};

function uiLabel(lang: Language, fr: string, es: string, en: string) {
  return lang === 'en' ? en : lang === 'es' ? es : fr;
}

function fmtDate(ts?: Timestamp | null, lang?: Language) {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

function statusPill(status: EventParticipationStatus) {
  if (status === 'present') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'declined') return 'bg-rose-50 text-rose-800 border-rose-200';
  return 'bg-stone-50 text-stone-700 border-stone-200';
}

function mapDoc<T extends Record<string, unknown>>(id: string, data: T): T & { id: string } {
  return { id, ...data };
}

export default function AdminMemberEventHistory({ lang, t, uid, email }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [rows, setRows] = useState<AdminEventParticipation[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!uid) return;
      setLoading(true);
      setError(null);
      try {
        const [eventsSnap, byUidSnap, byEmailSnap] = await Promise.all([
          getDocs(query(collection(db, 'events'), orderBy('startsAt', 'desc'))),
          getDocs(query(collection(db, 'event_participations'), where('uid', '==', uid), orderBy('updatedAt', 'desc'))),
          email
            ? getDocs(query(collection(db, 'event_participations'), where('email', '==', String(email).trim().toLowerCase()), orderBy('updatedAt', 'desc')))
            : Promise.resolve({ docs: [] } as unknown as { docs: Array<{ id: string; data: () => unknown }> }),
        ]);

        const evs = eventsSnap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as AdminEvent[];
        const a = byUidSnap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as AdminEventParticipation[];
        const b = byEmailSnap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>)) as unknown as AdminEventParticipation[];

        const merged = [...a, ...b];
        const uniq = new Map<string, AdminEventParticipation>();
        merged.forEach((p) => uniq.set(p.id, p));
        const out = Array.from(uniq.values()).sort((x, y) => {
          const ax = x.updatedAt?.toMillis?.() ?? 0;
          const ay = y.updatedAt?.toMillis?.() ?? 0;
          return ay - ax;
        });

        if (!cancelled) {
          setEvents(evs);
          setRows(out);
        }
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
  }, [uid, email]);

  const eventById = useMemo(() => {
    const m = new Map<string, AdminEvent>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const stats = useMemo(() => {
    const invited = rows.filter((r) => r.status === 'invited').length;
    const present = rows.filter((r) => r.status === 'present').length;
    const declined = rows.filter((r) => r.status === 'declined').length;
    return { invited, present, declined, total: rows.length };
  }, [rows]);

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {uiLabel(lang, 'Événements & interactions (admin)', 'Eventos e interacciones (admin)', 'Events & interactions (admin)')}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {uiLabel(
              lang,
              'Visible uniquement par les admins.',
              'Visible solo para admins.',
              'Visible to admins only.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
            {uiLabel(lang, 'Présents', 'Presentes', 'Present')}: {stats.present}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
            {uiLabel(lang, 'Refusés', 'Rechazados', 'Declined')}: {stats.declined}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
            {uiLabel(lang, 'Invités', 'Invitados', 'Invited')}: {stats.invited}
          </span>
        </div>
      </div>

      {loading ? <p className="mt-3 text-sm text-stone-500">{uiLabel(lang, 'Chargement…', 'Cargando…', 'Loading…')}</p> : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}</p>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">
          {uiLabel(lang, 'Aucun événement enregistré pour ce membre.', 'No hay eventos registrados para este miembro.', 'No events recorded for this member.')}
        </p>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          {rows.map((r) => {
            const ev = eventById.get(r.eventId);
            const title = ev?.title || r.eventId;
            const date = ev?.startsAt ? fmtDate(ev.startsAt, lang) : '';
            return (
              <div key={r.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {title}
                      {date ? <span className="text-sm font-medium text-stone-500"> · {date}</span> : null}
                    </p>
                    {r.adminNote?.trim() ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-stone-700">
                        <span className="font-semibold">{uiLabel(lang, 'Note:', 'Nota:', 'Note:')}</span> {r.adminNote}
                      </p>
                    ) : null}
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusPill(r.status)}`}>
                    {r.status === 'invited'
                      ? uiLabel(lang, 'Invité', 'Invitado', 'Invited')
                      : r.status === 'present'
                        ? uiLabel(lang, 'Présent', 'Presente', 'Present')
                        : uiLabel(lang, 'Refusé', 'Rechazado', 'Declined')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

