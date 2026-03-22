/**
 * Accès données côté client (Firebase). Pour Vite/React : appeler depuis un composant
 * (useEffect) ou un loader client — pas équivalent direct à une Server Component Next.js.
 */
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { sanitizePassionIds } from '@/lib/passionConfig';
import type { ExplorerMember, CompanySize } from '@/lib/explorerProfilsCompute';
import { sanitizeHighlightedNeeds } from '@/needOptions';
import type { UserProfile } from '@/types';

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

function languagesFromProfile(p: UserProfile): string[] {
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

/**
 * Mappe un profil annuaire (`users`) vers le modèle utilisé par `ExplorerProfils`.
 */
export function userProfileToExplorerMember(p: UserProfile): ExplorerMember {
  const sector =
    (p.activityCategory && p.activityCategory.trim()) ||
    (p.targetSectors && String(p.targetSectors).split(',')[0]?.trim()) ||
    '—';

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
