import type { AdminStats, AdminProfileDashboardRow } from '@/hooks/useAdminStats';
import {
  getProfileCompletionItems,
  profileCompletionDefaultLabels,
  type ProfileCompletionKey,
} from '@/lib/profileCompletion';
import { sanitizePassionIds } from '@/lib/passionConfig';
import { Timestamp } from 'firebase/firestore';
import type { Language } from '@/types';

export type AdminPriorityFilter =
  | 'all'
  | 'new_incomplete'
  | 'active_incomplete'
  | 'no_photo'
  | 'bio_incomplete'
  | 'no_sector';

export type PriorityProfileRow = {
  profile: AdminProfileDashboardRow;
  /** Score 0–100 */
  priorityCompletionScore: number;
  parts: {
    incompleteness: number;
    signupRecency: number;
    lastSeenActivity: number;
    networkPotential: number;
  };
  missingReasons: string[];
  primaryMissingKey: ProfileCompletionKey | null;
  suggestedMessage: string;
};

const MS_DAY = 86_400_000;

function daysSince(t: number): number {
  return (Date.now() - t) / MS_DAY;
}

export function isProfileStrictCompleteRow(p: {
  nom: string;
  secteur?: string;
  description?: string;
  photo?: string;
}): boolean {
  const nameOk = Boolean(String(p.nom ?? '').trim());
  const sectorOk = Boolean(String(p.secteur ?? '').trim());
  const descOk = String(p.description ?? '').trim().length >= 30;
  const photoOk = Boolean(String(p.photo ?? '').trim());
  return nameOk && sectorOk && descOk && photoOk;
}

function scoreIncompleteness(readinessPct: number): number {
  const inv = 100 - Math.min(100, Math.max(0, readinessPct));
  return (inv / 100) * 40;
}

function scoreSignup(createdAt: Timestamp | undefined): number {
  if (!createdAt?.toDate) return 0;
  const d = daysSince(createdAt.toDate().getTime());
  if (d <= 7) return 25;
  if (d <= 14) return 20;
  if (d <= 30) return 12;
  if (d <= 90) return 5;
  return 0;
}

function scoreLastSeen(lastSeen: number | undefined): number {
  if (lastSeen == null || lastSeen <= 0) return 0;
  const d = daysSince(lastSeen);
  if (d <= 1) return 20;
  if (d <= 2) return 18;
  if (d <= 7) return 12;
  if (d <= 30) return 6;
  return 2;
}

function isUnderrepresentedSector(secteur: string | undefined, bySector: Record<string, number>): number {
  if (!secteur || !String(secteur).trim()) return 0;
  const counts = Object.values(bySector).filter((n) => n > 0);
  if (counts.length < 2) return 0;
  const sorted = [...counts].sort((a, b) => a - b);
  const me = bySector[secteur] ?? 0;
  const q = sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0]!;
  return me > 0 && me <= q ? 1 : 0;
}

function scoreNetwork(
  p: AdminProfileDashboardRow,
  passionOverlapCount: number,
  connectTopIds: Set<string>,
  underrepBonus: boolean
): number {
  const views = p.profileViewCount;
  const contacts = p.contactClicks;
  const v = Math.min(5, Math.log1p(views) * 1.4);
  const c = Math.min(4, Math.sqrt(contacts) * 1.2);
  const o = Math.min(4, Math.log1p(passionOverlapCount) * 1.1);
  const u = underrepBonus ? 1.5 : 0;
  const conn = connectTopIds.has(p.id) ? 1.5 : 0;
  const raw = v + c + o + u + conn;
  return Math.min(15, (raw / 16) * 15);
}

function buildSuggestedMessageForRow(
  p: AdminProfileDashboardRow,
  key: ProfileCompletionKey | null,
  pick: (f: string, s: string, e: string) => string
): string {
  if (!String(p.photo ?? '').trim()) {
    return pick(
      'Ajouter une photo rend votre profil plus visible et inspire davantage confiance.',
      'Añadir una foto hace su perfil más visible y transmite confianza.',
      'Adding a photo makes your profile more visible and easier to trust.'
    );
  }
  if (!String(p.secteur ?? '').trim()) {
    return pick(
      'Renseigner votre secteur améliore votre présence dans les recherches du réseau.',
      'Indicar su sector mejora su presencia en las búsquedas de la red.',
      'Filling in your sector improves your presence in network searches.'
    );
  }
  return buildKeySuggestedMessage(key, pick);
}

