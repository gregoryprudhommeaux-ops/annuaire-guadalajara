import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import { pickLang, formatProfileLastSeen } from '@/lib/uiLocale';
import {
  buildAdminPriorityProfileRows,
  countActiveIncompleteToNudge,
  countIncompleteStrict,
  countNewIncomplete,
  countNoPhoto,
  filterPriorityRows,
  type AdminPriorityFilter,
  type PriorityProfileRow,
} from '@/lib/adminPriorityScoring';

const FILTERS: Array<{ id: AdminPriorityFilter; fr: string; es: string; en: string }> = [
  { id: 'all', fr: 'Tous', es: 'Todos', en: 'All' },
  { id: 'new_incomplete', fr: 'Nouveaux et incomplets', es: 'Nuevos e incompletos', en: 'New & incomplete' },
  { id: 'active_incomplete', fr: 'Actifs mais incomplets', es: 'Activos e incompletos', en: 'Active but incomplete' },
  { id: 'no_photo', fr: 'Sans photo', es: 'Sin foto', en: 'No photo' },
  { id: 'bio_incomplete', fr: 'Bio à compléter', es: 'Bio por completar', en: 'Bio to complete' },
  { id: 'no_sector', fr: 'Secteur manquant', es: 'Sector faltante', en: 'Missing sector' },
];

function tr(
  lang: Language,
  fr: string,
  es: string,
  en: string
) {
  return pickLang(fr, es, en, lang);
}

