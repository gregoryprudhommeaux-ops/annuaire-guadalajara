import React, { useMemo } from 'react';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import { sanitizePassionIds } from '@/lib/passionConfig';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { getAdminDashboardCopy } from '@/lib/adminDashboardLocale';

type TFn = (key: string, params?: Record<string, string | number>) => string;

class MiniErrorBoundary extends React.Component<
  { children: React.ReactNode; label: string; t: TFn },
  { hasError: boolean; msg: string }
> {
  declare props: { children: React.ReactNode; label: string; t: TFn };
  declare setState: React.Component<
    { children: React.ReactNode; label: string; t: TFn },
    { hasError: boolean; msg: string }
  >['setState'];
  state: { hasError: boolean; msg: string } = { hasError: false, msg: '' };
  static getDerivedStateFromError() {
    return { hasError: true, msg: '' };
  }
  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[AdminConnectPriority] ${this.props.label} crashed:`, error);
    this.setState({ msg });
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <p className="font-semibold">{this.props.t('adminWidgetError', { label: this.props.label })}</p>
        {this.state.msg ? <p className="mt-1 text-xs text-rose-800">{this.state.msg}</p> : null}
      </div>
    );
  }
}

/**
 * Bloc « Membres à connecter en priorité » (recoupements de passions) — sur `/admin/internal` uniquement.
 */
export function AdminConnectPriorityBlock({
  stats,
  lang,
  t,
}: {
  stats: AdminStats;
  lang: Language;
  t: TFn;
}) {
  const ad = useMemo(() => getAdminDashboardCopy(lang), [lang]);

  const memberScores = useMemo(() => {
    const profiles = (stats.profilesForDashboard ?? []) as Array<{
      id: string;
      nom?: string;
      entreprise?: string;
      secteur?: string;
      city?: string;
      passionIds?: string[];
    }>;
    const passionToMembers = new Map<string, Set<string>>();
    const memberToPassions = new Map<string, string[]>();

    for (const p of profiles) {
      const id = String(p.id);
      const passions = sanitizePassionIds(p.passionIds);
      memberToPassions.set(id, passions);
      for (const pid of passions) {
        if (!passionToMembers.has(pid)) passionToMembers.set(pid, new Set());
        passionToMembers.get(pid)!.add(id);
      }
    }

    return profiles
      .map((p) => {
        const id = String(p.id);
        const passions = memberToPassions.get(id) ?? [];
        const overlap = new Set<string>();
        passions.forEach((pid) => {
          passionToMembers.get(pid)?.forEach((otherId) => {
            if (otherId !== id) overlap.add(otherId);
          });
        });
        return { id, nom: p.nom, entreprise: p.entreprise, secteur: p.secteur, city: p.city, score: overlap.size };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [stats.profilesForDashboard]);

  if (stats.loading) {
    return (
      <div className="mt-4">
        <p className="admin-card text-sm text-slate-500">{t('loading')}</p>
      </div>
    );
  }
  if (stats.error) {
    return (
      <div className="mt-4">
        <p className="admin-card text-sm" style={{ color: 'rgb(180 83 9)' }}>
          {stats.error}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <article className="admin-chart-card admin-chart-card--compact" id="admin-section-connect">
        <p className="admin-chart-card__title">{ad.connectPriorityTitle}</p>
        <p className="admin-chart-card__subtitle">{ad.connectPrioritySubtitle}</p>
        <div className="admin-chart-card__body">
          <MiniErrorBoundary label="connect-priority" t={t}>
            {memberScores.length === 0 ? (
              <p className="admin-decision-empty">{ad.connectPriorityEmpty}</p>
            ) : (
              <ul className="admin-opportunity-member-list">
                {memberScores.map((m) => (
                  <li key={m.id} className="admin-opportunity-member-list__row">
                    <div className="admin-opportunity-member-list__text">
                      <p className="admin-opportunity-member-list__name">
                        {formatPersonName(String(m.nom ?? '').trim())}
                      </p>
                      {(m.entreprise || m.city) && (
                        <p className="admin-opportunity-member-list__meta">
                          {[String(m.entreprise ?? '').trim(), String(m.city ?? '').trim()].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className="admin-opportunity-member-list__score tabular-nums" title={ad.overlapScoreTitle}>
                      {m.score}
                      <span className="admin-opportunity-member-list__score-label">{ad.overlapScoreSuffix}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </MiniErrorBoundary>
        </div>
      </article>
    </div>
  );
}
