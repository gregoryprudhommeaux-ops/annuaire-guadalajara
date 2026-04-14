import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveRadar } from '@nivo/radar';
import type { Language } from '../../types';
import { pickLang } from '../../lib/uiLocale';
import { useExplorerProfilsI18n } from '../../copy/explorerProfilsI18n';
import {
  computeRadarData,
  type CompanySize,
  type ExplorerMember,
} from '../../lib/explorerProfilsCompute';

export type {
  CompanySize,
  ExplorerMember,
  RadarAxis,
  RadarDatum,
} from '../../lib/explorerProfilsCompute';

const RADAR_SEGMENT_COLOR: Record<'community' | CompanySize, string> = {
  community: '#4f46e5',
  freelance: '#10b981',
  pme: '#f59e0b',
  corporate: '#ef4444',
};

/** Données d’exemple — remplacer par des profils réels (API / Firestore). */
export const mockExplorerMembers: ExplorerMember[] = [
  {
    id: '1',
    name: 'Alice Dupont',
    sector: 'F&B',
    city: 'Guadalajara',
    country: 'Mexique',
    languages: ['fr', 'es'],
    companySize: 'pme',
    exportOrientation: 4,
    eventsAppetite: 5,
    networkingNeeds: 4,
    digitalMaturity: 3,
    teamSizeScore: 3,
    exchangeFrequency: 4,
    tags: ['F&B', 'Networking', 'Afterwork'],
  },
  {
    id: '2',
    name: 'Jean Martin',
    sector: 'Services B2B',
    city: 'Zapopan',
    country: 'Mexique',
    languages: ['fr', 'en'],
    companySize: 'freelance',
    exportOrientation: 3,
    eventsAppetite: 3,
    networkingNeeds: 5,
    digitalMaturity: 4,
    teamSizeScore: 1,
    exchangeFrequency: 5,
    tags: ['Networking'],
  },
  {
    id: '3',
    name: 'Maria Lopez',
    sector: 'Tech',
    city: 'Guadalajara',
    country: 'Mexique',
    languages: ['es', 'en', 'fr'],
    companySize: 'corporate',
    exportOrientation: 5,
    eventsAppetite: 4,
    networkingNeeds: 3,
    digitalMaturity: 5,
    teamSizeScore: 5,
    exchangeFrequency: 3,
    tags: ['Afterwork'],
  },
];

type SegmentKey = 'community' | CompanySize;

type Props = {
  members?: ExplorerMember[];
  className?: string;
  lang?: Language;
  showPageHeader?: boolean;
};

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

/**
 * Radar (un segment à la fois), Venn F&B ∩ Networking, filtres et tableau.
 */
