import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveRadar } from '@nivo/radar';
import { VennDiagram } from 'react-venn-diagram';
import type { Language } from '../../types';
import { useExplorerProfilsI18n } from '../../copy/explorerProfilsI18n';
import {
  computeRadarData,
  computeVennData,
  type CompanySize,
  type ExplorerMember,
} from '../../lib/explorerProfilsCompute';

export type {
  CompanySize,
  ExplorerMember,
  RadarAxis,
  RadarDatum,
  VennCommunityResult,
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

  const vennCommunity = useMemo(() => computeVennData(filteredMembers), [filteredMembers]);

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

  const showVenn =
    filteredMembers.length > 0 &&
    (vennCommunity.a > 0 || vennCommunity.b > 0 || vennCommunity.intersection > 0);

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
    <div className={className}>
      {showPageHeader && (
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {t('subtitle')}
          </p>
        </header>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">{t('radarTitle')}</h2>
              <p className="mt-1 text-sm text-stone-500">{t('radarHint')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <label htmlFor="explorer-radar-segment" className="text-xs text-stone-500">
                {t('radarSegmentToggleLabel')}:
              </label>
              <select
                id="explorer-radar-segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value as SegmentKey)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="community">{t('radarSeriesCommunity')}</option>
                <option value="freelance">{t('sizeFreelance')}</option>
                <option value="pme">{t('sizePme')}</option>
                <option value="corporate">{t('sizeCorporate')}</option>
              </select>
            </div>
          </div>

          <div className="mt-4 h-[340px] w-full min-h-[300px]">
            {filteredMembers.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-stone-400">
                {t('radarEmpty')}
              </p>
            ) : !segmentHasRadarData ? (
              <p className="flex h-full items-center justify-center px-4 text-center text-sm text-stone-400">
                {t('radarSegmentEmpty')}
              </p>
            ) : (
              <ResponsiveRadar
                theme={{
                  text: { fill: '#57534e', fontSize: 11 },
                  grid: { line: { stroke: '#e7e5e4' } },
                }}
                data={nivoRadarRows}
                keys={radarKeys}
                indexBy="axis"
                maxValue={5}
                valueFormat=">-.2f"
                margin={{ top: 48, right: 56, bottom: 48, left: 56 }}
                curve="linearClosed"
                gridLevels={5}
                gridShape="circular"
                gridLabelOffset={36}
                enableDots
                dotSize={8}
                dotBorderWidth={2}
                dotColor={{ theme: 'background' }}
                dotBorderColor={{ from: 'color' }}
                colors={[RADAR_SEGMENT_COLOR[segment]]}
                fillOpacity={0.35}
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
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-600">
              <li className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: RADAR_SEGMENT_COLOR[segment] }}
                  aria-hidden
                />
                {serieLabel(segment)}
              </li>
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-stone-900">{t('vennTitle')}</h2>
          <p className="mt-1 text-sm text-stone-500">{t('vennHint')}</p>

          <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-center">
            <div className="flex flex-1 justify-center overflow-x-auto">
              {showVenn ? (
                <VennDiagram
                  width={280}
                  height={260}
                  data={{
                    a: vennCommunity.a,
                    b: vennCommunity.b,
                    intersection: vennCommunity.intersection,
                  }}
                  labels={{
                    labelA: t('vennLegendFB'),
                    labelB: t('vennLegendNetworking'),
                    labelIntersection: '\u00a0',
                  }}
                  colors={{
                    colorA: '#6366f1',
                    colorB: '#10b981',
                    fontColorA: '#1c1917',
                    fontColorB: '#1c1917',
                    fontColorIntersection: '#1c1917',
                  }}
                />
              ) : (
                <p className="py-12 text-sm text-stone-400">{t('vennNoTags')}</p>
              )}
            </div>

            {filteredMembers.length > 0 && (
              <div className="flex-1 space-y-2 text-sm text-stone-700 xl:min-w-[220px]">
                <p>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-indigo-400" aria-hidden />
                  {t('vennLegendFB')}: <strong className="tabular-nums">{vennCommunity.a}</strong>
                </p>
                <p>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
                  {t('vennLegendNetworking')}:{' '}
                  <strong className="tabular-nums">{vennCommunity.b}</strong>
                </p>
                <p>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full bg-cyan-500" aria-hidden />
                  {t('vennLegendAfterwork')}:{' '}
                  <strong className="tabular-nums">{vennCommunity.extras.totalAfterwork}</strong>
                </p>
                <div className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-600 sm:text-sm">
                  <p>
                    {t('vennStatFbAfter')}:{' '}
                    <strong className="tabular-nums">{vennCommunity.extras.fbAndAfterwork}</strong>
                  </p>
                  <p>
                    {t('vennStatNetAfter')}:{' '}
                    <strong className="tabular-nums">{vennCommunity.extras.networkingAndAfterwork}</strong>
                  </p>
                  <p>
                    {t('vennStatTriple')}:{' '}
                    <strong className="tabular-nums">{vennCommunity.extras.allThree}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-stone-900">{t('tableTitle')}</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
