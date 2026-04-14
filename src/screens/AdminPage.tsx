import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import type { Language, MemberNetworkRequest, NeedComment, UserProfile } from '@/types';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { db } from '@/firebase';
import { MEMBER_REQUESTS_COLLECTION, mapMemberRequestDoc } from '@/lib/memberRequests';

type TFn = (key: string) => string;

export type AdminPageProps = {
  lang: Language;
  t: TFn;
};

type UnansweredNeedRow = {
  uid: string;
  name: string;
  company?: string;
  needsCount: number;
};

export default function AdminPage({ lang, t }: AdminPageProps) {
  const [recentRequests, setRecentRequests] = useState<MemberNetworkRequest[] | null>(null);
  const [unansweredNeeds, setUnansweredNeeds] = useState<UnansweredNeedRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadError(null);
        setRecentRequests(null);
        setUnansweredNeeds(null);

        const requestsSnap = await getDocs(
          query(
            collection(db, MEMBER_REQUESTS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(12)
          )
        );
        const reqs = requestsSnap.docs.map((d) => mapMemberRequestDoc(d.id, d.data() as any));

        // "Besoins" = profils avec `highlightedNeeds` (0–3). "Sans réponse" = 0 commentaire dans `need_comments`.
        const usersSnap = await getDocs(collection(db, 'users'));
        const withNeeds = usersSnap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as Record<string, unknown>) }))
          .map((row) => row as unknown as UserProfile)
          .filter((p) => Array.isArray(p.highlightedNeeds) && p.highlightedNeeds.filter(Boolean).length > 0);

        const uids = withNeeds.map((p) => p.uid).filter(Boolean);
        const unanswered: UnansweredNeedRow[] = [];

        // Firestore "in" is limited to 30 values; chunk to keep it safe.
        const chunkSize = 30;
        const commentedNeedIds = new Set<string>();
        for (let i = 0; i < uids.length; i += chunkSize) {
          const chunk = uids.slice(i, i + chunkSize);
          const commentsSnap = await getDocs(
            query(
              collection(db, 'need_comments'),
              where('needId', 'in', chunk),
              limit(500)
            )
          );
          commentsSnap.docs.forEach((d) => {
            const data = d.data() as NeedComment;
            if (data?.needId) commentedNeedIds.add(String(data.needId));
          });
        }

        for (const p of withNeeds) {
          if (!commentedNeedIds.has(p.uid)) {
            const needsCount = (p.highlightedNeeds ?? []).filter(Boolean).length;
            unanswered.push({
              uid: p.uid,
              name: (p.fullName || p.email || p.uid || '').toString(),
              company: p.companyName || undefined,
              needsCount,
            });
          }
        }

        if (!cancelled) {
          setRecentRequests(reqs);
          setUnansweredNeeds(
            unanswered
              .sort((a, b) => b.needsCount - a.needsCount)
              .slice(0, 20)
          );
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setRecentRequests([]);
          setUnansweredNeeds([]);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading =
    lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…';

  const unansweredCount = unansweredNeeds?.length ?? 0;

  const recentRequestsUi = useMemo(() => {
    if (!recentRequests) return null;
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-900">Demandes publiées récemment</h2>
            <p className="mt-1 text-xs text-stone-500">Dernières {Math.min(12, recentRequests.length)} demandes.</p>
          </div>
          <a
            href="/requests"
            className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Ouvrir
          </a>
        </div>
        <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          {recentRequests.length === 0 ? (
            <p className="px-4 py-4 text-sm text-stone-600">Aucune demande.</p>
          ) : (
            recentRequests.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <p className="text-sm font-semibold text-stone-900 line-clamp-2">{r.text}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {r.authorName}
                  {r.authorCompany ? ` · ${r.authorCompany}` : ''}
                  {r.zone ? ` · ${r.zone}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }, [recentRequests]);

  const unansweredNeedsUi = useMemo(() => {
    if (!unansweredNeeds) return null;
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-900">Besoins sans réponse</h2>
            <p className="mt-1 text-xs text-stone-500">
              {unansweredCount} profil(s) avec besoins mis en avant et 0 commentaire.
            </p>
          </div>
        </div>
        <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          {unansweredNeeds.length === 0 ? (
            <p className="px-4 py-4 text-sm text-stone-600">Aucun besoin en attente.</p>
          ) : (
            unansweredNeeds.map((row) => (
              <div key={row.uid} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{row.name}</p>
                  {row.company ? <p className="truncate text-xs text-stone-500">{row.company}</p> : null}
                </div>
                <div className="shrink-0 text-xs font-semibold text-stone-700">{row.needsCount}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }, [unansweredNeeds, unansweredCount]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Admin</h1>
        <p className="text-sm text-stone-600">
          Pilotage du réseau (croissance, qualité des profils, demandes, gaps secteurs/ville, export/modération).
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {recentRequests ? recentRequestsUi : (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
            {loading}
          </div>
        )}
        {unansweredNeeds ? unansweredNeedsUi : (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
            {loading}
          </div>
        )}
      </div>

      {/* Dashboard admin existant (profils: créés/validés/incomplets, secteurs, villes, complétion, export, validation). */}
      <AdminDashboard lang={lang} t={t} />
    </div>
  );
}

