import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { User } from 'firebase/auth';
import type { Language } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { getMembersExtended } from '@/lib/api';
import type { MemberExtended, MemberNeed } from '@/lib/communityMemberExtended';
import { mockMembersExtended, mockNeeds } from '@/lib/communityMemberExtended';
import NeedsDashboard from '@/components/dashboard/NeedsDashboard';
import {
  computeSectorDistribution,
  computeSizeDistribution,
  computeStatusDistribution,
  computeSeniorityBuckets,
  medianSeniority,
  formatCompanyKind,
  formatMemberStatus,
  formatSeniorityBucket,
  type BarDatum,
} from '@/lib/vueEnsembleCompute';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  registeredWithProfile: boolean;
  onUnlockRadar: () => void;
  user: User | null;
  className?: string;
  /** Besoins structurés (Firestore `member_needs` via le parent, ou mock si absent). */
  communityNeeds?: MemberNeed[];
  /**
   * Si défini : utilise ces membres au lieu d’appeler `getMembersExtended()` en interne.
   * Utile quand le parent charge déjà une fois pour tout le tableau de bord.
   */
  membersExtended?: MemberExtended[];
  /** Afficher `NeedsDashboard` sous les barres (désactiver si vous le rendez à part). */
  includeNeedsDashboard?: boolean;
};

const barTheme = {
  text: { fill: '#57534e', fontSize: 11 },
  grid: { line: { stroke: '#e7e5e4' } },
  axis: {
    ticks: { text: { fill: '#78716c', fontSize: 10 } },
    legend: { text: { fill: '#44403c', fontSize: 11 } },
  },
};

/** Couleurs bien visibles sur fond blanc (indigo / violet / bleu / teal / ambre — pas de blanc ni gris clair). */
const BAR_FILL_COLORS = [
  '#4338ca',
  '#6d28d9',
  '#1d4ed8',
  '#0369a1',
  '#0f766e',
  '#b45309',
  '#be123c',
  '#a21caf',
] as const;

function barRowsForNivo(data: BarDatum[]): { label: string; value: number }[] {
  return data.map((d) => ({ label: d.label, value: d.value }));
}

function characteristicWord(label: string): string {
  const words = label
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return label;
  const candidate = words.find((w) => w.length >= 4);
  return candidate ?? words[0];
}

function toTwoLinesLabel(label: string, maxPerLine = 12): [string, string?] {
  const clean = label.trim();
  if (clean.length <= maxPerLine) return [clean];

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    const first = clean.slice(0, maxPerLine);
    const second = clean.slice(maxPerLine, maxPerLine * 2 - 1);
    return [first, second.length > 0 ? `${second}…` : undefined];
  }

  let line1 = '';
  let idx = 0;
  while (idx < words.length) {
    const next = line1 ? `${line1} ${words[idx]}` : words[idx];
    if (next.length > maxPerLine) break;
    line1 = next;
    idx += 1;
  }
  if (!line1) {
    line1 = words[0].slice(0, maxPerLine);
    idx = 1;
  }

  const remaining = words.slice(idx).join(' ');
  if (!remaining) return [line1];
  if (remaining.length <= maxPerLine) return [line1, remaining];
  return [line1, `${remaining.slice(0, Math.max(1, maxPerLine - 1))}…`];
}

type BarAxisTick = {
  x: number;
  y: number;
  value: string | number;
  opacity?: number;
};

