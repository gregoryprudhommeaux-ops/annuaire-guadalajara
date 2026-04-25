import { useMemo } from 'react';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import type { CrossPick } from '@/components/dashboard/PassionsCrossHeatmap';

export type AdminRecommendedPayload =
  | { type: 'scroll'; id: string }
  | { type: 'route'; to: string }
  | { type: 'affinity'; cross: CrossPick };

export type AdminRecommendedItem = {
  key: string;
  priority: number;
  title: string;
  signal: string;
  context: string;
  ctaLabel: string;
  ctaEmphasis?: boolean;
  payload: AdminRecommendedPayload;
};

function clipAdminRecText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function missingFieldRecTitle(field: string, lang: Language): string {
  switch (field) {
    case 'Photo':
      return pickLang('Photo manquante', 'Foto faltante', 'Missing photo', lang);
    case 'Description':
      return pickLang('Bio courte', 'Bio corta', 'Short bio', lang);
    case 'Secteur':
      return pickLang('Secteur manquant', 'Sector faltante', 'Missing sector', lang);
    case 'Société':
      return pickLang('Société manquante', 'Empresa faltante', 'Missing company', lang);
    case 'Ville':
      return pickLang('Ville manquante', 'Ciudad faltante', 'Missing city', lang);
    default:
      return pickLang(`${field} manquant`, `${field} faltante`, `${field} missing`, lang);
  }
}

/**
 * Suggestions d’action admin (P1 / P2) — même logique que l’ancien encart sur `/admin` (désormais sur `/admin/internal`).
 */
