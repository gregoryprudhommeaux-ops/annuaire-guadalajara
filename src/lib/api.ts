/**
 * Accès données côté client (Firebase). Pour Vite/React : appeler depuis un composant
 * (useEffect) ou un loader client — pas équivalent direct à une Server Component Next.js.
 */
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import type { ExplorerMember, CompanySize } from '@/lib/explorerProfilsCompute';
import type {
  CompanyKind,
  MemberExtended,
  MemberNeed,
  MemberStatus,
  NeedCategory,
} from '@/lib/communityMemberExtended';
import { isNeedCategory } from '@/lib/communityMemberExtended';
import { sanitizeHighlightedNeeds } from '@/needOptions';
import type { Language, UserProfile } from '@/types';
import type { MemberForFun, NeedForFun } from '@/components/FunFactCard';
import {
  filterNeedsSince,
  filterProfilesJoinedSince,
  memberNeedsToNeedForFun,
  startOfCurrentWeekLocal,
} from '@/lib/funFactData';

/** Besoins interprétés comme « networking » pour le Venn F&B / Networking. */
const NETWORKING_NEED_IDS = new Set([
  'NEED_CLIENTS',
  'NEED_DISTRIB',
  'NEED_PARTNERS',
  'NEED_SUPPLIERS',
  'NEED_SERVICE_PROV',
  'NEED_INVESTORS',
  'NEED_ECOSYSTEM',
  'NEED_MENTOR',
  'NEED_VISIBILITY',
  'NEED_RESEARCH',
]);

const GASTRONOMY_PASSION_IDS = new Set([
  'cuisine',
  'vins',
  'gastronomie',
  'mixologie',
  'patisserie',
]);

function companySizeToExplorer(
  companySize: UserProfile['companySize'] | undefined
): CompanySize {
  if (companySize === 'solo') return 'freelance';
  if (companySize === '2-10') return 'pme';
  if (companySize === '11-50') return 'pme';
  if (companySize === '50+') return 'corporate';
  return 'pme';
}

export function languagesFromProfile(p: UserProfile): string[] {
  const out = new Set<string>();
  out.add('es');
  if (p.accountType === 'foreign') {
    out.add('fr');
    out.add('en');
  } else {
    out.add('fr');
  }
  return Array.from(out).sort();
}

function interestTagsForVenn(p: UserProfile): string[] {
  const tags = new Set<string>();
  const needs = sanitizeHighlightedNeeds(p.highlightedNeeds);
  for (const n of needs) {
    tags.add(n);
    if (NETWORKING_NEED_IDS.has(n)) tags.add('Networking');
  }

  const cat = p.activityCategory ?? '';
  if (cat === 'Hôtellerie & Restauration' || cat === 'Agriculture & Agroalimentaire') {
    tags.add('F&B');
  }

  const passions = sanitizePassionIds(p.passionIds);
  if (passions.some((id) => GASTRONOMY_PASSION_IDS.has(id))) {
    tags.add('F&B');
  }

  const pos = p.positionCategory ?? '';
  if (/Vente|Marketing|Conseil/.test(pos)) {
    tags.add('Networking');
  }

  if (
    passions.length > 0 ||
    cat === 'Tourisme' ||
    cat === 'Culture & Loisirs' ||
    cat === 'Hôtellerie & Restauration'
  ) {
    tags.add('Afterwork');
  }

  return Array.from(tags);
}

/** Variation stable 1–5 pour les axes radar (en attendant des champs dédiés en base). */
function radarScoresFromProfile(p: UserProfile): Pick<
  ExplorerMember,
  | 'exportOrientation'
  | 'eventsAppetite'
  | 'networkingNeeds'
  | 'digitalMaturity'
  | 'teamSizeScore'
  | 'exchangeFrequency'
