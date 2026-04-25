import React, { useMemo } from 'react';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import TopActiveMembersTable from '@/components/dashboard/TopActiveMembersTable';
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
    console.error(`[AdminTopActiveMembers] ${this.props.label} crashed:`, error);
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
 * Bloc « Membres les plus actifs » — auparavant sur /admin, désormais sur /admin/internal.
 */
export function AdminTopActiveMembersBlock({
  stats,
  lang,
  t,
}: {
  stats: AdminStats;
  lang: Language;
  t: TFn;
}) {
  const ad = useMemo(() => getAdminDashboardCopy(lang), [lang]);

  if (stats.loading) {
    return (
      <div className="admin-analytics-wide mt-4">
        <p className="admin-card text-sm text-slate-500">{t('loading')}</p>
      </div>
    );
  }
  if (stats.error) {
    return (
      <div className="admin-analytics-wide mt-4">
        <p className="admin-card text-sm" style={{ color: 'rgb(180 83 9)' }}>
          {stats.error}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-analytics-wide mt-4">
      <article className="admin-chart-card admin-chart-card--table" id="admin-section-active-members">
        <p className="admin-chart-card__title">{ad.chartTopActiveTitle}</p>
        <p className="admin-chart-card__subtitle">{ad.chartTopActiveSubtitle}</p>
        <div className="admin-chart-card__body">
          <div className="admin-table-wrap">
            <MiniErrorBoundary label="TopActiveMembersTable" t={t}>
              <TopActiveMembersTable members={stats.profilesForDashboard as any} lang={lang} />
            </MiniErrorBoundary>
          </div>
        </div>
      </article>
    </div>
  );
}