export function useAdminRecommendations(stats: AdminStats, lang: Language) {
  const affinityRows = useMemo(() => {
    const loc = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const map = new Map<
      string,
      { passionId: string; sector: string; count: number; memberIds: Set<string> }
    >();
    for (const m of stats.profilesForDashboard ?? []) {
      const sector = String(m.secteur ?? '').trim() || '—';
      const passionIds = sanitizePassionIds((m as { passionIds?: string[] }).passionIds);
      if (!sector || passionIds.length === 0) continue;
      for (const pid of passionIds) {
        const key = `${pid}||${sector}`;
        const entry = map.get(key) ?? { passionId: pid, sector, count: 0, memberIds: new Set<string>() };
        entry.count += 1;
        entry.memberIds.add(String(m.id));
        map.set(key, entry);
      }
    }
    return Array.from(map.values())
      .map((r) => {
        const passionLabel = `${getPassionEmoji(r.passionId)} ${getPassionLabel(r.passionId, loc)}`;
        const members = r.memberIds.size;
        return { ...r, members, passionLabel };
      })
      .sort((a, b) => b.members - a.members || b.count - a.count);
  }, [stats.profilesForDashboard, lang]);

  const affinityTop3 = useMemo(() => affinityRows.slice(0, 3), [affinityRows]);

  const missingFieldRows = useMemo(() => {
    const profiles = stats.profilesForDashboard ?? [];
    const counts = {
      photo: 0,
      description: 0,
      sector: 0,
      company: 0,
      city: 0,
    };
    for (const p of profiles as Array<Record<string, unknown>>) {
      if (!String(p.photo ?? '').trim()) counts.photo += 1;
      if (String(p.description ?? '').trim().length < 30) counts.description += 1;
      if (!String(p.secteur ?? '').trim()) counts.sector += 1;
      if (!String(p.entreprise ?? '').trim()) counts.company += 1;
      if (!String(p.city ?? '').trim()) counts.city += 1;
    }
    const rows = [
      { field: 'Photo', missing: counts.photo },
      { field: 'Description', missing: counts.description },
      { field: 'Secteur', missing: counts.sector },
      { field: 'Société', missing: counts.company },
      { field: 'Ville', missing: counts.city },
    ].sort((a, b) => b.missing - a.missing);
    return rows;
  }, [stats.profilesForDashboard]);

  const attentionRec = useMemo(() => {
    const profiles = (stats.profilesForDashboard ?? []) as Array<{
      id: string;
      nom?: string;
      contactClicks?: number;
    }>;
    const viewsMap = stats.profileViewsByUid ?? {};
    const viewedNotContacted: typeof profiles = [];
    const lowVisibility: typeof profiles = [];
    for (const p of profiles) {
      const id = String(p.id);
      const v = viewsMap[id] ?? 0;
      const c = p.contactClicks ?? 0;
      if (c >= 1) continue;
      if (v >= 1) viewedNotContacted.push(p);
      else lowVisibility.push(p);
    }
    const byScore = (a: (typeof profiles)[0], b: (typeof profiles)[0]) => {
      const va = viewsMap[String(a.id)] ?? 0;
      const vb = viewsMap[String(b.id)] ?? 0;
      return vb - va;
    };
    viewedNotContacted.sort(byScore);
    return {
      highAttentionLowContactCount: viewedNotContacted.length,
      highAttentionLowContactSample: viewedNotContacted[0] ?? null,
      lowVisibilityCount: lowVisibility.length,
    };
  }, [stats.profilesForDashboard, stats.profileViewsByUid]);

  const coverageGapMatrixRows = useMemo(() => {
    const sectors = Object.entries(stats.profilesBySector ?? {}).map(([label, value]) => ({
      label,
      kind: 'sector' as const,
      value,
    }));
    const cities = Object.entries(stats.profilesByCity ?? {}).map(([label, value]) => ({
      label,
      kind: 'city' as const,
      value,
    }));
    return [...sectors, ...cities]
      .filter((r) => r.value <= 2)
      .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label))
      .slice(0, 10);
  }, [stats.profilesBySector, stats.profilesByCity]);

  const relationshipPotential = useMemo(() => {
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
    const passionToSectors = new Map<string, Set<string>>();

    for (const p of profiles) {
      const id = String(p.id);
      const sector = String(p.secteur ?? '').trim() || '—';
      const passions = sanitizePassionIds(p.passionIds);
      memberToPassions.set(id, passions);
      for (const pid of passions) {
        if (!passionToMembers.has(pid)) passionToMembers.set(pid, new Set());
        passionToMembers.get(pid)!.add(id);
        if (!passionToSectors.has(pid)) passionToSectors.set(pid, new Set());
        passionToSectors.get(pid)!.add(sector);
      }
    }

    const memberScores = profiles
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

    const loc = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const topOverlapPassions = Array.from(passionToSectors.entries())
      .map(([pid, sectors]) => ({
        pid,
        sectorCount: sectors.size,
        memberCount: passionToMembers.get(pid)?.size ?? 0,
        label: `${getPassionEmoji(pid)} ${getPassionLabel(pid, loc)}`,
      }))
      .sort((a, b) => b.sectorCount - a.sectorCount || b.memberCount - a.memberCount)
      .slice(0, 5);

    return { memberScores, topOverlapPassions };
  }, [stats.profilesForDashboard, lang]);

  return useMemo(() => {
    const out: AdminRecommendedItem[] = [];
    const total = stats.totalProfiles;
    const none = {
      primaryRecommended: [] as AdminRecommendedItem[],
      secondaryRecommended: [] as AdminRecommendedItem[],
    };
    if (total <= 0) return none;

    if (stats.pendingReviewProfiles > 0) {
      const n = stats.pendingReviewProfiles;
      out.push({
        key: 'pending-review',
        priority: 12,
        title: pickLang('Validation en attente', 'Validaciones pendientes', 'Pending validation', lang),
        signal: pickLang(`${n} fiche${n > 1 ? 's' : ''}`, `${n} ficha(s)`, `${n} profile(s)`, lang),
        context: pickLang('Revue admin requise.', 'Requiere revisión.', 'Admin review needed.', lang),
        ctaLabel: pickLang('Voir les KPI', 'Ver KPI', 'View KPIs', lang),
        ctaEmphasis: true,
        payload: { type: 'scroll', id: 'admin-section-kpi' },
      });
    }

    const topMissing = missingFieldRows[0];
    if (topMissing && topMissing.missing > 0) {
      const pct = Math.round((topMissing.missing / Math.max(1, total)) * 100);
      if (topMissing.missing >= 4 || pct >= 12) {
        out.push({
          key: `missing-${topMissing.field}`,
          priority: 18,
          title: missingFieldRecTitle(topMissing.field, lang),
          signal: pickLang(
            `${topMissing.missing} profils · ${pct} %`,
            `${topMissing.missing} perfiles · ${pct} %`,
            `${topMissing.missing} profiles · ${pct}%`,
            lang
          ),
          context: pickLang('Part du réseau concernée.', 'Parte de la red.', 'Share of network.', lang),
          ctaLabel: pickLang('Champs à compléter', 'Campos', 'Missing fields', lang),
          payload: { type: 'scroll', id: 'admin-section-missing-fields' },
        });
      }
    }

    if (stats.incompleteProfilesStrict >= 3) {
      const pctStrict = Math.round((stats.incompleteProfilesStrict / total) * 100);
      out.push({
        key: 'strict-completion',
        priority: 22,
        title: pickLang('Complétion stricte', 'Completitud estricta', 'Strict completion', lang),
        signal: pickLang(
          `${stats.incompleteProfilesStrict} profils · ${pctStrict} %`,
          `${stats.incompleteProfilesStrict} perfiles · ${pctStrict} %`,
          `${stats.incompleteProfilesStrict} profiles · ${pctStrict}%`,
          lang
        ),
        context: pickLang(
          'Nom, secteur, bio 30+, photo.',
          'Nombre, sector, bio 30+, foto.',
          'Name, sector, 30+ bio, photo.',
          lang
        ),
        ctaLabel: pickLang('Voir la jauge', 'Ver medidor', 'View gauge', lang),
        payload: { type: 'scroll', id: 'admin-section-completion' },
      });
    }

    const hnc = attentionRec.highAttentionLowContactCount;
    if (hnc > 0) {
      const sample = attentionRec.highAttentionLowContactSample;
      const sampleName = sample ? formatPersonName(String(sample.nom ?? '').trim()) : '';
      out.push({
        key: 'attention-low-conversion',
        priority: 28,
        title: pickLang('Attention sans contact', 'Vistas sin contacto', 'Views, no contact', lang),
        signal: pickLang(`${hnc} profil${hnc > 1 ? 's' : ''}`, `${hnc} perfil(es)`, `${hnc} profile(s)`, lang),
        context: sampleName
          ? clipAdminRecText(
              pickLang(`Ex. ${sampleName}`, `Ej. ${sampleName}`, `e.g. ${sampleName}`, lang),
              72
            )
          : pickLang('Vues sans clic contact.', 'Vistas sin clic.', 'Views without contact clicks.', lang),
        ctaLabel: pickLang('Voir connexions', 'Ver vínculos', 'See connections', lang),
        payload: { type: 'scroll', id: 'admin-section-connect' },
      });
    }

    const topHub = relationshipPotential.memberScores[0];
    const hubThreshold = total < 35 ? 2 : 4;
    if (topHub && topHub.score >= hubThreshold) {
      const name = formatPersonName(String(topHub.nom ?? '').trim());
      out.push({
        key: 'connect-hub',
        priority: 32,
        title: pickLang('Membre pivot', 'Miembro pivote', 'Connector member', lang),
        signal: pickLang(
          `${topHub.score} liens passion`,
          `${topHub.score} vínculos`,
          `${topHub.score} passion ties`,
          lang
        ),
        context: clipAdminRecText(name, 48),
        ctaLabel: pickLang('Voir connexions', 'Ver vínculos', 'See connections', lang),
        payload: { type: 'scroll', id: 'admin-section-connect' },
      });
    }

    if (coverageGapMatrixRows.length > 0) {
      const g = coverageGapMatrixRows[0];
      out.push({
        key: 'coverage-gaps',
        priority: 38,
        title: pickLang('Gaps de couverture', 'Brechas de cobertura', 'Coverage gaps', lang),
        signal: pickLang(
          `${coverageGapMatrixRows.length} zones ≤ 2`,
          `${coverageGapMatrixRows.length} zonas ≤ 2`,
          `${coverageGapMatrixRows.length} thin zones`,
          lang
        ),
        context: clipAdminRecText(`${g.kind} « ${g.label} »`, 56),
        ctaLabel: pickLang('Carte des écarts', 'Mapa', 'Gap map', lang),
        payload: { type: 'scroll', id: 'admin-section-gaps' },
      });
    }

    const affTop = affinityTop3[0];
    if (affTop && affTop.members >= 2) {
      out.push({
        key: 'affinity-activate',
        priority: 42,
        title: pickLang('Affinité forte', 'Afinidad fuerte', 'Strong affinity', lang),
        signal: pickLang(
          `${affTop.members} membres`,
          `${affTop.members} miembros`,
          `${affTop.members} members`,
          lang
        ),
        context: clipAdminRecText(`${affTop.passionLabel} × ${affTop.sector}`, 58),
        ctaLabel: pickLang('Ouvrir la matrice', 'Abrir matriz', 'Open matrix', lang),
        ctaEmphasis: true,
        payload: {
          type: 'affinity',
          cross: { passionId: affTop.passionId, dimValue: affTop.sector, dimension: 'sector' },
        },
      });
    }

    const topPassion = relationshipPotential.topOverlapPassions[0];
    if (topPassion && topPassion.sectorCount >= 3 && (!affTop || topPassion.pid !== affTop.passionId)) {
      out.push({
        key: 'passion-transverse',
        priority: 46,
        title: pickLang('Passion transversale', 'Pasión transversal', 'Cross-cutting passion', lang),
        signal: pickLang(
          `${topPassion.sectorCount} secteurs`,
          `${topPassion.sectorCount} sectores`,
          `${topPassion.sectorCount} sectors`,
          lang
        ),
        context: clipAdminRecText(topPassion.label, 52),
        ctaLabel: pickLang('Affinités (bas de page)', 'Afinidad (abajo)', 'Affinities (bottom)', lang),
        payload: { type: 'scroll', id: 'admin-section-affinities' },
      });
    }

    const lv = attentionRec.lowVisibilityCount;
    if (lv >= Math.max(6, Math.ceil(total * 0.15))) {
      out.push({
        key: 'visibility-lift',
        priority: 48,
        title: pickLang('Visibilité basse', 'Baja visibilidad', 'Low visibility', lang),
        signal: pickLang(`${lv} profils`, `${lv} perfiles`, `${lv} profiles`, lang),
        context: pickLang('Aucune vue ni contact (période).', 'Sin vistas ni contactos.', 'No views or contacts.', lang),
        ctaLabel: pickLang('Champs manquants', 'Campos faltantes', 'Missing fields', lang),
        payload: { type: 'scroll', id: 'admin-section-missing-fields' },
      });
    }

    if (out.length < 4) {
      out.push({
        key: 'active-members-follow',
        priority: 72,
        title: pickLang('Membres engagés', 'Miembros activos', 'Engaged members', lang),
        signal: pickLang('Période en cours', 'Periodo actual', 'Current period', lang),
        context: pickLang('Qui porte le réseau.', 'Quién mueve la red.', 'Who drives the network.', lang),
        ctaLabel: pickLang('Liste active', 'Lista', 'Active list', lang),
        payload: { type: 'scroll', id: 'admin-section-active-members' },
      });
    }

    const seen = new Set<string>();
    const deduped: AdminRecommendedItem[] = [];
    for (const item of [...out].sort((a, b) => a.priority - b.priority)) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      deduped.push(item);
    }
    const all = deduped.slice(0, 6);
    return {
      primaryRecommended: all.slice(0, 3),
      secondaryRecommended: all.slice(3),
    };
  }, [
    lang,
    stats.totalProfiles,
    stats.pendingReviewProfiles,
    stats.incompleteProfilesStrict,
    missingFieldRows,
    attentionRec,
    relationshipPotential,
    coverageGapMatrixRows,
    affinityTop3,
  ]);
}