function buildKeySuggestedMessage(
  key: ProfileCompletionKey | null,
  pick: (f: string, s: string, e: string) => string
): string {
  if (!key) {
    return pick(
      "Compléter votre fiche améliore votre visibilité auprès de l'ensemble du réseau.",
      'Completar su ficha mejora su visibilidad en la red.',
      'Completing your profile improves your visibility across the network.'
    );
  }
  const m: Partial<Record<ProfileCompletionKey, [string, string, string]>> = {
    fullName: [
      'Votre nom est la base d’identification dans l’annuaire.',
      'Su nombre es la base de identidad en el directorio.',
      'Your name is the basis for identification in the directory.',
    ],
    email: [
      "L’e-mail vérifié renforce la confiance et la prise de contact.",
      'Un correo verificado mejora la confianza y el contacto.',
      'A verified email builds trust and makes contact easier.',
    ],
    workLanguages: [
      'Indiquer vos langues de travail facilite les mises en relation ciblées.',
      'Indicar idiomas de trabajo facilita ponerse en contacto.',
      'Listing working languages helps the network match the right people.',
    ],
    memberBio: [
      'Quelques lignes de présentation aideront les autres membres à mieux comprendre votre activité.',
      'Unas líneas de presentación ayudan a entender su actividad.',
      'A short personal introduction helps members understand your activity.',
    ],
    activityDescription: [
      "Décrire votre activité (secteur, offre) améliore votre présence dans les recherches du réseau.",
      'Describir su actividad mejora su presencia en búsquedas.',
      'Describing your offer improves your presence in network searches.',
    ],
    companyName: [
      'Renseigner la société ou l’activité rassure et contextualise les échanges.',
      'Rellenar la empresa o actividad da contexto a las conversaciones.',
      'Adding a company or activity name provides useful context.',
    ],
    networkGoal: [
      'Clarifier ce que vous cherchez via le réseau cible de meilleures recommandations.',
      'Alinear lo que busca con la red mejora las recomendaciones.',
      'Clarifying what you seek from the network improves matching.',
    ],
    helpNewcomers: [
      "Indiquer en quoi vous pouvez aider donne de la matière aux mises en relation qualifiées.",
      'Explicar en qué puede ayudar genera conexiones más útiles.',
      'Saying what you can offer creates more useful introductions.',
    ],
    phoneWhatsapp: [
      'Un moyen de contact direct facilite la prise de contact lorsque c’est opportun pour vous.',
      'Un canal directo (tel./WhatsApp) agiliza el contacto cuando usted quiera.',
      'A direct contact method speeds up outreach when you want it.',
    ],
    linkedinUrl: [
      'Un lien LinkedIn rassure et complète l’annuaire pour le profil pro.',
      'Un enlace a LinkedIn completa su perfil profesional.',
      'A LinkedIn link strengthens your professional profile.',
    ],
    passions: [
      'Les passions aident le réseau à créer des points d’appui communs — renseignez-les quand c’est possible.',
      'Añada intereses: crean afinidades para conversaciones y reuniones.',
      'Interests help find common ground — add a few when you can.',
    ],
    highlightedNeeds: [
      "Des besoins indiqués alignent votre profil sur les recherches des autres.",
      'Indicar necesidades alinea su perfil con búsquedas del resto de la red.',
      'Stated needs align your profile with what others are looking for.',
    ],
    keywords: [
      "Des mots-clés aident le référencement de votre fiche.",
      'Palabras clave ayudan a que su ficha se encuentre.',
      'Keywords help your profile surface in search.',
    ],
  };
  const t = m[key] ?? m.memberBio!;
  return pick(t[0]!, t[1]!, t[2]!);
}

function buildMissingDisplayReasons(
  p: AdminProfileDashboardRow,
  labelMap: Record<ProfileCompletionKey, string>,
  pick: (f: string, s: string, e: string) => string
): string[] {
  const extra: string[] = [];
  if (!String(p.photo ?? '').trim()) {
    extra.push(pick('Photo manquante', 'Foto faltante', 'Missing photo'));
  }
  if (!String(p.secteur ?? '').trim()) {
    extra.push(pick('Secteur absent', 'Sector faltante', 'Missing sector'));
  }
  const fromKeys = p.missingFieldKeys.map((k) => labelMap[k] ?? k);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...extra, ...fromKeys]) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 4) break;
  }
  return out;
}