function MiniBarCard({
  title,
  kpiLabel,
  kpiValue,
  data,
}: {
  title: string;
  kpiLabel: string;
  kpiValue: string;
  data: BarDatum[];
}) {
  const rows = barRowsForNivo(data);
  const hasData = rows.length > 0 && rows.some((r) => r.value > 0);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2.5 flex flex-col gap-1.5 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="min-w-0 shrink-0 text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{kpiLabel}</p>
          <p className="text-lg font-semibold leading-tight text-slate-900 sm:text-sm">{kpiValue}</p>
        </div>
      </div>
      {!hasData ? (
        <p className="text-sm text-slate-500">—</p>
      ) : (
        <div className="w-full min-w-0">
          <div className="h-52 sm:hidden">
            <ResponsiveBar
              data={rows}
              keys={['value']}
              indexBy="label"
              margin={{ top: 8, right: 10, bottom: 30, left: 86 }}
              padding={0.35}
              layout="horizontal"
              valueScale={{ type: 'linear', min: 0, max: 1 }}
              colorBy="indexValue"
              colors={[...BAR_FILL_COLORS]}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.65]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 3,
                tickPadding: 4,
                tickValues: [0, 1],
                format: (v) => (Number(v) >= 1 ? '1' : '0'),
                legendOffset: 0,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
                format: (v) => compactLabel(String(v ?? ''), 12),
              }}
              theme={{
                ...barTheme,
                axis: {
                  ...barTheme.axis,
                  ticks: { text: { fill: '#6b7280', fontSize: 9 } },
                },
              }}
              gridXValues={[0, 1]}
              enableLabel={false}
              motionConfig="gentle"
              role="application"
            />
          </div>

          <div className="hidden h-44 sm:block">
            <ResponsiveBar
              theme={barTheme}
              data={rows}
              keys={['value']}
              indexBy="label"
              margin={{ top: 8, right: 8, bottom: 64, left: 30 }}
              padding={0.3}
              layout="vertical"
              valueScale={{ type: 'linear', min: 0, max: 1 }}
              colorBy="indexValue"
              colors={[...BAR_FILL_COLORS]}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.65]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 3,
                tickPadding: 4,
                tickRotation: 0,
                renderTick: (tick: BarAxisTick) => {
                  const raw = String(tick.value ?? '');
                  const compact = raw.length > 28 ? characteristicWord(raw) : raw;
                  const [line1, line2] = toTwoLinesLabel(compact, 10);
                  return (
                    <g transform={`translate(${tick.x},${tick.y})`} opacity={tick.opacity ?? 1}>
                      <title>{raw}</title>
                      <line y2="3" stroke="#9ca3af" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="hanging"
                        style={{ fill: '#6b7280', fontSize: 10, pointerEvents: 'none' }}
                      >
                        <tspan x="0" dy="6">
                          {line1}
                        </tspan>
                        {line2 ? (
                          <tspan x="0" dy="11">
                            {line2}
                          </tspan>
                        ) : null}
                      </text>
                    </g>
                  );
                },
              }}
              axisLeft={{
                tickSize: 3,
                tickPadding: 4,
                tickValues: [0, 1],
                format: (v) => (Number(v) >= 1 ? '1' : '0'),
              }}
              gridYValues={[0, 1]}
              enableLabel={false}
              motionConfig="gentle"
              role="application"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function CommunityDashboard({
  members,
  lang,
  t,
  className,
  needs,
  includeNeedsDashboard,
}: {
  members: MemberExtended[];
  lang: Language;
  t: TFn;
  className?: string;
  needs: MemberNeed[];
  includeNeedsDashboard: boolean;
}) {
  const sectorData = useMemo(() => computeSectorDistribution(members), [members]);
  const sizeData = useMemo(() => {
    return computeSizeDistribution(members).map((d) => ({
      label: formatCompanyKind(d.label as MemberExtended['companySize'], lang),
      value: d.value,
    }));
  }, [members, lang]);
  const statusData = useMemo(() => {
    return computeStatusDistribution(members).map((d) => ({
      label: formatMemberStatus(d.label as MemberExtended['status'], lang),
      value: d.value,
    }));
  }, [members, lang]);
  const seniorityData = useMemo(() => {
    return computeSeniorityBuckets(members).map((d) => ({
      label: formatSeniorityBucket(d.label, lang),
      value: d.value,
    }));
  }, [members, lang]);

  const medianYears = useMemo(() => medianSeniority(members), [members]);
  const yearsUnit = pickLang('ans', 'años', 'years', lang);

  const topSector = [...sectorData].sort((a, b) => b.value - a.value)[0];
  const topSize = [...sizeData].sort((a, b) => b.value - a.value)[0];
  const topStatus = [...statusData].sort((a, b) => b.value - a.value)[0];
  const medianKpi =
    members.length === 0
      ? '—'
      : `${medianYears % 1 === 0 ? String(medianYears) : medianYears.toFixed(1)} ${yearsUnit}`;

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{t('vueTitle')}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{t('vueSubtitle')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MiniBarCard
          title={t('cardMembersBySector')}
          kpiLabel={t('kpiTopSector')}
          kpiValue={topSector ? topSector.label : '—'}
          data={sectorData}
        />
        <MiniBarCard
          title={t('cardMembersBySize')}
          kpiLabel={t('kpiTopSize')}
          kpiValue={topSize ? topSize.label : '—'}
          data={sizeData}
        />
        <MiniBarCard
          title={t('cardMembersBySeniority')}
          kpiLabel={t('kpiGDLMedianYears')}
          kpiValue={medianKpi}
          data={seniorityData}
        />
        <MiniBarCard
          title={t('cardMembersByStatus')}
          kpiLabel={t('kpiTopStatus')}
          kpiValue={topStatus ? topStatus.label : '—'}
          data={statusData}
        />
      </div>

      {includeNeedsDashboard && (
        <NeedsDashboard needs={needs} members={members} lang={lang} t={t} className="mt-2" />
      )}
    </div>
  );
}

