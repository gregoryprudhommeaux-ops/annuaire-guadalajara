import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import type { Language, MemberNetworkRequest, NeedComment, UserProfile } from '@/types';
import { cn } from '@/lib/cn';
import { TimePeriodProvider, useTimePeriod } from '@/contexts/TimePeriodContext';
import { db } from '@/firebase';
import { MEMBER_REQUESTS_COLLECTION, mapMemberRequestDoc } from '@/lib/memberRequests';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import '@/features/admin/admin-dashboard.css';

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

function AdminPeriodPills() {
  const { period, setPeriod, getPeriodLabel } = useTimePeriod();
  const items: Array<{ key: typeof period; label: string }> = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7d', label: '7 jours' },
    { key: '30d', label: '30 jours' },
    { key: '90d', label: '90 jours' },
    { key: 'all', label: 'Tout' },
  ];
  return (
    <div className="admin-toolbar" aria-label="Période">
      {items.map((p) => (
        <button
          key={p.key}
          type="button"
          className={cn('admin-pill', p.key === period && 'is-active')}
          onClick={() => setPeriod(p.key)}
        >
          {p.label}
        </button>
      ))}
      <span className="text-sm text-slate-500">{getPeriodLabel()}</span>
    </div>
  );
}

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
      <div className="admin-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="admin-card__title">Dernières demandes</h2>
            <p className="admin-card__text">
              Dernières {Math.min(12, recentRequests.length)} demandes publiées.
            </p>
          </div>
          <a href="/requests" className="admin-pill" style={{ textDecoration: 'none' }}>
            Ouvrir
          </a>
        </div>
        <div className="admin-list">
          {recentRequests.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune demande.</p>
          ) : (
            recentRequests.map((r) => (
              <a
                key={r.id}
                href="/requests"
                className="admin-list-item"
                style={{ textDecoration: 'none' }}
              >
                <div className="admin-list-item__main">
                  <p className="admin-list-item__title">{r.text}</p>
                  <p className="admin-list-item__meta">
                    {[r.authorName, r.authorCompany, r.zone].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="admin-list-item__count">→</span>
              </a>
            ))
          )}
        </div>
      </div>
    );
  }, [recentRequests]);

  const unansweredNeedsUi = useMemo(() => {
    if (!unansweredNeeds) return null;
    return (
      <div className="admin-card admin-card--featured">
        <p className="admin-card__eyebrow">PRIORITÉ</p>
        <h2 className="admin-card__title">Besoins sans réponse</h2>
        <p className="admin-card__text">
          Profils avec besoins mis en avant et 0 commentaire.
        </p>
        <div className="admin-highlight-number">{unansweredCount}</div>
        <div className="admin-list">
          {unansweredNeeds.length === 0 ? (
            <p className="text-sm text-slate-600">Aucun besoin en attente.</p>
          ) : (
            unansweredNeeds.map((row) => (
              <a
                key={row.uid}
                href={`/profil/${encodeURIComponent(row.uid)}`}
                className="admin-list-item"
                style={{ textDecoration: 'none' }}
              >
                <div className="admin-list-item__main">
                  <p className="admin-list-item__title">{row.name}</p>
                  {row.company ? <p className="admin-list-item__meta">{row.company}</p> : null}
                </div>
                <span className="admin-list-item__count">{row.needsCount}</span>
              </a>
            ))
          )}
        </div>
      </div>
    );
  }, [unansweredNeeds, unansweredCount]);

  return (
    <div className="admin-dashboard-page">
      <div className="admin-shell">
        <TimePeriodProvider defaultPeriod="30d">
          <div className="admin-header">
            <div className="admin-header__copy">
              <h1 className="admin-header__title">Admin</h1>
              <p className="admin-header__text">
                Pilotage du réseau : croissance, qualité des profils, demandes, gaps secteurs/ville et stats d’usage.
              </p>
            </div>
            <AdminPeriodPills />
          </div>

          {loadError ? (
            <p className="admin-card" style={{ borderColor: '#fcd34d', background: '#fffbeb' }}>
              <span className="admin-card__text">{loadError}</span>
            </p>
          ) : null}

          <AdminDashboard
            lang={lang}
            t={t}
            priorityLeft={
              unansweredNeeds ? (
                unansweredNeedsUi
              ) : (
                <div className="admin-card admin-card--featured">
                  <p className="admin-card__eyebrow">PRIORITÉ</p>
                  <h2 className="admin-card__title">Besoins sans réponse</h2>
                  <p className="admin-card__text">{loading}</p>
                </div>
              )
            }
            priorityRight={
              recentRequests ? (
                recentRequestsUi
              ) : (
                <div className="admin-card">
                  <h2 className="admin-card__title">Dernières demandes</h2>
                  <p className="admin-card__text">{loading}</p>
                </div>
              )
            }
          />
        </TimePeriodProvider>
      </div>
    </div>
  );
}