function Kpi({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}

export function PriorityProfileCompletionTable({
  stats,
  lang,
}: {
  stats: AdminStats;
  lang: Language;
}) {
  const [filter, setFilter] = useState<AdminPriorityFilter>('all');
  const pick = useCallback((f: string, s: string, e: string) => tr(lang, f, s, e), [lang]);

  const allRows = useMemo(
    () => buildAdminPriorityProfileRows(stats, lang, pick),
    [stats, lang, pick]
  );

  const rows = useMemo(() => filterPriorityRows(allRows, filter), [allRows, filter]);

  const kpis = useMemo(() => {
    if (stats.loading) return null;
    return {
      incomplete: countIncompleteStrict(stats),
      newInc: countNewIncomplete(stats, 30),
      noPhoto: countNoPhoto(stats),
      activeNudge: countActiveIncompleteToNudge(stats, 7),
    };
  }, [stats]);

  const copyMessage = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, []);

  if (stats.loading) {
    return (
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">
          {tr(lang, 'Chargement…', 'Cargando…', 'Loading…')}
        </p>
      </section>
    );
  }
  if (stats.error) {
    return (
      <section className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        {stats.error}
      </section>
    );
  }

  return (
    <section className="mb-10" id="admin-priority-completion">
      <header className="mb-4 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#01696f]">
          {tr(lang, 'Relances prioritaires', 'Prioridades de seguimiento', 'Priority follow-ups')}
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
          {tr(lang, 'Profils à pousser en priorité', 'Perfiles a impulsar con prioridad', 'Profiles to prioritize')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {tr(
            lang,
            'Les membres ci-dessous combinent potentiel de visibilité, activité récente et profil encore incomplet.',
            'Los perfiles siguientes combinan visibilidad, actividad reciente e incompletitud.',
            'The members below combine visibility potential, recent activity, and an incomplete profile.'
          )}
        </p>
      </header>

      {kpis ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label={tr(lang, 'Profils à compléter', 'Perfiles por completar', 'Profiles to complete')}
            value={kpis.incomplete}
          />
          <Kpi
            label={tr(lang, 'Nouveaux incomplets (30 j.)', 'Nuevos incompletos (30 d.)', 'New incomplete (30d)')}
            value={kpis.newInc}
          />
          <Kpi
            label={tr(lang, 'Sans photo', 'Sin foto', 'No photo')}
            value={kpis.noPhoto}
          />
          <Kpi
            label={tr(lang, 'Actifs à relancer (7 j.)', 'Activos a contactar (7 d.)', 'Active to nudge (7d)')}
            value={kpis.activeNudge}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              filter === f.id
                ? 'bg-[#01696f] text-white shadow-sm'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {tr(lang, f.fr, f.es, f.en)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/90">
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Membre', 'Miembro', 'Member')}
                </th>
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Entreprise', 'Empresa', 'Company')}
                </th>
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Ville', 'Ciudad', 'City')}
                </th>
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Inscription', 'Alta', 'Signed up')}
                </th>
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Dernière act.', 'Últ. actividad', 'Last activity')}
                </th>
                <th className="px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Complétion', 'Completitud', 'Completion')}
                </th>
                <th className="min-w-[200px] px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Manques', 'Faltas', 'Missing')}
                </th>
                <th className="px-3 py-3 text-right font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Score', 'Puntuación', 'Score')}
                </th>
                <th className="min-w-[200px] px-3 py-3 font-bold text-stone-700 sm:px-4">
                  {tr(lang, 'Action', 'Acción', 'Action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-stone-500">
                    {tr(lang, 'Aucun profil ne correspond à ce filtre.', 'Ningún perfil con este filtro.', 'No profiles match this filter.')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <Row key={row.profile.id} row={row} lang={lang} onCopy={copyMessage} tr={tr} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-extrabold text-stone-900">
          {tr(lang, 'Pourquoi ils remontent', 'Por qué aparecen primero', 'Why they rank high')}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {tr(
            lang,
            "Cette priorisation combine la qualité actuelle du profil, la fraîcheur du membre et son potentiel de contribution au réseau. L'objectif est de concentrer les relances là où elles ont le plus d'impact.",
            'La priorización mezcla calidad del perfil, recencia e impacto potencial en la red, para centrar el seguimiento.',
            'This ranking blends profile quality, recency, and network impact, so you focus follow-ups where they matter most.'
          )}
        </p>
      </div>
    </section>
  );
}

function Row({
  row,
  lang,
  onCopy,
  tr: trFn,
}: {
  row: PriorityProfileRow;
  lang: Language;
  onCopy: (s: string) => void;
  tr: (lang: Language, f: string, s: string, e: string) => string;
}) {
  const p = row.profile;
  const created = p.createdAt?.toDate?.();
  const dateStr = created
    ? created.toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const last = formatProfileLastSeen(p.lastSeen, lang) ?? '—';
  return (
    <tr className="border-b border-stone-100 align-top last:border-0 hover:bg-stone-50/60">
      <td className="px-3 py-3 font-semibold text-stone-900 sm:px-4">{p.nom}</td>
      <td className="max-w-[160px] truncate px-3 py-3 text-stone-700 sm:px-4" title={p.entreprise}>
        {p.entreprise ?? '—'}
      </td>
      <td className="px-3 py-3 text-stone-600 sm:px-4">{p.city ?? '—'}</td>
      <td className="whitespace-nowrap px-3 py-3 text-stone-600 sm:px-4">{dateStr}</td>
      <td className="px-3 py-3 text-stone-600 sm:px-4">{last}</td>
      <td className="px-3 py-3 sm:px-4">
        <span className="inline-flex min-w-[3rem] justify-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold tabular-nums text-stone-800">
          {p.readinessPct}%
        </span>
      </td>
      <td className="px-3 py-3 sm:px-4">
        <ul className="m-0 max-w-[220px] list-disc space-y-0.5 py-0 pl-4 text-xs text-stone-600">
          {row.missingReasons.map((m, i) => (
            <li key={i} className="leading-snug">
              {m}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-snug text-stone-500" title={row.suggestedMessage}>
          {row.suggestedMessage}
        </p>
      </td>
      <td className="px-3 py-3 text-right sm:px-4">
        <span className="text-lg font-extrabold tabular-nums text-[#01696f]">
          {row.priorityCompletionScore}
        </span>
      </td>
      <td className="px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-1.5">
          <Link
            to={`/profil/${encodeURIComponent(p.id)}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {trFn(lang, 'Voir profil', 'Ver perfil', 'View profile')}
          </Link>
          <Link
            to={`/profil/${encodeURIComponent(p.id)}#profile-completion`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#01696f]/20 bg-[#e6f5f5]/50 px-2.5 py-1.5 text-xs font-semibold text-[#0a4f54] hover:bg-[#e6f5f5]"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {trFn(lang, 'Relancer', 'Recordar', 'Nudge')}
          </Link>
          <button
            type="button"
            onClick={() => onCopy(row.suggestedMessage)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {trFn(lang, 'Copier message', 'Copiar mensaje', 'Copy message')}
          </button>
        </div>
      </td>
    </tr>
  );
}
