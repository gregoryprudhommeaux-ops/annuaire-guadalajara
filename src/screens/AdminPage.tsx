import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import type { Language, MemberNetworkRequest, NeedComment, UserProfile } from '@/types';
import { cn } from '@/lib/cn';
import { TimePeriodProvider, useTimePeriod } from '@/contexts/TimePeriodContext';
import { db } from '@/firebase';
import { MEMBER_REQUESTS_COLLECTION, mapMemberRequestDoc } from '@/lib/memberRequests';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import '@/features/admin/admin-dashboard.css';

type TFn = (key: string, params?: Record<string, string | number>) => string;

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

function AdminPeriodPills({ t }: { t: TFn }) {
  const { period, setPeriod, getPeriodLabel } = useTimePeriod();
  const items: Array<{ key: typeof period; labelKey: string }> = [
    { key: 'today', labelKey: 'adminTimePeriodToday' },
    { key: '7d', labelKey: 'adminTimePeriod7d' },
    { key: '30d', labelKey: 'adminTimePeriod30d' },
    { key: '90d', labelKey: 'adminTimePeriod90d' },
    { key: 'all', labelKey: 'adminTimePeriodAll' },
  ];
  return (
    <div className="admin-toolbar" aria-label={t('adminTimeToolbarAria')}>
      <div className="admin-period">
        <div className="admin-period__pills" role="group" aria-label={t('adminTimePeriodGroupAria')}>
          {items.map((p) => (
            <button
              key={p.key}
              type="button"
              className={cn('admin-pill', p.key === period && 'is-active')}
              onClick={() => setPeriod(p.key)}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
        <span className="admin-period__range" aria-label={t('adminTimeSelectedAria')}>
          {getPeriodLabel()}
        </span>
      </div>
    </div>
  );
}

export default function AdminPage({ lang, t }: AdminPageProps) {
  const [recentRequests, setRecentRequests] = useState<MemberNetworkRequest[] | null>(null);
  const [unansweredNeeds, setUnansweredNeeds] = useState<UnansweredNeedRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE = 5;
  const [needsPage, setNeedsPage] = useState(0);
  const [requestsPage, setRequestsPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadError(null);
        setRecentRequests(null);
        setUnansweredNeeds(null);
        setNeedsPage(0);
        setRequestsPage(0);

        const requestsSnap = await getDocs(
          query(
            collection(db, MEMBER_REQUESTS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(12)
          )
        );
        const reqs = requestsSnap.docs.map((d) => mapMemberRequestDoc(d.id, d.data() as any));

        const usersSnap = await getDocs(collection(db, 'users'));
        const withNeeds = usersSnap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as Record<string, unknown>) }))
          .map((row) => row as unknown as UserProfile)
          .filter((p) => Array.isArray(p.highlightedNeeds) && p.highlightedNeeds.filter(Boolean).length > 0);

        const uids = withNeeds.map((p) => p.uid).filter(Boolean);
        const unanswered: UnansweredNeedRow[] = [];

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
              .slice(0, 50)
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

  const loading = t('loading');

  const unansweredCount = unansweredNeeds?.length ?? 0;

  const recentRequestsUi = useMemo(() => {
    if (!recentRequests) return null;
    const maxPage = Math.max(0, Math.ceil(recentRequests.length / PAGE_SIZE) - 1);
    const page = Math.min(requestsPage, maxPage);
    const start = page * PAGE_SIZE;
    const pageRows = recentRequests.slice(start, start + PAGE_SIZE);
    const count = Math.min(12, recentRequests.length);
    return (
      <article className="admin-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="admin-card__title">{t('adminRecentRequestsTitle')}</h2>
            <p className="admin-card__text">{t('adminRecentRequestsLead', { count })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-pill"
              onClick={() => setRequestsPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
              aria-label={t('adminRequestsPrev')}
              title={t('adminRequestsPrev')}
              style={{ minHeight: 32, padding: '0 10px', opacity: page <= 0 ? 0.5 : 1 }}
            >
              ←
            </button>
            <button
              type="button"
              className="admin-pill"
              onClick={() => setRequestsPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              aria-label={t('adminRequestsNext')}
              title={t('adminRequestsNext')}
              style={{ minHeight: 32, padding: '0 10px', opacity: page >= maxPage ? 0.5 : 1 }}
            >
              →
            </button>
            <a href="/requests" className="admin-pill" style={{ textDecoration: 'none', minHeight: 32 }}>
              {t('adminOpen')}
            </a>
          </div>
        </div>
        <div className="admin-card__body">
          <div className="admin-list">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-slate-600">{t('adminNoRequests')}</p>
            ) : (
              pageRows.map((r) => (
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
      </article>
    );
  }, [PAGE_SIZE, recentRequests, requestsPage, t]);

  const unansweredNeedsUi = useMemo(() => {
    if (!unansweredNeeds) return null;
    const maxPage = Math.max(0, Math.ceil(unansweredNeeds.length / PAGE_SIZE) - 1);
    const page = Math.min(needsPage, maxPage);
    const start = page * PAGE_SIZE;
    const pageRows = unansweredNeeds.slice(start, start + PAGE_SIZE);
    return (
      <article className="admin-card admin-card--featured">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="admin-card__eyebrow">{t('adminPriorityEyebrow')}</p>
            <h2 className="admin-card__title">{t('adminUnansweredNeedsTitle')}</h2>
            <p className="admin-card__text">{t('adminUnansweredNeedsLead')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-pill"
              onClick={() => setNeedsPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
              aria-label={t('adminNeedsPrev')}
              title={t('adminNeedsPrev')}
              style={{ minHeight: 32, padding: '0 10px', opacity: page <= 0 ? 0.5 : 1 }}
            >
              ←
            </button>
            <button
              type="button"
              className="admin-pill"
              onClick={() => setNeedsPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              aria-label={t('adminNeedsNext')}
              title={t('adminNeedsNext')}
              style={{ minHeight: 32, padding: '0 10px', opacity: page >= maxPage ? 0.5 : 1 }}
            >
              →
            </button>
          </div>
        </div>
        <div className="admin-card__body">
          <div className="admin-highlight-number">{unansweredCount}</div>
          <div className="admin-list">
            {unansweredNeeds.length === 0 ? (
              <p className="text-sm text-slate-600">{t('adminNoUnansweredNeeds')}</p>
            ) : (
              pageRows.map((row) => (
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
      </article>
    );
  }, [PAGE_SIZE, needsPage, unansweredNeeds, unansweredCount, t]);

  return (
    <div className="admin-dashboard-page">
      <div className="admin-shell">
        <TimePeriodProvider defaultPeriod="30d" uiLang={lang}>
          <div className="admin-header">
            <div className="admin-header__copy">
              <h1 className="admin-header__title">{t('adminPanel')}</h1>
              <p className="admin-header__text">{t('adminPageLead')}</p>
            </div>
            <AdminPeriodPills t={t} />
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
                <article className="admin-card admin-card--featured">
                  <p className="admin-card__eyebrow">{t('adminPriorityEyebrow')}</p>
                  <h2 className="admin-card__title">{t('adminUnansweredNeedsTitle')}</h2>
                  <div className="admin-card__body">
                    <p className="admin-card__text">{loading}</p>
                  </div>
                </article>
              )
            }
            priorityRight={
              recentRequests ? (
                recentRequestsUi
              ) : (
                <article className="admin-card">
                  <h2 className="admin-card__title">{t('adminRecentRequestsTitle')}</h2>
                  <div className="admin-card__body">
                    <p className="admin-card__text">{loading}</p>
                  </div>
                </article>
              )
            }
          />
        </TimePeriodProvider>
      </div>
    </div>
  );
}