> {
  const seed = p.uid || p.email || 'anonymous';
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const r = (shift: number) => 1 + (Math.abs(h >> shift) % 5);

  let digitalMaturity = r(3);
  if ((p.positionCategory ?? '').includes('Informatique')) {
    digitalMaturity = 5;
  }

  let teamSizeScore = r(9);
  if (p.companySize === 'solo') teamSizeScore = 1;
  if (p.companySize === '50+') teamSizeScore = 5;

  let exportOrientation = r(0);
  if (p.accountType === 'foreign') {
    exportOrientation = Math.min(5, exportOrientation + 1);
  }

  return {
    exportOrientation,
    eventsAppetite: r(4),
    networkingNeeds: r(6),
    digitalMaturity,
    teamSizeScore,
    exchangeFrequency: r(12),
  };
}

export function profileSector(p: UserProfile): string {
  return (
    (p.activityCategory && p.activityCategory.trim()) ||
    (p.targetSectors && String(p.targetSectors).split(',')[0]?.trim()) ||
    '—'
  );
}

function profileToCompanyKind(p: UserProfile): CompanyKind {
  if (p.communityCompanyKind) return p.communityCompanyKind;
  if (p.companySize === 'solo') return 'independent';
  if (p.companySize === '50+') return 'corporate';
  return 'pme';
}

function profileToMemberStatus(p: UserProfile): MemberStatus {
  if (p.communityMemberStatus) return p.communityMemberStatus;
  if (p.companySize === 'solo') return 'freelance';
  return 'owner';
}

function profileToYearsInGdl(p: UserProfile): number {
  if (
    typeof p.communityYearsInGdl === 'number' &&
    Number.isFinite(p.communityYearsInGdl) &&
    p.communityYearsInGdl >= 0
  ) {
    return Math.min(50, Math.floor(p.communityYearsInGdl));
  }
  const y = p.arrivalYear;
  const nowY = new Date().getFullYear();
  if (typeof y === 'number' && y >= 1990 && y <= nowY) {
    return Math.max(0, nowY - y);
  }
  const seed = p.uid || p.email || 'x';
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 6;
}

/**
 * Profil `users` → `MemberExtended` (dashboard, heatmaps).
 * Champs optionnels : `communityYearsInGdl`, `communityCompanyKind`, `communityMemberStatus`.
 * Sinon : `arrivalYear`, `companySize`, hash stable sur `uid`.
 */
export function userProfileToMemberExtended(p: UserProfile): MemberExtended {
  return {
    id: p.uid,
    sector: profileSector(p),
    companySize: profileToCompanyKind(p),
    yearsInGDL: profileToYearsInGdl(p),
    status: profileToMemberStatus(p),
    city: (p.city ?? '').trim() || '—',
    country: (p.country ?? '').trim() || 'Mexique',
  };
}

/** Données « fun fact » (passions traduites selon `lang`). */
export function userProfileToMemberForFun(p: UserProfile, lang: Language): MemberForFun {
  const m = userProfileToMemberExtended(p);
  const hobbies = sanitizePassionIds(p.passionIds).map((id) => getPassionLabel(id, lang));
  return {
    id: p.uid,
    sector: m.sector,
    city: m.city,
    country: m.country,
    yearsInGDL: m.yearsInGDL,
    hobbies,
    languages: languagesFromProfile(p),
  };
}

/**
 * Mappe un profil annuaire (`users`) vers le modèle utilisé par `ExplorerProfils`.
 */
export function userProfileToExplorerMember(p: UserProfile): ExplorerMember {
  const sector = profileSector(p);

  const tags = interestTagsForVenn(p);
  const radar = radarScoresFromProfile(p);

  return {
    id: p.uid,
    name: p.fullName?.trim() || p.companyName?.trim() || p.uid,
    sector,
    city: (p.city ?? '').trim() || '—',
    country: (p.country ?? '').trim() || 'Mexique',
    languages: languagesFromProfile(p),
    companySize: companySizeToExplorer(p.companySize),
    ...radar,
    tags,
  };
}