export default function ExplorerProfils({
  members = mockExplorerMembers,
  className,
  lang = 'fr',
  showPageHeader = true,
}: Props) {
  const { t } = useExplorerProfilsI18n(lang);

  const [segment, setSegment] = useState<SegmentKey>('community');
  const [sectorFilter, setSectorFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const filteredMembers = useMemo(
    () =>
      members.filter((m) => {
        const sectorOk = !sectorFilter || m.sector === sectorFilter;
        const cityOk = !cityFilter || m.city === cityFilter;
        const langOk = !languageFilter || m.languages.includes(languageFilter);
        const tagOk = !tagFilter || m.tags.includes(tagFilter);
        return sectorOk && cityOk && langOk && tagOk;
      }),
    [members, sectorFilter, cityFilter, languageFilter, tagFilter]
  );

  useEffect(() => {
    if (segment === 'community') return;
    if (!filteredMembers.some((m) => m.companySize === segment)) {
      setSegment('community');
    }
  }, [filteredMembers, segment]);

  const sectors = useMemo(() => uniqSorted(members.map((m) => m.sector)), [members]);
  const cities = useMemo(() => uniqSorted(members.map((m) => m.city)), [members]);
  const languages = useMemo(
    () => uniqSorted(members.flatMap((m) => m.languages)),
    [members]
  );
  const tags = useMemo(() => uniqSorted(members.flatMap((m) => m.tags)), [members]);

  const radarDatum = useMemo(
    () => computeRadarData(filteredMembers, lang),
    [filteredMembers, lang]
  );

  const radarKeys: SegmentKey[] = [segment];
  const nivoRadarRows = useMemo(() => {
    return radarDatum.map((d) => {
      const row: Record<string, string | number> = { axis: d.label };
      if (segment === 'community') {
        row.community = d.community;
      } else {
        const v = d[segment];
        row[segment] = v ?? 0;
      }
      return row;
    });
  }, [radarDatum, segment]);

  const segmentHasRadarData =
    filteredMembers.length > 0 &&
    (segment === 'community' || filteredMembers.some((m) => m.companySize === segment));

  const serieLabel = (key: SegmentKey) => {
    if (key === 'community') return t('radarSeriesCommunity');
    if (key === 'freelance') return t('sizeFreelance');
    if (key === 'pme') return t('sizePme');
    return t('sizeCorporate');
  };

  const translateSize = (size: CompanySize) => {
    if (size === 'freelance') return t('sizeFreelance');
    if (size === 'pme') return t('sizePme');
    return t('sizeCorporate');
  };

  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      {showPageHeader && (
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
            {t('subtitle')}
          </p>
        </header>
      )}

      <div className="flex flex-col gap-6 sm:gap-8">
        <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-stone-900 sm:text-lg">{t('radarTitle')}</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-500">{t('radarHint')}</p>

          <div className="mt-4 flex flex-col gap-2 sm:mt-5">
            <label htmlFor="explorer-radar-segment" className="text-xs font-medium text-stone-600">
              {t('radarSegmentToggleLabel')}
            </label>
            <select
              id="explorer-radar-segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value as SegmentKey)}
              className="w-full max-w-sm rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="community">{t('radarSeriesCommunity')}</option>
              <option value="freelance">{t('sizeFreelance')}</option>
              <option value="pme">{t('sizePme')}</option>
              <option value="corporate">{t('sizeCorporate')}</option>
            </select>
          </div>

          <div className="relative mt-6 h-[min(420px,70vw)] w-full min-h-[320px] overflow-visible sm:h-[400px] sm:min-h-[360px]">
            {filteredMembers.length === 0 ? (
              <p className="flex h-full items-center justify-center rounded-lg bg-stone-50/50 px-4 text-center text-sm text-stone-500">
                {t('radarEmpty')}
              </p>
            ) : !segmentHasRadarData ? (
              <p className="flex h-full items-center justify-center rounded-lg bg-stone-50/50 px-4 text-center text-sm text-stone-500">
                {t('radarSegmentEmpty')}
              </p>
            ) : (
              <ResponsiveRadar
                theme={{
                  text: { fill: '#44403c', fontSize: 10 },
                  grid: { line: { stroke: '#d6d3d1' } },
                }}
                data={nivoRadarRows}
                keys={radarKeys}
                indexBy="axis"
                maxValue={5}
                valueFormat=">-.2f"
                margin={{ top: 70, right: 88, bottom: 70, left: 88 }}
                curve="linearClosed"
                gridLevels={5}
                gridShape="circular"
                gridLabelOffset={32}
                enableDots
                dotSize={7}
                dotBorderWidth={2}
                dotColor={{ theme: 'background' }}
                dotBorderColor={{ from: 'color' }}
                colors={[RADAR_SEGMENT_COLOR[segment]]}
                fillOpacity={0.32}
                blendMode="multiply"
                borderWidth={2}
                borderColor={{ from: 'color' }}
                motionConfig="gentle"
                isInteractive
                legends={[]}
              />
            )}
          </div>

          {filteredMembers.length > 0 && segmentHasRadarData && (
            <p className="mt-4 flex items-center gap-2 text-xs text-stone-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: RADAR_SEGMENT_COLOR[segment] }}
                aria-hidden
              />
              {serieLabel(segment)}
            </p>
          )}
        </section>

      </div>

      <section className="mt-6 min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:mt-8 sm:p-6">
        <h2 className="text-base font-semibold text-stone-900 sm:text-lg">{t('tableTitle')}</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">{t('filterSector')}</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">{t('filterCity')}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">{t('filterLanguage')}</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">{t('filterNeeds')}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-stone-800">
              <tr>
                <th className="px-3 py-2 font-medium">{t('thName')}</th>
                <th className="px-3 py-2 font-medium">{t('thSector')}</th>
                <th className="px-3 py-2 font-medium">{t('thLocation')}</th>
                <th className="px-3 py-2 font-medium">{t('thLanguages')}</th>
                <th className="px-3 py-2 font-medium">{t('thCompanySize')}</th>
                <th className="px-3 py-2 font-medium">{t('thTags')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-stone-500" colSpan={6}>
                    {t('noResults')}
                  </td>
                </tr>
              )}
              {filteredMembers.map((m) => (
                <tr key={m.id} className="border-b border-stone-100 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2">{m.name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{m.sector}</td>
                  <td className="whitespace-nowrap px-3 py-2">{m.city}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {m.languages.map((l) => l.toUpperCase()).join(', ')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{translateSize(m.companySize)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