/**
 * Vue d’ensemble communauté : cartes barres (Nivo) + KPI ; besoins optionnels (`includeNeedsDashboard`).
 * Données : `getMembers()` + mapping, ou `membersExtended` fourni par le parent (`getMembersExtended()`).
 * Export : `default` et `{ VueEnsemble }`.
 */
function VueEnsembleInner({
  lang,
  t,
  registeredWithProfile,
  onUnlockRadar,
  user,
  className,
  communityNeeds = mockNeeds,
  membersExtended: membersExtendedProp,
  includeNeedsDashboard = true,
}: Props) {
  const [fetchedExtended, setFetchedExtended] = useState<MemberExtended[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const useExternalExtended = membersExtendedProp !== undefined;

  useEffect(() => {
    if (!registeredWithProfile || useExternalExtended) {
      if (!registeredWithProfile) {
        setFetchedExtended(null);
        setError(null);
      }
      return;
    }
    let cancelled = false;
    setError(null);
    getMembersExtended()
      .then((rows) => {
        if (!cancelled) setFetchedExtended(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setFetchedExtended([]);
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [registeredWithProfile, useExternalExtended]);

  const extendedMembers = useMemo(() => {
    if (useExternalExtended) return membersExtendedProp ?? [];
    return fetchedExtended ?? [];
  }, [useExternalExtended, membersExtendedProp, fetchedExtended]);

  const loadingLabel =
    lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…';

  if (registeredWithProfile && !useExternalExtended && fetchedExtended === null && !error) {
    return (
      <div className={className}>
        <p className="text-sm text-stone-500">{loadingLabel}</p>
      </div>
    );
  }

  if (registeredWithProfile && !useExternalExtended && error) {
    return (
      <div className={className}>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      </div>
    );
  }

  if (!registeredWithProfile) {
    return (
      <div className={`relative min-h-[320px] ${className ?? ''}`}>
        <div
          className="pointer-events-none select-none blur-md saturate-50"
          aria-hidden
        >
          <CommunityDashboard
            members={mockMembersExtended}
            lang={lang}
            t={t}
            needs={communityNeeds}
            includeNeedsDashboard={includeNeedsDashboard}
          />
        </div>
        <div
          className="absolute inset-0 z-10 flex items-start justify-center overflow-y-auto bg-stone-100/40 px-4 py-10 backdrop-blur-[2px] sm:items-center sm:py-16"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vue-ensemble-locked-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/95 p-6 text-center shadow-lg">
            <p
              id="vue-ensemble-locked-title"
              className="text-sm font-medium leading-relaxed text-stone-800 sm:text-[15px]"
            >
              {t('radarLockedMessage')}
            </p>
            <button
              type="button"
              onClick={onUnlockRadar}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:w-auto sm:min-w-[200px]"
            >
              {!user ? t('radarLockedCtaGuest') : t('radarLockedCtaProfile')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CommunityDashboard
      members={extendedMembers}
      lang={lang}
      t={t}
      className={className}
      needs={communityNeeds}
      includeNeedsDashboard={includeNeedsDashboard}
    />
  );
}

export default VueEnsembleInner;
export { VueEnsembleInner as VueEnsemble };
