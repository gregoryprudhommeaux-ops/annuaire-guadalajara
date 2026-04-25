import React, { useMemo } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import ProfileCompletionGauge, { getGaugeColor } from '@/components/dashboard/ProfileCompletionGauge';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { pickLang, formatProfileLastSeen } from '@/lib/uiLocale';
import { getAdminDashboardCopy } from '@/lib/adminDashboardLocale';

type TFn = (key: string, params?: Record<string, string | number>) => string;

function activityInitials(name: string): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

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
    console.error(`[AdminActivityAndCompletion] ${this.props.label} crashed:`, error);
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

export function AdminActivityAndCompletionBlocks({
  lang,
  t,
  stats,
}: {
  lang: Language;
  t: TFn;
  stats: AdminStats;
}) {
  const ad = useMemo(() => getAdminDashboardCopy(lang), [lang]);

  const completionGoalDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d;
  }, []);

  const strictPct = useMemo(() => {
    const n = stats.totalProfiles;
    return n > 0 ? Math.round((stats.completedProfilesStrict / n) * 100) : 0;
  }, [stats.totalProfiles, stats.completedProfilesStrict]);

  const completionAccent = useMemo(() => getGaugeColor(strictPct), [strictPct]);

  const incompleteProfileLinks = useMemo(() => {
    const profiles = (stats.profilesForDashboard ?? []) as Array<{
      id: string;
      nom: string;
      photo?: string;
      secteur?: string;
      description?: string;
    }>;
    const scored = profiles
      .map((p) => {
        const hasPhoto = Boolean(String(p.photo ?? '').trim());
        const hasSector = Boolean(String(p.secteur ?? '').trim());
        const hasDesc = String(p.description ?? '').trim().length >= 30;
        const complete = hasPhoto && hasSector && hasDesc;
        const score = (hasPhoto ? 1 : 0) + (hasSector ? 1 : 0) + (hasDesc ? 1 : 0);
        return { p, complete, score };
      })
      .filter((x) => !x.complete)
      .sort((a, b) => a.score - b.score);
    return scored.slice(0, 12).map((x) => x.p);
  }, [stats.profilesForDashboard]);

  if (stats.loading) {
    return (
      <div className="admin-analytics-grid">
        <p className="admin-card" style={{ gridColumn: '1 / -1' }}>
          {t('loading')}
        </p>
      </div>
    );
  }
  if (stats.error) {
    return (
      <div className="admin-analytics-grid">
        <p className="admin-card" style={{ gridColumn: '1 / -1', color: 'rgb(185 28 28)' }}>
          {stats.error}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-analytics-grid">
      <article
        className="admin-chart-card admin-chart-card--compact admin-chart-card--activity"
        id="admin-section-activity"
      >
        <p className="admin-chart-card__title">
          {pickLang('Activité récente', 'Actividad reciente', 'Recent activity', lang)}
        </p>
        <p className="admin-chart-card__subtitle">
          {pickLang(
            'Dernières connexions (lastSeen) et derniers profils créés.',
            'Últimas conexiones (lastSeen) y últimos perfiles creados.',
            'Latest logins (lastSeen) and newest profiles.',
            lang
          )}
        </p>
        <div className="admin-chart-card__body">
          <div className="admin-activity">
            <section
              className="admin-activity__panel"
              aria-label={pickLang('Connexions', 'Conexiones', 'Logins', lang)}
            >
              <div className="admin-activity__head">
                <LogIn className="admin-activity__head-icon" strokeWidth={2} aria-hidden />
                <span className="admin-activity__head-title">
                  {pickLang('Connexions', 'Conexiones', 'Logins', lang)}
                </span>
              </div>
              <ul className="admin-activity__list">
                {stats.recentLogins.length === 0 ? (
                  <li className="admin-activity__empty">—</li>
                ) : (
                  stats.recentLogins.map((r) => (
                    <li key={r.id}>
                      <Link
                        className="admin-activity__row"
                        to={`/profil/${encodeURIComponent(r.id)}`}
                        title={r.name}
                      >
                        <span className="admin-activity__avatar" aria-hidden>
                          {activityInitials(r.name)}
                        </span>
                        <div className="admin-activity__row-text">
                          <span className="admin-activity__name">{r.name}</span>
                          <time className="admin-activity__time" dateTime={new Date(r.at).toISOString()}>
                            {formatProfileLastSeen(r.at, lang) ?? '—'}
                          </time>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section
              className="admin-activity__panel"
              aria-label={pickLang('Nouveaux profils', 'Nuevos perfiles', 'New profiles', lang)}
            >
              <div className="admin-activity__head">
                <UserPlus className="admin-activity__head-icon" strokeWidth={2} aria-hidden />
                <span className="admin-activity__head-title">
                  {pickLang('Nouveaux profils', 'Nuevos perfiles', 'New profiles', lang)}
                </span>
              </div>
              <ul className="admin-activity__list">
                {stats.recentSignups.length === 0 ? (
                  <li className="admin-activity__empty">—</li>
                ) : (
                  stats.recentSignups.map((r) => (
                    <li key={r.id}>
                      <Link
                        className="admin-activity__row"
                        to={`/profil/${encodeURIComponent(r.id)}`}
                        title={r.name}
                      >
                        <span
                          className="admin-activity__avatar admin-activity__avatar--signup"
                          aria-hidden
                        >
                          {activityInitials(r.name)}
                        </span>
                        <div className="admin-activity__row-text">
                          <span className="admin-activity__name">{r.name}</span>
                          <time className="admin-activity__time" dateTime={new Date(r.at).toISOString()}>
                            {formatProfileLastSeen(r.at, lang) ?? '—'}
                          </time>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      </article>

      <article
        className="admin-chart-card admin-chart-card--compact admin-chart-card--completion"
        id="admin-section-completion"
      >
        <p className="admin-chart-card__title">{ad.chartCompletionTitle}</p>
        <p className="admin-chart-card__subtitle">{ad.chartCompletionSubtitle}</p>
        <div className="admin-chart-card__body admin-completion">
          <div className="admin-completion__head">
            <p className="admin-completion__label">
              {pickLang('Complétion (stricte)', 'Completitud (estricta)', 'Strict completion', lang)}
            </p>
            <div className="admin-completion__kpi">
              <span
                className="admin-completion__kpi-pct tabular-nums"
                style={{ color: completionAccent }}
              >
                {strictPct}%
              </span>
              <span className="admin-completion__kpi-sep" aria-hidden>
                ·
              </span>
              <span className="admin-completion__kpi-frac">
                {stats.completedProfilesStrict}/{stats.totalProfiles}{' '}
                {pickLang('profils complets', 'perfiles completos', 'complete profiles', lang)}
              </span>
            </div>
            <p className="admin-completion__goal">
              {pickLang('Objectif 80% d’ici le', 'Objetivo 80% para el', 'Target 80% by', lang)}{' '}
              {completionGoalDate.toLocaleDateString(
                lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
              .
            </p>
          </div>
          <div className="admin-completion__gauge-wrap">
            <MiniErrorBoundary label="ProfileCompletionGauge" t={t}>
              <ProfileCompletionGauge
                totalMembers={stats.totalProfiles}
                completedProfiles={stats.completedProfilesStrict}
                embedded
                showHeader={false}
                accentColor={completionAccent}
                hideEmbedStatsLine
              />
            </MiniErrorBoundary>
          </div>
          <div className="admin-completion__incomplete-block">
            <p className="admin-completion__incomplete-title">
              {pickLang('Profils à compléter (aperçu)', 'Perfiles incompletos', 'Incomplete profiles', lang)}
            </p>
            <ul className="admin-completion__incomplete-list" role="list">
              {incompleteProfileLinks.length === 0 ? (
                <li className="admin-completion__incomplete-empty">—</li>
              ) : (
                incompleteProfileLinks.map((p) => (
                  <li key={p.id}>
                    <Link
                      className="admin-completion__incomplete-link"
                      to={`/profil/${encodeURIComponent(String(p.id))}`}
                    >
                      <span className="admin-completion__incomplete-name">
                        {formatPersonName(String(p.nom ?? '').trim())}
                      </span>
                      <span className="admin-completion__incomplete-chevron" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
}