/**
 * Charge tous les profils publics (collection `users`, même requête que l’annuaire principal).
 */
export async function getMembers(): Promise<ExplorerMember[]> {
  const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => userProfileToExplorerMember(d.data() as UserProfile));
}

/**
 * Profils `users` → `MemberExtended` (dashboard communauté / heatmap besoins).
 * Utilise les champs communauté optionnels sur la fiche quand ils sont renseignés.
 */
export async function getMembersExtended(): Promise<MemberExtended[]> {
  const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => userProfileToMemberExtended(d.data() as UserProfile));
}

/**
 * Un seul aller-retour Firestore pour le tableau de bord : profils bruts + besoins.
 */
export async function loadDashboardFirestoreData(): Promise<{
  profiles: UserProfile[];
  needs: MemberNeed[];
}> {
  const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
  const [snap, needs] = await Promise.all([getDocs(q), getNeeds()]);
  const profiles = snap.docs.map((d) => d.data() as UserProfile);
  return { profiles, needs };
}

function firestoreDateToIsoDate(v: unknown): string {
  if (v instanceof Timestamp) {
    return v.toDate().toISOString().slice(0, 10);
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    return v.slice(0, 10);
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    return new Date(v).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Besoins analytics : collection `member_needs` (lecture publique).
 * Documents : `{ memberId, sector, need, createdAt }` avec `need` ∈ NeedCategory.
 */
export async function getNeeds(): Promise<MemberNeed[]> {
  const snap = await getDocs(collection(db, 'member_needs'));
  const out: MemberNeed[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const memberId = typeof d.memberId === 'string' ? d.memberId : '';
    const sector = typeof d.sector === 'string' ? d.sector : '';
    const needRaw = typeof d.need === 'string' ? d.need : '';
    if (!memberId || !sector || !isNeedCategory(needRaw)) return;
    out.push({
      memberId,
      sector,
      need: needRaw,
      createdAt: firestoreDateToIsoDate(d.createdAt),
    });
  });
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Enregistre un besoin analytics pour le membre connecté (`memberId` = uid).
 */
export async function addMemberNeed(input: {
  memberId: string;
  sector: string;
  need: NeedCategory;
}): Promise<void> {
  await addDoc(collection(db, 'member_needs'), {
    memberId: input.memberId,
    sector: input.sector.trim(),
    need: input.need,
    createdAt: serverTimestamp(),
  });
}

/**
 * Équivalent Firestore de `db.member.findMany({ where: { createdAt: { gte } } })` :
 * collection `users`, filtre depuis le **lundi 00:00 (heure locale)**.
 *
 * Mapping → `MemberForFun` : `hobbies` = libellés des `passionIds`, `languages` = heuristique profil,
 * `yearsInGDL` = champ communauté ou dérivé (voir `userProfileToMemberExtended`).
 *
 * `lang` : libellés des passions ; défaut `fr`. Côté client : `useEffect` ; côté Next : RSC / route API.
 */
export async function getNewMembersThisWeek(
  lang: Language = 'fr'
): Promise<MemberForFun[]> {
  const q = query(collection(db, 'users'), orderBy('fullName', 'asc'));
  const snap = await getDocs(q);
  const profiles = snap.docs.map((d) => d.data() as UserProfile);
  const since = startOfCurrentWeekLocal();
  return filterProfilesJoinedSince(profiles, since).map((p) =>
    userProfileToMemberForFun(p, lang)
  );
}

/**
 * Équivalent Firestore de `db.need.findMany` sur les 7 derniers jours **calendaires** alignés semaine :
 * collection `member_needs`, même fenêtre que {@link getNewMembersThisWeek} (`need` = type Prisma).
 */
export async function getNeedsThisWeek(): Promise<NeedForFun[]> {
  const needs = await getNeeds();
  return memberNeedsToNeedForFun(filterNeedsSince(needs, startOfCurrentWeekLocal()));
}