function buildConnectTopIds(stats: AdminStats, limit = 8): Set<string> {
  const profiles = (stats.profilesForDashboard ?? []) as Array<{
    id: string;
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
  return new Set(
    profiles
      .map((p) => {
        const id = String(p.id);
        const passions = memberToPassions.get(id) ?? [];
        const overlap = new Set<string>();
        passions.forEach((pid) => {
          passionToMembers.get(pid)?.forEach((o) => {
            if (o !== id) overlap.add(o);
          });
        });
        return { id, score: overlap.size };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.id)
  );
}

function buildPassionOverlapMap(stats: AdminStats): Map<string, number> {
  const profiles = (stats.profilesForDashboard ?? []) as Array<{ id: string; passionIds?: string[] }>;
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
  const out = new Map<string, number>();
  for (const p of profiles) {
    const id = String(p.id);
    const passions = memberToPassions.get(id) ?? [];
    const overlap = new Set<string>();
    passions.forEach((pid) => {
      passionToMembers.get(pid)?.forEach((o) => {
        if (o !== id) overlap.add(o);
      });
    });
    out.set(id, overlap.size);
  }
  return out;
}

/**
 * Lignes triées par `priorityCompletionScore` décroissant (profils strictement incomplets seulement).
 */
export function buildAdminPriorityProfileRows(
  stats: AdminStats,
  lang: Language,
  pick: (f: string, s: string, e: string) => string
): PriorityProfileRow[] {
  const bySector = stats.profilesBySector;
  const connectTop = buildConnectTopIds(stats);
  const passionOverlap = buildPassionOverlapMap(stats);
  const labelMap = profileCompletionDefaultLabels(lang);
  const out: PriorityProfileRow[] = [];

  for (const p of stats.profilesForDashboard ?? []) {
    if (isProfileStrictCompleteRow(p)) continue;

    const inc = scoreIncompleteness(p.readinessPct);
    const su = scoreSignup(p.createdAt);
    const ls = scoreLastSeen(p.lastSeen);
    const under = isUnderrepresentedSector(p.secteur, bySector);
    const net = scoreNetwork(
      p,
      passionOverlap.get(p.id) ?? 0,
      connectTop,
      under > 0
    );

    const priorityCompletionScore = Math.min(100, Math.round(inc + su + ls + net));
    const primaryKey: ProfileCompletionKey | null =
      p.missingFieldKeys.length > 0 ? p.missingFieldKeys[0]! : null;
    const reasons = buildMissingDisplayReasons(p, labelMap, pick);

    out.push({
      profile: p,
      priorityCompletionScore,
      parts: { incompleteness: inc, signupRecency: su, lastSeenActivity: ls, networkPotential: net },
      missingReasons: reasons,
      primaryMissingKey: primaryKey,
      suggestedMessage: buildSuggestedMessageForRow(p, primaryKey, pick),
    });
  }

  return out.sort((a, b) => b.priorityCompletionScore - a.priorityCompletionScore);
}

export function filterPriorityRows(
  rows: PriorityProfileRow[],
  filter: AdminPriorityFilter
): PriorityProfileRow[] {
  if (filter === 'all') return rows;
  return rows.filter((r) => {
    const p = r.profile;
    const created = p.createdAt?.toDate?.()?.getTime() ?? 0;
    const ageDays = (Date.now() - created) / MS_DAY;
    const last = p.lastSeen;
    const lastOk = last && last > 0 ? (Date.now() - last) / MS_DAY <= 7 : false;
    const hasPhoto = Boolean(String(p.photo ?? '').trim());
    const hasSector = Boolean(String(p.secteur ?? '').trim());
    const bioShort =
      p.missingFieldKeys.includes('memberBio') || p.missingFieldKeys.includes('activityDescription');
    switch (filter) {
      case 'new_incomplete':
        return ageDays <= 30;
      case 'active_incomplete':
        return lastOk;
      case 'no_photo':
        return !hasPhoto;
      case 'bio_incomplete':
        return bioShort;
      case 'no_sector':
        return !hasSector;
      default:
        return true;
    }
  });
}

export function countIncompleteStrict(stats: AdminStats): number {
  return (stats.profilesForDashboard ?? []).filter((p) => !isProfileStrictCompleteRow(p)).length;
}

export function countNewIncomplete(stats: AdminStats, days = 30): number {
  const t = Date.now() - days * MS_DAY;
  return (stats.profilesForDashboard ?? []).filter((p) => {
    if (isProfileStrictCompleteRow(p)) return false;
    const c = p.createdAt?.toDate?.()?.getTime() ?? 0;
    return c >= t;
  }).length;
}

export function countNoPhoto(stats: AdminStats): number {
  return (stats.profilesForDashboard ?? []).filter(
    (p) => !isProfileStrictCompleteRow(p) && !String(p.photo ?? '').trim()
  ).length;
}

export function countActiveIncompleteToNudge(stats: AdminStats, days = 7): number {
  const t = Date.now() - days * MS_DAY;
  return (stats.profilesForDashboard ?? []).filter((p) => {
    if (isProfileStrictCompleteRow(p)) return false;
    const ls = p.lastSeen;
    return typeof ls === 'number' && ls >= t;
  }).length;
}
